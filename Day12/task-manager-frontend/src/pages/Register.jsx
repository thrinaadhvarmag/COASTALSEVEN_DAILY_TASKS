import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../schemas/authSchema";
import { registerUser } from "../services/authService";
import Input from "../components/ui/Input";

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    async function handleRegister(data) {
        setError("");
        setSuccess("");

        try {
            setLoading(true);
            await registerUser(data.username, data.email, data.password);
            setSuccess("Account created successfully. Redirecting to login...");
            window.setTimeout(() => navigate("/login"), 700);
        } catch (requestError) {
            setError(
                requestError.response?.data?.detail ||
                "Registration failed. Please try again."
            );
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

                <form className="form-stack" onSubmit={handleSubmit(handleRegister)} noValidate>
                    <Input
                        id="register-username"
                        label="Username"
                        placeholder="Your username"
                        autoComplete="username"
                        {...register("username")}
                        error={errors.username?.message}
                    />

                    <Input
                        id="register-email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...register("email")}
                        error={errors.email?.message}
                    />

                    <Input
                        id="register-password"
                        label="Password"
                        type="password"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        {...register("password")}
                        error={errors.password?.message}
                    />

                    {error && (
                        <div className="alert alert-error" role="alert">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success" role="status">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="button button-primary full-width"
                        disabled={loading}
                    >
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
