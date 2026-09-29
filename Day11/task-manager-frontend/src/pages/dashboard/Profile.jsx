import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/authService";

function Profile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch((requestError) => setError(requestError.response?.data?.detail || "Unable to load profile."));
    }, []);

    if (error) return <div className="alert alert-error">{error}</div>;
    if (!user) return <div className="loading-state">Loading profile...</div>;

    return (
        <div>
            <div className="page-header"><div><span className="eyebrow">PROFILE</span><h1>My profile</h1><p>Data returned by GET /auth/me.</p></div></div>
            <section className="card profile-card">
                <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
                <div className="profile-info"><h2>{user.username}</h2><p>{user.email}</p><span className="role-pill">{user.role}</span></div>
                <div className="details-grid profile-details"><div><span>User ID</span><strong>{user.id}</strong></div><div><span>Created</span><strong>{new Date(user.created_at).toLocaleString()}</strong></div></div>
            </section>
        </div>
    );
}

export default Profile;
