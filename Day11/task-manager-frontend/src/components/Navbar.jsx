import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAuthenticated, logoutUser } from "../services/authService";

function Navbar() {
    const navigate = useNavigate();
    const authenticated = isAuthenticated();

    function handleLogout() {
        logoutUser();
        navigate("/login", { replace: true });
    }

    return (
        <header className="topbar">
            <Link className="brand" to="/">
                Task<span>Manager</span>
            </Link>

            <nav className="topnav">
                <NavLink to="/" end>Home</NavLink>
                {authenticated ? (
                    <>
                        <NavLink to="/dashboard">Dashboard</NavLink>
                        <button className="nav-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <NavLink to="/login">Login</NavLink>
                )}
            </nav>
        </header>
    );
}

export default Navbar;
