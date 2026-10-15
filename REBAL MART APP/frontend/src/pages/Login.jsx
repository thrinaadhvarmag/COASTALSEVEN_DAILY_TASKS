import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck, Eye, EyeOff, KeyRound, Sparkles, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/constants";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
    const { requestLoginOTP, verifyLoginOTP, resendLoginOTP, logout } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
    const loginMode = new URLSearchParams(location.search).get("mode") === "admin" ? "admin" : "customer";
    const [email, setEmail] = useState(location.state?.email || "");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.message || "");
    const [otpStep, setOtpStep] = useState(Boolean(location.state?.otpStep));
    const [resendIn, setResendIn] = useState(0);

    useEffect(() => {
        if (!resendIn) return undefined;
        const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [resendIn]);

    const destination = location.state?.from || "/products";

    const submitPassword = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
            const result = await requestLoginOTP(email.trim(), password, loginMode === "admin");
            setEmail(result.email);
            setOtpStep(true);
            setResendIn(60);
            setNotice(result.message);
            if (result.dev_otp) {
                setOtp(result.dev_otp);
            }
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const submitOtp = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const user = await verifyLoginOTP(email.trim(), otp, loginMode === "admin");
            if (loginMode === "admin" && user.role !== "admin") {
                logout();
                setError("This account does not have administrator access. Choose Customer sign in or use an authorized admin account.");
                return;
            }
            if (loginMode === "customer" && user.role === "admin") {
                logout();
                setError("Administrator accounts must use Admin sign in.");
                return;
            }
            nav(user.role === "admin" ? "/admin" : destination, { replace: true });
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resendIn > 0 || busy) return;
        setBusy(true);
        setError("");
        setNotice("");
        try {
            const result = await resendLoginOTP(email.trim());
            setResendIn(60);
            setNotice(result.message);
            if (result.dev_otp) {
                setOtp(result.dev_otp);
            }
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
                            <Sparkles size={14} /> OFFICIAL PRABHAS MERCHANDISE
                        </span>
                        <h2>Wear the Cinema.<br />Rule the World.</h2>
                        <p>
                            Join thousands of Rebel Star fans collecting authentic apparel, high-detail collectibles,
                            and limited-run posters from Salaar, Kalki 2898 AD, Baahubali, and The Raja Saab.
                        </p>
                        <div className="auth-story-points">
                            <span><ShieldCheck size={17} color="var(--accent)" /> 100% Certified Official Fan Merchandise</span>
                            <span><LockKeyhole size={17} color="var(--accent)" /> Protected 2-Step Verified Sign-In</span>
                            <span><Mail size={17} color="var(--accent)" /> Live Order & Shipment Tracking</span>
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
                            {/* Modern Segmented Role Tab Switcher */}
                            {!otpStep && (
                                <div className="login-role-tabs" role="tablist" aria-label="Sign in type">
                                    <Link
                                        to="/login?mode=customer"
                                        role="tab"
                                        aria-selected={loginMode === "customer"}
                                        className={`login-role-tab ${loginMode === "customer" ? "active" : ""}`}
                                        onClick={() => { setError(""); setNotice(""); }}
                                    >
                                        <UserRound size={15} />
                                        <span>Customer Sign In</span>
                                    </Link>
                                    <Link
                                        to="/login?mode=admin"
                                        role="tab"
                                        aria-selected={loginMode === "admin"}
                                        className={`login-role-tab ${loginMode === "admin" ? "active" : ""}`}
                                        onClick={() => { setError(""); setNotice(""); }}
                                    >
                                        <ShieldCheck size={15} />
                                        <span>Admin Console</span>
                                    </Link>
                                </div>
                            )}

                            <div className="eyebrow">
                                {otpStep ? "Step 2 · Verification" : loginMode === "admin" ? "Console Access" : "Fan Account"}
                            </div>
                            <h1>
                                {otpStep ? "Check your code" : loginMode === "admin" ? "Admin Console" : "Welcome Back"}
                            </h1>
                            <p className="muted">
                                {otpStep
                                    ? <>Enter the 6-digit verification code sent to <strong>{email}</strong>.</>
                                    : loginMode === "admin"
                                    ? "Administrator credentials required to manage catalogue, orders, and inventory."
                                    : "Access your bag, track cinema deliveries, and redeem fan rewards."}
                            </p>

                            {error && <div className="alert error">{error}</div>}
                            {notice && <div className="alert success">{notice}</div>}

                            {!otpStep ? (
                                <form className="form-stack" onSubmit={submitPassword}>
                                    <label>
                                        <span>Email Address</span>
                                        <div className="field-icon">
                                            <Mail size={17} />
                                            <input
                                                className="input"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder={loginMode === "admin" ? "admin@rebelmart.com" : "fan@gmail.com"}
                                                autoComplete="username"
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
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShow(!show)}
                                                aria-label="Toggle password visibility"
                                                className="password-toggle-btn"
                                            >
                                                {show ? <EyeOff size={17} /> : <Eye size={17} />}
                                            </button>
                                        </div>
                                    </label>

                                    <button className="btn-primary full" disabled={busy} style={{ height: "46px" }}>
                                        {busy ? "Sending verification…" : "Continue to Verification"}
                                        <ArrowRight size={17} />
                                    </button>
                                </form>
                            ) : (
                                <form className="form-stack" onSubmit={submitOtp}>
                                    <label>
                                        <span>6-Digit Verification Code</span>
                                        <div className="field-icon">
                                            <KeyRound size={17} />
                                            <input
                                                className="input"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                pattern="[0-9]{6}"
                                                required
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                placeholder="······"
                                                style={{ letterSpacing: "0.2em", fontSize: "18px", fontWeight: "700" }}
                                            />
                                        </div>
                                        <small className="muted" style={{ marginTop: 4, display: "block" }}>
                                            Check your Inbox &amp; Spam folder for your 6-digit code.
                                        </small>
                                    </label>
                                    <button className="btn-primary full" disabled={busy || otp.length !== 6} style={{ height: "46px" }}>
                                        {busy ? "Verifying…" : "Verify & Sign In"}
                                        <ArrowRight size={17} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary full"
                                        disabled={busy || resendIn > 0}
                                        onClick={resend}
                                    >
                                        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend Verification Code"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary full"
                                        disabled={busy}
                                        onClick={() => { setOtpStep(false); setOtp(""); setError(""); setNotice(""); }}
                                    >
                                        Use a different email / password
                                    </button>
                                </form>
                            )}

                            {loginMode === "customer" ? (
                                <p className="auth-switch" style={{ marginTop: "20px" }}>
                                    New to Rebel Mart? <Link to="/register">Create an account →</Link>
                                </p>
                            ) : (
                                <p className="auth-switch" style={{ marginTop: "20px" }}>
                                    Customer looking for fan merch? <Link to="/login?mode=customer">Switch to Customer Sign In →</Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
