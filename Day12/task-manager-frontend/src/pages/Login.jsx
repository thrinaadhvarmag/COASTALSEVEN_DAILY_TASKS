import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchema";
import { loginUser } from "../services/authService";
import Input from "../components/ui/Input";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const destination = location.state?.from?.pathname || "/dashboard";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onBlur",
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function handleLogin(data) {
        setError("");

        try {
            setLoading(true);
            await loginUser(data.email, data.password);
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

                <form className="form-stack" onSubmit={handleSubmit(handleLogin)} noValidate>
                    <Input
                        id="login-email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...register("email")}
                        error={errors.email?.message}
                    />

                    <Input
                        id="login-password"
                        label="Password"
                        type="password"
                        placeholder="Your password"
                        autoComplete="current-password"
                        {...register("password")}
                        error={errors.password?.message}
                    />

                    {error && (
                        <div className="alert alert-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="button button-primary full-width"
                        disabled={loading}
                    >
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
