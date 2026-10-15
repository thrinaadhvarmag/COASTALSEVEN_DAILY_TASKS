import { useRef, useState } from "react";
import { Camera, Edit3, ShieldCheck, UserRound, X, Save, Trash2, Lock, PackageOpen, Heart, Mail, User, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { API_URL, getErrorMessage } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: user?.username || "", email: user?.email || "" });
  const inputRef = useRef();

  const choose = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 5 * 1024 * 1024) {
      show("Use JPG, PNG or WEBP under 5 MB", "error");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setSaving(true);
    try {
      let current = user;
      const { data } = await api.put("/auth/me", form);
      current = data;
      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        const r = await api.post("/auth/me/profile-picture", fd, { headers: { "Content-Type": "multipart/form-data" } });
        current = r.data;
      }
      updateUser(current);
      setFile(null);
      setPreview(current.profile_image_url ? `${API_URL}${current.profile_image_url}` : "");
      setEditing(false);
      show("Profile updated successfully", "success");
    } catch (e) {
      show(getErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async () => {
    setSaving(true);
    try {
      const { data } = await api.delete("/auth/me/profile-picture");
      updateUser(data);
      setFile(null);
      setPreview("");
      show("Profile picture removed", "info");
    } catch (e) {
      show(getErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const avatar = preview || (user?.profile_image_url ? `${API_URL}${user.profile_image_url}` : "");
  const initial = (user?.username || "R")[0].toUpperCase();

  return (
    <div className="container page-section profile-page-container">
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <span className="eyebrow"><ShieldCheck size={14} color="var(--accent)" /> Verified Rebel Account</span>
          <h1 className="profile-main-title">Your Profile</h1>
          <p className="profile-subtitle">Manage your personal information, cinema fandom status, and account settings.</p>
        </div>
        <div className="profile-header-actions">
          <Link className="btn-secondary" to="/orders">
            <PackageOpen size={16} /> My Orders
          </Link>
          <Link className="btn-secondary" to="/wishlist">
            <Heart size={16} /> Wishlist
          </Link>
          {!editing ? (
            <button
              className="btn-primary"
              onClick={() => {
                setForm({ username: user?.username || "", email: user?.email || "" });
                setEditing(true);
              }}
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
                setForm({ username: user?.username || "", email: user?.email || "" });
                setFile(null);
                setPreview("");
              }}
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="profile-modern-grid">
        {/* Left Column: Identity Card */}
        <section className="profile-identity-card card">
          <div className="avatar-container">
            <div className="profile-avatar-circle">
              {avatar ? (
                <img src={avatar} alt="Profile" className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-initial">{initial}</span>
              )}
            </div>
            {editing && (
              <button
                type="button"
                className="avatar-upload-badge"
                onClick={() => inputRef.current?.click()}
                title="Upload profile picture"
                aria-label="Upload profile picture"
              >
                <Camera size={16} />
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

          <div className="profile-identity-info">
            <h2 className="profile-username">{user?.username || "Rebel Fan"}</h2>
            <div className="profile-badge-row">
              <span className="role-badge">
                <ShieldCheck size={14} />
                {user?.role === "admin" ? "Administrator" : "Rebel Member"}
              </span>
              <span className="status-badge">
                <CheckCircle2 size={13} /> Active
              </span>
            </div>
            <p className="profile-join-date">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "October 2026"}
            </p>
          </div>

          {editing && (
            <div className="avatar-controls">
              <button type="button" className="btn-secondary tiny" onClick={() => inputRef.current?.click()}>
                <Camera size={14} /> Change Photo
              </button>
              {(file || user?.profile_image_url) && (
                <button type="button" className="btn-danger tiny" onClick={removeImage}>
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="profile-shortcuts">
            <Link to="/orders" className="profile-shortcut-item">
              <PackageOpen size={16} color="var(--accent)" />
              <span>Track Orders</span>
            </Link>
            <Link to="/rewards" className="profile-shortcut-item">
              <ShieldCheck size={16} color="var(--accent)" />
              <span>Loyalty Points</span>
            </Link>
          </div>
        </section>

        {/* Right Column: Account Details & Security */}
        <div className="profile-content-column">
          {/* Personal Information Form Card */}
          <section className="card profile-section-card">
            <div className="profile-section-heading">
              <div>
                <h2>Personal Information</h2>
                <p>Your public identity and contact details across Rebel Mart.</p>
              </div>
              <div className="profile-heading-icon">
                <UserRound size={20} color="var(--accent)" />
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-field-group">
                <label className="profile-field-label">
                  <User size={15} /> Username
                </label>
                <input
                  className="input profile-field-input"
                  disabled={!editing}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Your username"
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">
                  <Mail size={15} /> Email Address
                </label>
                <input
                  className="input profile-field-input"
                  type="email"
                  disabled={!editing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {editing && (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setForm({ username: user.username, email: user.email });
                    setFile(null);
                    setPreview("");
                  }}
                >
                  <X size={16} /> Cancel
                </button>
                <button type="button" className="btn-primary" disabled={saving} onClick={save}>
                  <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </section>

          {/* Account Security Card */}
          <section className="card profile-section-card profile-security-card">
            <div className="profile-section-heading">
              <div>
                <h2>Account Security</h2>
                <p>Authentication and session protection protocols.</p>
              </div>
              <div className="profile-heading-icon">
                <Lock size={20} color="var(--accent)" />
              </div>
            </div>

            <div className="security-status-box">
              <div className="security-icon-circle">
                <ShieldCheck size={22} color="var(--accent)" />
              </div>
              <div className="security-status-copy">
                <strong>Session Protected by Two-Factor OTP & JWT Flow</strong>
                <p>
                  Every sign-in is guarded with 6-digit cryptographic verification dispatched to your verified email address.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
