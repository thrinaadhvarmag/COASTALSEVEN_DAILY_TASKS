import { PackageOpen, RefreshCw, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getErrorMessage, money, statusClasses, statusLabel } from "../lib/constants";
import EmptyState from "../components/EmptyState";
import { useOrders } from "../hooks/useOrders";

export default function Orders() {
  const query = useOrders();
  const orders = query.data || [];
  const error = query.error ? getErrorMessage(query.error) : "";

  return <div className="container page-section">
    <div className="page-heading"><div><div className="eyebrow">Account</div><h1>My orders</h1><p>Every purchase, status and total in one place.</p></div><button className="icon-btn" onClick={() => query.refetch()} title="Refresh" aria-label="Refresh orders"><RefreshCw size={17}/></button></div>
    {error && <div className="alert error">{error}</div>}
    {query.isLoading ? <div className="stack">{Array.from({ length: 4 }).map((_, i) => <div className="skeleton-row" key={i}/>)}</div> : !orders.length ? <EmptyState icon={PackageOpen} title="No orders yet" text="Your completed purchases will show up here." action={<Link className="btn-primary" to="/products">Start shopping</Link>}/> : <div className="stack">{orders.map((o) => <div className="order-row card" key={o.id}><div className="order-icon"><PackageOpen size={19}/></div><div className="order-main"><strong>Order #{o.id}</strong><span>{o.created_at ? new Date(o.created_at).toLocaleString() : "Recently placed"}</span></div><span className={`status ${statusClasses[o.status] || ""}`}>{statusLabel(o.status)}</span><strong>{money(o.total_amount)}</strong><Link className="btn-secondary tiny" to={`/orders/${o.id}`}>View <ArrowUpRight size={14}/></Link></div>)}</div>}
  </div>;
}
