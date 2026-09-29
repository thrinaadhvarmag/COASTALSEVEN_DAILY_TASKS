import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const destination = location.state?.from?.pathname || "/dashboard";

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);
            await loginUser(email, password);
            navigate(destination, { replace: true });
        } catch (requestError) {
            const detail = requestError.response?.data?.detail;
            setError(
                detail ||
                (requestError.response?.status === 401
                    ? "Invalid email or password."
                    : "Unable to login. Check that the FastAPI server is running.")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card card">
                <div className="auth-heading">
                    <span className="eyebrow">WELCOME BACK</span>
                    <h1>Sign in</h1>
                    <p>Use the account created in your FastAPI backend.</p>
                </div>

                <form className="form-stack" onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Your password"
                            autoComplete="current-password"
                        />
                    </label>

                    {error && <div className="alert alert-error">{error}</div>}

                    <button className="button button-primary full-width" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </section>
        </main>
    );
}

export default Login;
