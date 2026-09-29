import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAllUsers, getCurrentUser } from "../services/authService";
import { getProjects } from "../services/projectService";
import { getTask, updateTask, deleteTask } from "../services/taskService";

const statusOptions = ["Pending", "In Progress", "Completed"];
const priorityOptions = ["Low", "Medium", "High"];

function TaskDetails() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function initialize() {
            try {
                const [currentUser, data, projectData] = await Promise.all([
                    getCurrentUser(),
                    getTask(taskId),
                    getProjects(),
                ]);

                if (cancelled) return;

                setUser(currentUser);
                setTask(data);
                setProjects(projectData);

                if (currentUser.role === "admin") {
                    setUsers(await getAllUsers());
                }

                setForm({
                    title: data.title || "",
                    description: data.description || "",
                    status: data.status || "Pending",
                    priority: data.priority || "Medium",
                    category_id: data.category_id ?? "",
                    project_id: data.project_id ?? "",
                    assignee_id: data.assignee_id ?? "",
                    due_date: data.due_date ? data.due_date.slice(0, 16) : "",
                });
            } catch (requestError) {
                if (cancelled) return;
                setError(requestError.response?.data?.detail || "Unable to load task.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        initialize();

        return () => {
            cancelled = true;
        };
    }, [taskId]);

    const allowedStatuses = useMemo(() => {
        if (!task) return statusOptions;
        if (task.status === "Pending") return ["Pending", "In Progress"];
        if (task.status === "In Progress") return ["In Progress", "Completed"];
        return ["Completed"];
    }, [task]);

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function handleUpdate(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const payload = {
            title: form.title,
            description: form.description || null,
            status: form.status,
            priority: form.priority,
            category_id: form.category_id === "" ? null : Number(form.category_id),
            project_id: Number(form.project_id),
            assignee_id: form.assignee_id === "" ? null : Number(form.assignee_id),
            due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        };

        try {
            setSaving(true);
            const updated = await updateTask(taskId, payload);
            setTask(updated);
            setMessage("Task updated successfully.");
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to update task.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm(`Delete task #${taskId}?`)) return;

        try {
            await deleteTask(taskId);
            navigate("/dashboard/tasks", { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to delete task.");
        }
    }

    if (loading) return <main className="page-shell"><div className="loading-state">Loading task...</div></main>;
    if (!task || !form) return <main className="page-shell"><div className="alert alert-error">{error || "Task not found."}</div><Link to="/dashboard/tasks">Back to Tasks</Link></main>;

    return (
        <main className="page-shell narrow-page">
            <div className="page-header">
                <div><span className="eyebrow">TASK #{task.id}</span><h1>{task.title}</h1><p>Edit the task using PUT /tasks/{task.id}.</p></div>
                <Link className="button button-secondary" to="/dashboard/tasks">Back</Link>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form className="card form-card form-grid" onSubmit={handleUpdate}>
                <label className="span-2">Title<input name="title" value={form.title} onChange={updateField} required /></label>
                <label className="span-2">Description<textarea name="description" value={form.description} onChange={updateField} rows="4" /></label>
                <label>Status<select name="status" value={form.status} onChange={updateField}>{allowedStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Priority<select name="priority" value={form.priority} onChange={updateField}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
                <label>
                    Project
                    <select name="project_id" value={form.project_id} onChange={updateField} required>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                #{project.id} — {project.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>Category ID<input name="category_id" type="number" min="1" value={form.category_id} onChange={updateField} /></label>
                {user?.role === "admin" ? (
                    <label>
                        Assignee
                        <select name="assignee_id" value={form.assignee_id} onChange={updateField}>
                            <option value="">Unassigned</option>
                            {users.map((account) => (
                                <option key={account.id} value={account.id}>
                                    #{account.id} — {account.username}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <label>
                        Assignee
                        <input
                            value={`You — ${user?.username || "current user"} (ID ${user?.id ?? form.assignee_id ?? ""})`}
                            disabled
                        />
                    </label>
                )}
                <label>Due date<input name="due_date" type="datetime-local" value={form.due_date} onChange={updateField} /></label>
                <div className="form-actions span-2"><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button><button type="button" className="button button-danger" onClick={handleDelete}>Delete Task</button></div>
            </form>

            <section className="card details-grid">
                <div><span>Created</span><strong>{new Date(task.created_at).toLocaleString()}</strong></div>
                <div><span>Updated</span><strong>{new Date(task.updated_at).toLocaleString()}</strong></div>
                <div><span>Project</span><strong>#{task.project_id}</strong></div>
                <div><span>Assignee</span><strong>{task.assignee_id ?? "Unassigned"}</strong></div>
            </section>
        </main>
    );
}

export default TaskDetails;
