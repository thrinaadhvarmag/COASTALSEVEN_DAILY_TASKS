import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";

function DashboardLayout() {
    const navigate = useNavigate();

    function handleLogout() {
        logoutUser();
        navigate("/login", { replace: true });
    }

    return (
        <main className="dashboard-shell">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <span className="brand-mark">TM</span>
                    <div>
                        <strong>Task Manager</strong>
                        <span>Workspace</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" end>Overview</NavLink>
                    <NavLink to="/dashboard/tasks">Tasks</NavLink>
                    <NavLink to="/dashboard/projects">Projects</NavLink>
                    <NavLink to="/dashboard/profile">Profile</NavLink>
                    <NavLink to="/dashboard/reports">Reports</NavLink>
                    <NavLink to="/dashboard/users">Users</NavLink>
                </nav>

                <button className="sidebar-logout" onClick={handleLogout}>
                    Sign out
                </button>
            </aside>

            <section className="dashboard-content">
                <Outlet />
            </section>
        </main>
    );
}

export default DashboardLayout;
