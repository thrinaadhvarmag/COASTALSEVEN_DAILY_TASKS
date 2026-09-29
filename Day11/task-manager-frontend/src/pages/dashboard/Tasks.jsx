import { useEffect, useMemo, useState } from "react";
import TaskCard from "../../components/TaskCard";
import { getAllUsers, getCurrentUser } from "../../services/authService";
import { getTasks, createTask, deleteTask } from "../../services/taskService";
import { getProjects } from "../../services/projectService";

const initialForm = {
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    category_id: "",
    project_id: "",
    assignee_id: "",
    due_date: "",
};

function Tasks() {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [filters, setFilters] = useState({ status: "", priority: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isAdmin = user?.role === "admin";

    const selectedProject = useMemo(
        () => projects.find((project) => String(project.id) === String(form.project_id)),
        [projects, form.project_id]
    );

    async function loadTasks(currentUser = user) {
        if (!currentUser) return;

        try {
            setLoading(true);
            setError("");

            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.priority) params.priority = filters.priority;
            if (currentUser.role !== "admin") {
                params.assignee_id = currentUser.id;
            }

            setTasks(await getTasks(params));
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to load tasks.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        async function initialize() {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                const taskParams = {};
                if (filters.status) taskParams.status = filters.status;
                if (filters.priority) taskParams.priority = filters.priority;
                if (currentUser.role !== "admin") {
                    taskParams.assignee_id = currentUser.id;
                }

                const requests = [getTasks(taskParams), getProjects()];

                if (currentUser.role === "admin") {
                    requests.push(getAllUsers());
                }

                const [taskData, projectData, userData = []] = await Promise.all(requests);

                setTasks(taskData);
                setProjects(projectData);
                setUsers(userData);

                if (projectData.length) {
                    setForm((current) => ({
                        ...current,
                        project_id: current.project_id || String(projectData[0].id),
                    }));
                }
            } catch (requestError) {
                setError(requestError.response?.data?.detail || "Unable to load tasks.");
            } finally {
                setLoading(false);
            }
        }

        initialize();
        // Filters are handled by the effect below after the initial load.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!user) return;
        loadTasks(user);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.priority]);

    function updateForm(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleCreate(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!form.project_id) {
            setError("Create a project first, then select it for the task.");
            return;
        }

        const payload = {
            title: form.title,
            description: form.description || null,
            status: form.status,
            priority: form.priority,
            category_id: form.category_id ? Number(form.category_id) : null,
            project_id: Number(form.project_id),
            // Admin chooses the assignee. For a normal user the backend
            // automatically assigns the task to the logged-in user.
            ...(isAdmin && form.assignee_id
                ? { assignee_id: Number(form.assignee_id) }
                : {}),
            due_date: form.due_date
                ? new Date(form.due_date).toISOString()
                : null,
        };

        try {
            setSaving(true);
            await createTask(payload);
            setForm({ ...initialForm, project_id: form.project_id });
            setMessage(
                isAdmin
                    ? "Task created successfully."
                    : "Your task was created successfully."
            );
            await loadTasks(user);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to create task.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(taskId) {
        if (!window.confirm(`Delete task #${taskId}?`)) return;

        try {
            setError("");
            await deleteTask(taskId);
            setTasks((current) => current.filter((task) => task.id !== taskId));
            setMessage("Task deleted successfully.");
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Unable to delete task.");
        }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <span className="eyebrow">TASKS</span>
                    <h1>{isAdmin ? "Task management" : "My Tasks"}</h1>
                    <p>
                        {isAdmin
                            ? "Manage all tasks in the workspace."
                            : `Create and manage your own tasks. Tasks assigned to ${user?.username || "you"} are displayed.`}
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <section className="card form-card">
                <div className="section-heading">
                    <div>
                        <h2>{isAdmin ? "Create task" : "Create your task"}</h2>
                        <p>POST /tasks/</p>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="empty-state">
                        <p>You need a project before creating a task.</p>
                        <a className="button button-primary" href="/dashboard/projects">
                            Create a Project
                        </a>
                    </div>
                ) : (
                    <form className="form-grid" onSubmit={handleCreate}>
                        <label className="span-2">
                            Title
                            <input
                                name="title"
                                value={form.title}
                                onChange={updateForm}
                                required
                                maxLength={100}
                            />
                        </label>

                        <label className="span-2">
                            Description
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={updateForm}
                                rows="3"
                            />
                        </label>

                        <label>
                            Status
                            <select name="status" value={form.status} onChange={updateForm}>
                                <option>Pending</option>
                                <option>In Progress</option>
                                <option>Completed</option>
                            </select>
                        </label>

                        <label>
                            Priority
                            <select name="priority" value={form.priority} onChange={updateForm}>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </label>

                        <label>
                            Project
                            <select
                                name="project_id"
                                value={form.project_id}
                                onChange={updateForm}
                                required
                            >
                                <option value="">Select project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        #{project.id} — {project.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Category ID
                            <input
                                name="category_id"
                                type="number"
                                min="1"
                                value={form.category_id}
                                onChange={updateForm}
                                placeholder="Optional"
                            />
                        </label>

                        {isAdmin && (
                            <label>
                                Assignee
                                <select
                                    name="assignee_id"
                                    value={form.assignee_id}
                                    onChange={updateForm}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            #{account.id} — {account.username}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        {!isAdmin && (
                            <label>
                                Assignee
                                <input value={`You — ${user?.username || "current user"} (ID ${user?.id ?? ""})`} disabled />
                            </label>
                        )}

                        <label>
                            Due date
                            <input
                                name="due_date"
                                type="datetime-local"
                                value={form.due_date}
                                onChange={updateForm}
                            />
                        </label>

                        <div className="form-actions span-2">
                            <button
                                className="button button-primary"
                                disabled={saving || !selectedProject}
                            >
                                {saving ? "Creating..." : "Create Task"}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className="card form-card">
                <div className="section-heading">
                    <div>
                        <h2>{isAdmin ? "Task list" : `Tasks assigned to ${user?.username || "you"}`}</h2>
                        <p>GET /tasks/</p>
                    </div>
                    <div className="filter-row">
                        <select
                            value={filters.status}
                            onChange={(event) =>
                                setFilters((current) => ({ ...current, status: event.target.value }))
                            }
                        >
                            <option value="">All statuses</option>
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                        <select
                            value={filters.priority}
                            onChange={(event) =>
                                setFilters((current) => ({ ...current, priority: event.target.value }))
                            }
                        >
                            <option value="">All priorities</option>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        {isAdmin
                            ? "No tasks available. Create the first task above."
                            : "No tasks yet. Create your first task above."}
                    </div>
                ) : (
                    <div className="task-grid">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default Tasks;
