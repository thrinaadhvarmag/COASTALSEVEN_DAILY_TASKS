import { Link } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

function Home() {
    const authenticated = isAuthenticated();

    return (
        <main className="page-shell home-page">
            <section className="hero-section">
                <div className="hero-copy">
                    <span className="eyebrow">FASTAPI + REACT</span>
                    <h1>Manage your work in one place.</h1>
                    <p>
                        Create projects, organize tasks, track progress, and work with a
                        JWT-authenticated FastAPI backend from a clean React interface.
                    </p>
                    <div className="hero-actions">
                        <Link className="button button-primary" to={authenticated ? "/dashboard" : "/login"}>
                            {authenticated ? "Open Dashboard" : "Get Started"}
                        </Link>
                        {!authenticated && (
                            <Link className="button button-secondary" to="/register">
                                Create Account
                            </Link>
                        )}
                    </div>
                </div>

                <div className="hero-card card">
                    <div className="mini-window-top">
                        <span /> <span /> <span />
                    </div>
                    <div className="mini-stat-grid">
                        <div><strong>Tasks</strong><span>CRUD</span></div>
                        <div><strong>Projects</strong><span>CRUD</span></div>
                        <div><strong>JWT</strong><span>Secure</span></div>
                        <div><strong>API</strong><span>FastAPI</span></div>
                    </div>
                    <div className="mini-progress"><span /></div>
                </div>
            </section>

            <section className="feature-grid">
                <article className="card feature-card">
                    <h3>JWT Authentication</h3>
                    <p>Login, registration, protected routes, and automatic Bearer tokens.</p>
                </article>
                <article className="card feature-card">
                    <h3>Task Management</h3>
                    <p>Create, filter, update, view, and delete tasks through FastAPI.</p>
                </article>
                <article className="card feature-card">
                    <h3>Project Management</h3>
                    <p>Keep tasks organized under projects owned by the authenticated user.</p>
                </article>
            </section>
        </main>
    );
}

export default Home;
