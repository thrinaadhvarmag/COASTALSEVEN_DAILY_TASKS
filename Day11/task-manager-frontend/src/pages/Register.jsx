import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (form.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        try {
            setLoading(true);
            await registerUser(form.username, form.email, form.password);
            setSuccess("Account created successfully. Redirecting to login...");
            setTimeout(() => navigate("/login"), 700);
        } catch (requestError) {
            setError(requestError.response?.data?.detail || "Registration failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card card">
                <div className="auth-heading">
                    <span className="eyebrow">NEW ACCOUNT</span>
                    <h1>Create account</h1>
                    <p>Register directly through the FastAPI authentication API.</p>
                </div>

                <form className="form-stack" onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            name="username"
                            value={form.username}
                            onChange={updateField}
                            placeholder="Your username"
                            minLength={3}
                            maxLength={50}
                            required
                        />
                    </label>

                    <label>
                        Email
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={updateField}
                            placeholder="you@example.com"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={updateField}
                            placeholder="At least 8 characters"
                            minLength={8}
                            maxLength={100}
                            required
                        />
                    </label>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <button className="button button-primary full-width" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}

export default Register;
