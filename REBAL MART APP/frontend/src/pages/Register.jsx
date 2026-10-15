import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, UserRound, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/constants";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await register(form.username.trim(), form.email.trim(), form.password);
            nav("/login", {
                replace: true,
                state: {
                    email: form.email.trim(),
                    message: "Account created successfully! Please sign in to verify your account."
                }
            });
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            {/* Top Navigation Bar with Back link and Theme Toggle */}
            <header className="auth-nav-header">
                <Link to="/" className="auth-back-link" title="Return to store">
                    <ArrowLeft size={16} />
                    <span>Back to Rebel Mart</span>
                </Link>

                <Link to="/" className="auth-nav-logo" aria-label="Rebel Mart Home">
                    <img src="/favicon.png" alt="Rebel Mart logo" width="32" height="32" />
                    <span>REBEL<strong>MART</strong></span>
                </Link>

                <div className="auth-nav-actions">
                    <ThemeToggle showLabel={true} />
                </div>
            </header>

            <div className="auth-page auth-split-page">
                {/* Desktop Story Aside */}
                <aside className="auth-story-panel">
                    <div className="auth-story-content">
                        <span className="auth-story-kicker">
                            <Sparkles size={14} /> JOIN THE REBEL CLUB
                        </span>
                        <h2>The Official Home<br />of Rebel Star Fans.</h2>
                        <p>
                            Create your Rebel Mart account to get instant access to 23% Birthday Season discounts,
                            exclusive limited-edition pre-orders, and early drops for upcoming Prabhas films.
                        </p>
                        <div className="auth-story-points">
                            <span><CheckCircle2 size={17} color="var(--accent)" /> 23% Flat Storewide Birthday Season Discount</span>
                            <span><CheckCircle2 size={17} color="var(--accent)" /> Express Delivery Tracking across 28,000+ Pincodes</span>
                            <span><CheckCircle2 size={17} color="var(--accent)" /> Earn Rebel Reward Points on Every Purchase</span>
                        </div>
                    </div>
                    <div className="auth-story-footer">
                        <span>REBEL MART · OFFICIAL CINEMA DESTINATION</span>
                    </div>
                </aside>

                {/* Form Panel */}
                <div className="auth-form-panel">
                    <div className="auth-shell">
                        <div className="card auth-card">
                            <div className="eyebrow">Fan Membership</div>
                            <h1>Create an Account</h1>
                            <p className="muted">
                                One account for your merchandise bag, order history and fan rewards.
                            </p>

                            {error && <div className="alert error">{error}</div>}

                            <form className="form-stack" onSubmit={submit}>
                                <label>
                                    <span>Username</span>
                                    <div className="field-icon">
                                        <UserRound size={17} />
                                        <input
                                            className="input"
                                            required
                                            minLength={2}
                                            value={form.username}
                                            onChange={e => setForm({ ...form, username: e.target.value })}
                                            placeholder="Your fandom username"
                                        />
                                    </div>
                                </label>

                                <label>
                                    <span>Email Address</span>
                                    <div className="field-icon">
                                        <Mail size={17} />
                                        <input
                                            className="input"
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="fan@gmail.com"
                                        />
                                    </div>
                                </label>

                                <label>
                                    <span>Password</span>
                                    <div className="field-icon">
                                        <LockKeyhole size={17} />
                                        <input
                                            className="input"
                                            type={show ? "text" : "password"}
                                            minLength={8}
                                            required
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            placeholder="At least 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShow(!show)}
                                            className="password-toggle-btn"
                                            aria-label="Toggle password visibility"
                                        >
                                            {show ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </label>

                                <button className="btn-primary full" disabled={busy} style={{ height: "46px" }}>
                                    {busy ? "Creating Account…" : "Create Fan Account"}
                                    <ArrowRight size={17} />
                                </button>
                            </form>

                            <p className="auth-switch" style={{ marginTop: "18px" }}>
                                Already have an account? <Link to="/login">Sign in here →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
