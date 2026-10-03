import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Link,useLocation,useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/constants";

export default function Login(){
 const{login}=useAuth();const nav=useNavigate();const location=useLocation();const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[show,setShow]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const submit=async e=>{e.preventDefault();setBusy(true);setError("");try{const u=await login(email,password);nav(u.role==="admin"?"/admin":location.state?.from||"/products",{replace:true})}catch(e){setError(getErrorMessage(e))}finally{setBusy(false)}};
 return <div className="auth-page"><div className="auth-shell"><div className="auth-brand"><span className="brand-mark">R</span><div><strong>REBEL <em>MART</em></strong><span>Welcome back</span></div></div><div className="card auth-card"><div className="eyebrow">Sign in</div><h1>Good to see you.</h1><p className="muted">Access your cart, orders and account.</p>{error&&<div className="alert error">{error}</div>}<form className="form-stack" onSubmit={submit}><label><span>Email</span><div className="field-icon"><Mail size={17}/><input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label><label><span>Password</span><div className="field-icon"><LockKeyhole size={17}/><input className="input" type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label><button className="btn-primary full" disabled={busy}>{busy?"Signing in…":"Sign in"}<ArrowRight size={17}/></button></form><div className="secure-note"><ShieldCheck size={16}/> Protected by JWT authentication</div><p className="auth-switch">New to Rebel Mart? <Link to="/register">Create an account</Link></p></div></div></div>;
}
