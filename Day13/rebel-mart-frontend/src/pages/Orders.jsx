import { useEffect,useState } from "react";
import { ArrowUpRight, PackageOpen, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getErrorMessage,money,statusClasses,statusLabel } from "../lib/constants";
import EmptyState from "../components/EmptyState";

export default function Orders(){
  const [orders,setOrders]=useState([]);const[error,setError]=useState("");const[loading,setLoading]=useState(true);
  const load=()=>{setLoading(true);api.get("/orders?page=1&page_size=50").then(r=>setOrders(Array.isArray(r.data)?r.data:r.data.items||[])).catch(e=>setError(getErrorMessage(e))).finally(()=>setLoading(false))};
  useEffect(load,[]);
  return <div className="container page-section"><div className="page-heading"><div><div className="eyebrow">Account</div><h1>My orders</h1><p>Every purchase, status and total in one place.</p></div><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17}/></button></div>{error&&<div className="alert error">{error}</div>}{loading?<div className="stack">{Array.from({length:4}).map((_,i)=><div className="skeleton-row" key={i}/>)}</div>:!orders.length?<EmptyState icon={PackageOpen} title="No orders yet" text="Your completed purchases will show up here." action={<Link className="btn-primary" to="/products">Start shopping</Link>}/>:<div className="stack">{orders.map(o=><div className="order-row card" key={o.id}><div className="order-icon"><PackageOpen size={19}/></div><div className="order-main"><strong>Order #{o.id}</strong><span>{o.created_at?new Date(o.created_at).toLocaleString():"Recently placed"}</span></div><span className={`status ${statusClasses[o.status]||""}`}>{statusLabel(o.status)}</span><strong>{money(o.total_amount)}</strong><Link className="btn-secondary tiny" to={`/orders/${o.id}`}>View <ArrowUpRight size={14}/></Link></div>)}</div>}</div>;
}
