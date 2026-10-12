import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/constants";

export default function Login() {
    const { requestLoginOTP, verifyLoginOTP, resendLoginOTP } = useAuth();
    const nav = useNavigate();
    const location = useLocation();
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
            const result = await requestLoginOTP(email.trim(), password);
            setEmail(result.email);
            setOtpStep(true);
            setResendIn(60);
            setNotice(result.message);
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
            const user = await verifyLoginOTP(email.trim(), otp);
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
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    return <div className="auth-page">
    <div className="auth-shell">
        <div className="auth-brand">
            <span className="brand-mark">R</span>
            <div>
                <strong>REBEL<em>MART</em></strong>
                <span>Secure account access</span>
            </div>
        </div>
        <div className="card auth-card">
            <div className="eyebrow">{otpStep ? "Email verification" : "Sign in"}</div>
            <h1>{otpStep ? "Check your inbox." : "Good to see you."}</h1>
            <p className="muted">
                {otpStep
                    ? <>We sent a 6-digit verification code to <strong>{email}</strong>.</>
                    : "Access your cart, orders and account with password + email verification."}
            </p>
            {error && <div className="alert error">{error}</div>}
            {notice && <div className="alert success">{notice}</div>}

            {!otpStep ? (
                <form className="form-stack" onSubmit={submitPassword}>
                    <label>
                        <span>Email</span>
                        <div className="field-icon">
                            <Mail size={17}/>
                            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com"/>
                        </div>
                    </label>
                    <label>
                        <span>Password</span>
                        <div className="field-icon">
                            <LockKeyhole size={17}/>
                            <input className="input" type={show ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"/>
                            <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                                {show ? <EyeOff size={17}/> : <Eye size={17}/>}
                            </button>
                        </div>
                    </label>
                    <button className="btn-primary full" disabled={busy}>
                        {busy ? "Sending code…" : "Continue to verification"}
                        <ArrowRight size={17}/>
                    </button>
                </form>
            ) : (
                <form className="form-stack" onSubmit={submitOtp}>
                    <label>
                        <span>6-digit verification code</span>
                        <div className="field-icon">
                            <KeyRound size={17}/>
                            <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456"/>
                        </div>
                    </label>
                    <button className="btn-primary full" disabled={busy || otp.length !== 6}>
                        {busy ? "Verifying…" : "Verify and sign in"}
                        <ArrowRight size={17}/>
                    </button>
                    <button type="button" className="btn-secondary full" disabled={busy || resendIn > 0} onClick={resend}>
                        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend verification code"}
                    </button>
                    <button type="button" className="btn-secondary full" disabled={busy} onClick={() => { setOtpStep(false); setOtp(""); setError(""); setNotice(""); }}>
                        Use a different email/password
                    </button>
                </form>
            )}

            <div className="secure-note">
                <ShieldCheck size={16}/>
                {otpStep ? "Your code expires in 5 minutes and is protected by the backend." : "Two-step sign-in: password first, then a one-time email code."}
            </div>
            <p className="auth-switch">
                New to Rebel Mart? <Link to="/register">Create an account</Link>
            </p>
        </div>
    </div>
</div>;
}
