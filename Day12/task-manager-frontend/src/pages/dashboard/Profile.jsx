import { useEffect, useRef, useState } from "react";
import {
    deleteProfilePicture,
    getCurrentUser,
    updateCurrentUser,
    uploadProfilePicture,
} from "../../services/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getProfileImageUrl(imageUrl) {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
}

function Profile() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        getCurrentUser()
            .then((currentUser) => {
                setUser(currentUser);
                setFormData({
                    username: currentUser.username,
                    email: currentUser.email,
                });
            })
            .catch((requestError) => {
                setError(
                    requestError.response?.data?.detail ||
                    "Unable to load profile."
                );
            });
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function startEditing() {
        setError("");
        setSuccess("");
        setFormData({
            username: user.username,
            email: user.email,
        });
        setIsEditing(true);
    }

    function cancelEditing() {
        setError("");
        setSuccess("");
        setFormData({
            username: user.username,
            email: user.email,
        });
        setIsEditing(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const username = formData.username.trim();
        const email = formData.email.trim();

        if (username.length < 3) {
            setError("Username must contain at least 3 characters.");
            return;
        }

        if (!email) {
            setError("Email is required.");
            return;
        }

        setIsSaving(true);

        try {
            const updatedUser = await updateCurrentUser({
                username,
                email,
            });

            setUser(updatedUser);
            setFormData({
                username: updatedUser.username,
                email: updatedUser.email,
            });
            setIsEditing(false);
            setSuccess("Profile updated successfully.");
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Unable to update profile."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleProfilePictureChange(event) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        setError("");
        setSuccess("");

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            setError("Please choose a JPG, PNG, or WEBP image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Profile image must be 5 MB or smaller.");
            return;
        }

        setIsUploadingImage(true);

        try {
            const updatedUser = await uploadProfilePicture(file);
            setUser(updatedUser);
            setSuccess("Profile picture updated successfully.");
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Unable to upload profile picture."
            );
        } finally {
            setIsUploadingImage(false);
        }
    }

    async function handleRemoveProfilePicture() {
        setError("");
        setSuccess("");
        setIsUploadingImage(true);

        try {
            const updatedUser = await deleteProfilePicture();
            setUser(updatedUser);
            setSuccess("Profile picture removed successfully.");
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Unable to remove profile picture."
            );
        } finally {
            setIsUploadingImage(false);
        }
    }

    if (error && !user) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!user) {
        return <div className="loading-state">Loading profile...</div>;
    }

    const profileImageUrl = getProfileImageUrl(user.profile_image_url);
    const initials = user.username.slice(0, 1).toUpperCase();

    return (
        <div>
            <div className="page-header profile-page-header">
                <div>
                    <span className="eyebrow">PROFILE</span>
                    <h1>My profile</h1>
                    <p>View and manage your account information.</p>
                </div>

                {!isEditing && (
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={startEditing}
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {success && (
                <div className="profile-message profile-message-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="profile-message profile-message-error">
                    {error}
                </div>
            )}

            {!isEditing ? (
                <section className="card profile-card">
                    <div className="profile-avatar-wrap">
                        <div className="avatar profile-avatar">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt={`${user.username} profile`}
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                initials
                            )}
                        </div>
                    </div>

                    <div className="profile-info">
                        <h2>{user.username}</h2>
                        <p>{user.email}</p>
                        <span className="role-pill">{user.role}</span>
                    </div>

                    <div className="details-grid profile-details">
                        <div>
                            <span>User ID</span>
                            <strong>{user.id}</strong>
                        </div>

                        <div>
                            <span>Created</span>
                            <strong>
                                {new Date(user.created_at).toLocaleString()}
                            </strong>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="card profile-edit-card">
                    <div className="profile-edit-heading">
                        <div>
                            <span className="eyebrow">ACCOUNT SETTINGS</span>
                            <h2>Edit Profile</h2>
                            <p>Update your profile details and profile picture.</p>
                        </div>
                    </div>

                    <div className="profile-picture-editor">
                        <div className="profile-avatar profile-avatar-large">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt={`${user.username} profile preview`}
                                />
                            ) : (
                                initials
                            )}
                        </div>

                        <div className="profile-picture-actions">
                            <strong>Profile picture</strong>
                            <span>JPG, PNG or WEBP · Maximum 5 MB</span>

                            <div className="form-actions profile-picture-buttons">
                                <button
                                    type="button"
                                    className="button button-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingImage}
                                >
                                    {isUploadingImage
                                        ? "Uploading..."
                                        : profileImageUrl
                                            ? "Change Picture"
                                            : "Upload Picture"}
                                </button>

                                {profileImageUrl && (
                                    <button
                                        type="button"
                                        className="button button-secondary"
                                        onClick={handleRemoveProfilePicture}
                                        disabled={isUploadingImage}
                                    >
                                        Remove Picture
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                className="profile-picture-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleProfilePictureChange}
                            />
                        </div>
                    </div>

                    <form className="profile-edit-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="field-group">
                                <label htmlFor="profile-username">
                                    Username
                                </label>
                                <input
                                    id="profile-username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    minLength={3}
                                    maxLength={50}
                                    autoComplete="username"
                                    required
                                />
                                <span className="field-hint">
                                    3–50 characters
                                </span>
                            </div>

                            <div className="field-group">
                                <label htmlFor="profile-email">Email</label>
                                <input
                                    id="profile-email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="profile-readonly-grid">
                            <div>
                                <span>User ID</span>
                                <strong>{user.id}</strong>
                            </div>
                            <div>
                                <span>Role</span>
                                <strong>{user.role}</strong>
                            </div>
                        </div>

                        <div className="form-actions profile-edit-actions">
                            <button
                                type="submit"
                                className="button button-primary"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={cancelEditing}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
}

export default Profile;
