import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../../services/dashboardService";
import { getCurrentUser } from "../../services/authService";
import { getTasks } from "../../services/taskService";

function Overview() {
    const [summary, setSummary] = useState(null);
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async (showFullLoader = true) => {
        try {
            if (showFullLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            // Get the current user first. The backend already enforces the
            // correct visibility rule for /tasks/: normal users only receive
            // their assigned tasks, while admins receive all tasks.
            const currentUser = await getCurrentUser();

            const [dashboardData, taskData] = await Promise.all([
                getDashboardSummary(),
                getTasks({ limit: 100, _t: Date.now() }),
            ]);

            setUser(currentUser);
            setSummary(dashboardData);

            // Always normalize the response to an array. Show the newest five
            // tasks in the overview; the full list is available on /tasks.
            const taskList = Array.isArray(taskData) ? taskData : [];
            const recentTasks = [...taskList]
                .sort((a, b) => {
                    const first = new Date(b.created_at || 0).getTime();
                    const second = new Date(a.created_at || 0).getTime();
                    return first - second;
                })
                .slice(0, 5);

            setTasks(recentTasks);
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard(true);
    }, [loadDashboard]);

    // Refresh when the user returns to this browser tab. This prevents the
    // overview from showing an old task list after creating a task elsewhere.
    useEffect(() => {
        function handleFocus() {
            loadDashboard(false);
        }

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [loadDashboard]);

    if (loading) {
        return <div className="loading-state">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div>
                <div className="alert alert-error">{error}</div>
                <button
                    className="button button-secondary"
                    onClick={() => loadDashboard(false)}
                >
                    Try again
                </button>
            </div>
        );
    }

    const isAdmin = user?.role === "admin";

    return (
        <div>
            <div className="page-header">
                <div>
                    <span className="eyebrow">OVERVIEW</span>
                    <h1>Good to see you, {user?.username || "User"}.</h1>
                    <p>
                        {isAdmin
                            ? "Showing the complete workspace summary."
                            : "Showing only tasks assigned to you and projects owned by you."}
                    </p>
                </div>
                <button
                    className="button button-secondary"
                    onClick={() => loadDashboard(false)}
                    disabled={refreshing}
                >
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <section className="stat-grid">
                <div className="card stat-card">
                    <span>{isAdmin ? "Projects" : "My Projects"}</span>
                    <strong>{summary?.projects ?? 0}</strong>
                </div>
                <div className="card stat-card">
                    <span>{isAdmin ? "Tasks" : "My Tasks"}</span>
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
                        <h2>{isAdmin ? "Recent Tasks" : "My Assigned Tasks"}</h2>
                        <p>Task ID and assignment details</p>
                    </div>
                    <Link className="button button-secondary" to="/dashboard/tasks">
                        View all tasks
                    </Link>
                </div>

                {tasks.length === 0 ? (
                    <div className="empty-state">
                        {isAdmin
                            ? "No tasks available."
                            : "No assigned tasks available."}
                    </div>
                ) : (
                    <div className="task-grid">
                        {tasks.map((task) => (
                            <article className="card task-card" key={task.id}>
                                <div className="task-card-top">
                                    <div>
                                        <h3>{task.title}</h3>
                                        <p className="muted">Task #{task.id}</p>
                                    </div>
                                    <span
                                        className={`badge badge-${task.status
                                            .toLowerCase()
                                            .replaceAll(" ", "-")}`}
                                    >
                                        {task.status}
                                    </span>
                                </div>
                                <div className="task-meta">
                                    <span>
                                        Priority: <strong>{task.priority}</strong>
                                    </span>
                                    <span>
                                        Project: <strong>#{task.project_id}</strong>
                                    </span>
                                    {task.assignee_id && (
                                        <span>
                                            Assignee: <strong>#{task.assignee_id}</strong>
                                        </span>
                                    )}
                                </div>
                                <div className="card-actions">
                                    <Link
                                        className="button button-secondary"
                                        to={`/tasks/${task.id}`}
                                    >
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
