import { useRef, useState } from 'react';
import { Camera, Edit3, ShieldCheck, UserRound, X, Save, Trash2, Lock } from 'lucide-react';
import api from '../services/api';
import { API_URL, getErrorMessage } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
export default function Profile() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const inputRef = useRef();

  const choose = (f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024) {
      show('Use JPG, PNG or WEBP under 5 MB', 'error');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const save = async () => {
    setSaving(true);
    try {
      let current = user;
      const { data } = await api.put('/auth/me', form);
      current = data;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        const r = await api.post('/auth/me/profile-picture', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        current = r.data;
      }
      updateUser(current);
      setFile(null);
      setPreview(current.profile_image_url ? `${API_URL}${current.profile_image_url}` : '');
      setEditing(false);
      show('Profile updated successfully');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };
  const removeImage = async () => {
    setSaving(true);
    try {
      const { data } = await api.delete('/auth/me/profile-picture');
      updateUser(data);
      setFile(null);
      setPreview('');
      show('Profile picture removed');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };
  const avatar = preview || '';
  const initial = (user?.username || 'R')[0].toUpperCase();
  return (
    <div className="container page-section">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Account</div>
          <h1>Your profile</h1>
          <p>Keep your account details and profile picture up to date.</p>
        </div>
        {!editing && (
          <button
            className="btn-primary"
            onClick={() => {
              setForm({ username: user?.username || '', email: user?.email || '' });
              setEditing(true);
            }}
          >
            <Edit3 size={16} />
            Edit profile
          </button>
        )}
      </div>

      <div className="profile-grid">
        <section className="profile-card card">
          <div className="avatar-wrap">
            <div className="profile-avatar">
              {avatar ? <img src={avatar} alt="Profile" /> : initial}
            </div>
            {editing && (
              <button
                className="camera-btn"
                onClick={() => inputRef.current?.click()}
                aria-label="Change profile picture"
              >
                <Camera size={17} />
              </button>
            )}
            <input
              ref={inputRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </div>
          <div className="profile-name">
            <h2>{user?.username}</h2>
            <span className="role-pill">
              <ShieldCheck size={14} />
              {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </span>
          </div>
          <p className="muted">
            Member since{' '}
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}
          </p>
          {editing && (
            <div className="avatar-actions">
              <button className="btn-secondary tiny" onClick={() => inputRef.current?.click()}>
                <Camera size={14} />
                Change
              </button>

              {(file || user?.profile_image_url) && (
                <button className="btn-danger tiny" onClick={removeImage}>
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>
          )}
        </section>

        <section className="card profile-form">
          <div className="section-title">
            <div>
              <h2>Personal information</h2>
              <p>These details are used across your Rebel Mart account.</p>
            </div>
            <UserRound />
          </div>
          <div className="form-grid">
            <label>
              <span>Username</span>
              <input
                className="input"
                disabled={!editing}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                className="input"
                type="email"
                disabled={!editing}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>
          {editing && (
            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setForm({ username: user.username, email: user.email });
                  setPreview(user.profile_image_url ? `${API_URL}${user.profile_image_url}` : '');
                  setFile(null);
                }}
              >
                <X size={16} />
                Cancel
              </button>

              <button className="btn-primary" disabled={saving} onClick={save}>
                <Save size={16} />

                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}
          <div className="security-note">
            <Lock size={17} />
            <div>
              <strong>Account security</strong>
              <p>
                Your session is protected by the application&apos;s JWT authentication flow.
                Password changes can be added as a separate security action.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
