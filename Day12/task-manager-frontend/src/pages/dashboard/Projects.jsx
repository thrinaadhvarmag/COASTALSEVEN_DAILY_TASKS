import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Upload, X } from "lucide-react";
import { getCurrentUser } from "../../services/authService";
import {
    createProject,
    deleteProject,
    deleteProjectImage,
    getProjects,
    updateProject,
    uploadProjectImage,
} from "../../services/projectService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getImageUrl(imageUrl) {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
}

function Projects() {
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({ name: "", description: "" });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [imageUploading, setImageUploading] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        Promise.all([getCurrentUser(), getProjects()])
            .then(([currentUser, data]) => {
                if (cancelled) return;
                setUser(currentUser);
                setProjects(data);
            })
            .catch((requestError) => {
                if (!cancelled) {
                    setError(requestError.response?.data?.detail || "Unable to load projects.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const clearSelectedImage = useCallback(() => {
        setSelectedImage(null);
        setPreviewUrl("");
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError("");
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const dropzoneConfig = useMemo(
        () => ({
            accept: {
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
                "image/webp": [".webp"],
            },
            maxFiles: 1,
            maxSize: 5 * 1024 * 1024,
        }),
        []
    );

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        fileRejections,
    } = useDropzone({
        onDrop,
        ...dropzoneConfig,
    });

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function resetForm() {
        setForm({ name: "", description: "" });
        setEditingId(null);
        clearSelectedImage();
    }

    function startEdit(project) {
        setEditingId(project.id);
        setForm({ name: project.name, description: project.description || "" });
        clearSelectedImage();
        setError("");
        setMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!form.name.trim()) {
            setError("Project name is required.");
            return;
        }

        try {
            setSaving(true);
            let project;

            if (editingId) {
                project = await updateProject(editingId, {
                    name: form.name.trim(),
                    description: form.description,
                });
            } else {
                project = await createProject({
                    name: form.name.trim(),
                    description: form.description,
                });
            }

            if (selectedImage) {
                setImageUploading(true);
                project = await uploadProjectImage(project.id, selectedImage);
            }

            setMessage(
                editingId
                    ? "Project updated successfully."
                    : "Project created successfully."
            );
            resetForm();
            await loadProjects();
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to save project or upload image.");
        } finally {
            setSaving(false);
            setImageUploading(false);
        }
    }

    async function handleRemoveProjectImage(project) {
        if (!project.image_url) return;

        try {
            await deleteProjectImage(project.id);
            setProjects((current) =>
                current.map((item) =>
                    item.id === project.id ? { ...item, image_url: null } : item
                )
            );
            setMessage("Project image removed successfully.");
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to remove project image.");
        }
    }

    async function handleDelete(projectId) {
        if (!window.confirm(`Delete project #${projectId}? Its tasks are related to this project.`)) return;

        try {
            await deleteProject(projectId);
            setProjects((current) => current.filter((project) => project.id !== projectId));
            setMessage("Project deleted successfully.");
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to delete project.");
        }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <span className="eyebrow">PROJECTS</span>
                    <h1>Projects</h1>
                    <p>
                        {user?.role === "admin"
                            ? "Manage all projects in the workspace."
                            : "Create and manage projects owned by your account."}
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <section className="card form-card">
                <div className="section-heading">
                    <div>
                        <h2>{editingId ? `Edit project #${editingId}` : "Create project"}</h2>
                        <p>{editingId ? "PUT /projects/{project_id}" : "POST /projects/"}</p>
                    </div>
                </div>

                <form className="form-grid" onSubmit={handleSubmit}>
                    <label className="span-2">
                        Name
                        <input
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            maxLength={100}
                            required
                        />
                    </label>

                    <label className="span-2">
                        Description
                        <textarea
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            rows="3"
                        />
                    </label>

                    <div className="span-2">
                        <div className="project-image-label">
                            <span>Project image</span>
                            <small>JPG, PNG or WEBP · maximum 5 MB</small>
                        </div>

                        <div
                            {...getRootProps()}
                            className={`project-dropzone ${isDragActive ? "active" : ""}`}
                        >
                            <input {...getInputProps()} />
                            <div className="project-upload-icon">
                                {isDragActive ? <Upload size={24} /> : <ImagePlus size={24} />}
                            </div>
                            <strong>{isDragActive ? "Drop the image here" : "Choose a project image"}</strong>
                            <span>Drag & drop an image here, or click to browse</span>
                        </div>

                        {fileRejections.length > 0 && (
                            <p className="field-error">
                                Please choose a JPG, PNG or WEBP image smaller than 5 MB.
                            </p>
                        )}

                        {previewUrl && (
                            <div className="project-image-preview">
                                <img src={previewUrl} alt="Selected project preview" />
                                <div>
                                    <strong>{selectedImage?.name}</strong>
                                    <span>{selectedImage ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB` : ""}</span>
                                </div>
                                <button
                                    type="button"
                                    className="image-remove-button"
                                    onClick={clearSelectedImage}
                                    aria-label="Remove selected project image"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-actions span-2">
                        <button className="button button-primary" disabled={saving}>
                            {saving ? imageUploading ? "Uploading image..." : "Saving..." : editingId ? "Update Project" : "Create Project"}
                        </button>
                        {editingId && (
                            <button type="button" className="button button-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="project-grid">
                {loading ? (
                    <div className="loading-state">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="card empty-state">No projects yet. Create your first project above.</div>
                ) : (
                    projects.map((project) => (
                        <article className="card project-card project-card-with-image" key={project.id}>
                            {project.image_url ? (
                                <div className="project-card-image-wrap">
                                    <img
                                        className="project-card-image"
                                        src={getImageUrl(project.image_url)}
                                        alt={`${project.name} project`}
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="project-card-image-placeholder">
                                    <ImagePlus size={28} />
                                    <span>No project image</span>
                                </div>
                            )}

                            <div className="project-card-content">
                                <span className="project-number">#{project.id}</span>
                                <h3>{project.name}</h3>
                                <p>{project.description || "No description provided."}</p>
                                <div className="project-date">
                                    Created {new Date(project.created_at).toLocaleDateString()}
                                </div>
                                <div className="card-actions">
                                    <button className="button button-secondary" onClick={() => startEdit(project)}>
                                        Edit
                                    </button>
                                    {project.image_url && (
                                        <button
                                            className="button button-secondary"
                                            onClick={() => handleRemoveProjectImage(project)}
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                    <button className="button button-danger-outline" onClick={() => handleDelete(project.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </section>
        </div>
    );
}

export default Projects;
