import { useEffect, useState } from "react";
import { getDashboardSummary } from "../../services/dashboardService";
import { getCurrentUser } from "../../services/authService";
import { getTasks } from "../../services/taskService";
import { Link } from "react-router-dom";

function Overview() {
    const [summary, setSummary] = useState(null);
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const currentUser = await getCurrentUser();
                const [dashboardData, taskData] = await Promise.all([
                    getDashboardSummary(),
                    getTasks({
                        limit: 5,
                        ...(currentUser.role !== "admin"
                            ? { assignee_id: currentUser.id }
                            : {}),
                    }),
                ]);

                setUser(currentUser);
                setSummary(dashboardData);
                setTasks(taskData);
            } catch (requestError) {
                setError(
                    requestError.response?.data?.detail ||
                    "Unable to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (loading) {
        return <div className="loading-state">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <span className="eyebrow">OVERVIEW</span>
                    <h1>Good to see you, {user?.username || "User"}.</h1>
                    <p>
                        {user?.role === "admin"
                            ? "Showing the complete workspace summary."
                            : "Showing only tasks assigned to you and projects owned by you."}
                    </p>
                </div>
            </div>

            <section className="stat-grid">
                <div className="card stat-card">
                    <span>{user?.role === "admin" ? "Projects" : "My Projects"}</span>
                    <strong>{summary?.projects ?? 0}</strong>
                </div>
                <div className="card stat-card">
                    <span>{user?.role === "admin" ? "Tasks" : "My Tasks"}</span>
                    <strong>{summary?.tasks ?? 0}</strong>
                </div>
                <div className="card stat-card">
                    <span>Categories</span>
                    <strong>{summary?.categories ?? 0}</strong>
                </div>
            </section>

            <section className="card form-card">
                <div className="section-heading">
                    <div>
                        <h2>{user?.role === "admin" ? "Recent Tasks" : "My Assigned Tasks"}</h2>
                        <p>Task ID and assignment details</p>
                    </div>
                    <Link className="button button-secondary" to="/dashboard/tasks">
                        View all tasks
                    </Link>
                </div>

                {tasks.length === 0 ? (
                    <div className="empty-state">No assigned tasks available.</div>
                ) : (
                    <div className="task-grid">
                        {tasks.map((task) => (
                            <article className="card task-card" key={task.id}>
                                <div className="task-card-top">
                                    <div>
                                        <h3>{task.title}</h3>
                                        <p className="muted">Task #{task.id}</p>
                                    </div>
                                    <span className={`badge badge-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                                        {task.status}
                                    </span>
                                </div>
                                <div className="task-meta">
                                    <span>Priority: <strong>{task.priority}</strong></span>
                                    <span>Project: <strong>#{task.project_id}</strong></span>
                                </div>
                                <div className="card-actions">
                                    <Link className="button button-secondary" to={`/tasks/${task.id}`}>
                                        View Task #{task.id}
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="card info-panel">
                <h2>Backend connection</h2>
                <p>
                    JWT authentication is active and Axios automatically sends your Bearer token with protected requests.
                </p>
                <div className="connection-row">
                    <span className="status-dot" /> Connected to FastAPI
                </div>
            </section>
        </div>
    );
}

export default Overview;
