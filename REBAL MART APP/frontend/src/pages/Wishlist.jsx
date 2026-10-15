import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { getErrorMessage } from "../lib/constants";

const KEY = "rebel_mart_wishlist";
function getIds() { try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? [...new Set(value.map(Number).filter(Number.isFinite))] : []; } catch { return []; } }
export default function Wishlist() {
  const [ids, setIds] = useState(getIds);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = () => { const next = getIds(); setIds(next); setLoading(true); setError(""); if (!next.length) { setProducts([]); setLoading(false); return; } Promise.all(next.map((id) => api.get(`/products/${id}`).then(({data}) => data).catch(() => null))).then((items) => setProducts(items.filter(Boolean))).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); };
  useEffect(() => { reload(); const onStorage = (event) => { if (event.key === KEY) reload(); }; window.addEventListener("storage", onStorage); window.addEventListener("rebel-wishlist-updated", reload); return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("rebel-wishlist-updated", reload); }; }, []);
  const removeAll = () => { localStorage.setItem(KEY, "[]"); setIds([]); setProducts([]); };
  return <div className="container page-section rm-wishlist-page"><header className="page-heading"><div><span className="eyebrow">YOUR SAVED COLLECTION</span><h1>My wishlist</h1><p>Keep your fan favourites close and come back whenever you're ready.</p></div>{ids.length > 0 && <button className="btn-secondary" onClick={removeAll}><Trash2 size={15}/> Clear wishlist</button>}</header>{error && <div className="alert error">{error}</div>}{loading ? <div className="product-grid">{Array.from({length:4},(_,i)=><div className="skeleton-card" key={i}/>)}</div> : products.length ? <><div className="rm-wishlist-count">{products.length} saved product{products.length===1?"":"s"}</div><div className="product-grid">{products.map((product)=><ProductCard key={product.id} product={product}/>)}</div></> : <EmptyState icon={Heart} title="Your wishlist is waiting" text="Tap the heart on any product to save it here." action={<Link className="btn-primary" to="/products"><ShoppingBag size={16}/> Explore products</Link>}/>}</div>;
}
