import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/authService";
import { createProject, deleteProject, getProjects, updateProject } from "../../services/projectService";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({ name: "", description: "" });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);

    async function loadProjects() {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to load projects.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        Promise.all([getCurrentUser(), getProjects()])
            .then(([currentUser, data]) => {
                if (cancelled) return;
                setUser(currentUser);
                setProjects(data);
            })
            .catch((requestError) => {
                if (!cancelled) setError(requestError.response?.data?.detail || "Unable to load projects.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    function resetForm() {
        setForm({ name: "", description: "" });
        setEditingId(null);
    }

    function startEdit(project) {
        setEditingId(project.id);
        setForm({ name: project.name, description: project.description || "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        try {
            setSaving(true);
            if (editingId) {
                await updateProject(editingId, form);
                setMessage("Project updated successfully.");
            } else {
                await createProject(form);
                setMessage("Project created successfully.");
            }
            resetForm();
            await loadProjects();
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to save project.");
        } finally {
            setSaving(false);
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
            <div className="page-header"><div><span className="eyebrow">PROJECTS</span><h1>Projects</h1><p>{user?.role === "admin" ? "Manage all projects in the workspace." : "Create and manage projects owned by your account."}</p></div></div>
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <section className="card form-card">
                <div className="section-heading"><div><h2>{editingId ? `Edit project #${editingId}` : "Create project"}</h2><p>{editingId ? "PUT /projects/{project_id}" : "POST /projects/"}</p></div></div>
                <form className="form-grid" onSubmit={handleSubmit}>
                    <label className="span-2">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required /></label>
                    <label className="span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" /></label>
                    <div className="form-actions span-2"><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Project" : "Create Project"}</button>{editingId && <button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button>}</div>
                </form>
            </section>

            <section className="project-grid">
                {loading ? <div className="loading-state">Loading projects...</div> : projects.length === 0 ? <div className="card empty-state">No projects yet. Create your first project above.</div> : projects.map((project) => (
                    <article className="card project-card" key={project.id}>
                        <div><span className="project-number">#{project.id}</span><h3>{project.name}</h3></div>
                        <p>{project.description || "No description provided."}</p>
                        <div className="project-date">Created {new Date(project.created_at).toLocaleDateString()}</div>
                        <div className="card-actions"><button className="button button-secondary" onClick={() => startEdit(project)}>Edit</button><button className="button button-danger-outline" onClick={() => handleDelete(project.id)}>Delete</button></div>
                    </article>
                ))}
            </section>
        </div>
    );
}

export default Projects;
