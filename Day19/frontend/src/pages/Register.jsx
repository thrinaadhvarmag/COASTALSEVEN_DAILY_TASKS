import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/constants";
export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const submit = async (e) => { e.preventDefault(); setBusy(true); setError(""); try {
        await register(form.username.trim(), form.email.trim(), form.password);
        nav("/login", { replace: true, state: { email: form.email.trim(), message: "Account created. Sign in with your password and verify the code sent to your email." } });
    }
    catch (e) {
        setError(getErrorMessage(e));
    }
    finally {
        setBusy(false);
    } };
    return <div className="auth-page">
    <div className="auth-shell">
        <div className="auth-brand">
            <span className="brand-mark">
R
            </span>
            <div>
                <strong>
REBEL
                    <em>
MART
                    </em>
                </strong>
                <span>
Create your account
                </span>
            </div>
        </div>
        <div className="card auth-card">
            <div className="eyebrow">
Join Rebel Mart
            </div>
            <h1>
Make shopping simpler.
            </h1>
            <p className="muted">
Create one account for your cart, orders and profile.
            </p>
{error &&
            <div className="alert error">

{error}
            </div>
}
            <form className="form-stack" onSubmit={submit}>
                <label>
                    <span>
Username
                    </span>
                    <div className="field-icon">
                        <UserRound size={17}/>
                        <input className="input" required minLength={2} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Your name"/>
                    </div>
                </label>
                <label>
                    <span>
Email
                    </span>
                    <div className="field-icon">
                        <Mail size={17}/>
                        <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/>
                    </div>
                </label>
                <label>
                    <span>
Password
                    </span>
                    <div className="field-icon">
                        <LockKeyhole size={17}/>
                        <input className="input" type={show ? "text" : "password"} minLength={8} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters"/>
                        <button type="button" onClick={() => setShow(!show)}>
{show ?
                            <EyeOff size={17}/>
 :
                            <Eye size={17}/>
}
                        </button>
                    </div>
                </label>
                <button className="btn-primary full" disabled={busy}>
{busy ? "Creating…" : "Create account"}
                    <ArrowRight size={17}/>
                </button>
            </form>
            <div className="benefit-list">
                <span>
                    <CheckCircle2 />
 One account for everything
                </span>
                <span>
                    <CheckCircle2 />
 Fast checkout and order history
                </span>
            </div>
            <p className="auth-switch">
Already registered?
                <Link to="/login">
Sign in
                </Link>
            </p>
        </div>
    </div>
</div>;
}
