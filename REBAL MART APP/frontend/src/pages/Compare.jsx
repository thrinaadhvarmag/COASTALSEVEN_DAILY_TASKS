import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Search, ShoppingCart, Trash2, Plus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { imageUrl, money, getErrorMessage } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import { useToast } from "../context/ToastContext";
import { addCompare, clearCompare, readCompareIds, removeCompare } from "../lib/compare";

export default function Compare() {
  const [ids, setIds] = useState(readCompareIds);
  const [products, setProducts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");
  const { add } = useCart();
  const { show } = useToast();

  const sync = () => setIds(readCompareIds());
  useEffect(() => {
    window.addEventListener("rebel-compare-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("rebel-compare-change", sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    let live = true;
    setError("");
    if (!ids.length) { setProducts([]); return () => { live = false; }; }
    Promise.all(ids.map(id => api.get(`/products/${id}`).then(r => r.data).catch(() => null)))
      .then(rows => { if (live) setProducts(rows.filter(Boolean)); })
      .catch(e => { if (live) setError(getErrorMessage(e)); });
    return () => { live = false; };
  }, [ids.join(",")]);

  useEffect(() => {
    let live = true;
    setLoadingCatalog(true);
    api.get("/products", { params: { page: 1, page_size: 100, ...(search.trim() ? { search: search.trim() } : {}) } })
      .then(r => { if (live) setCatalog(Array.isArray(r.data) ? r.data : []); })
      .catch(e => { if (live) setError(getErrorMessage(e)); })
      .finally(() => { if (live) setLoadingCatalog(false); });
    return () => { live = false; };
  }, [search]);

  const available = useMemo(() => catalog.filter(p => !ids.includes(Number(p.id))), [catalog, ids]);
  const selectProduct = id => {
    const added = addCompare(id);
    if (added) { setIds(readCompareIds()); show("Added to comparison", "info"); }
    else show(ids.includes(Number(id)) ? "This product is already compared" : "Compare up to four products at a time", "error");
  };
  const remove = id => { removeCompare(id); setIds(readCompareIds()); setProducts(current => current.filter(p => Number(p.id) !== Number(id))); };
  const clear = () => { clearCompare(); setIds([]); setProducts([]); };

  return <div className="container page-section rm-compare-page">
    <div className="page-heading"><div><div className="eyebrow">Shop smarter</div><h1>Compare products</h1><p>Choose products below and compare price, availability and details side by side.</p></div><span className="rm-compare-count">{products.length}/4 items</span></div>
    {error && <div className="alert error">{error}</div>}
    <section className="card rm-compare-picker">
      <div className="rm-compare-picker-heading"><div><h2>Add products to compare</h2><p>Select up to four products. Your selection stays saved while you browse.</p></div><label className="rm-compare-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products to compare"/></label></div>
      {loadingCatalog ? <div className="rm-compare-catalog-loading">Loading products…</div> : available.length ? <div className="rm-compare-catalog">{available.slice(0, 12).map(p => <article className="rm-compare-pick" key={p.id}><Link to={`/products/${p.id}`} className="rm-compare-pick-image">{p.image_url ? <img src={imageUrl(p.image_url)} alt={p.name}/> : <span>RM</span>}</Link><div className="rm-compare-pick-info"><Link to={`/products/${p.id}`}>{p.name}</Link><strong>{money(p.price)}</strong></div><button type="button" className="btn-secondary tiny" onClick={() => selectProduct(p.id)} disabled={ids.length >= 4}><Plus size={14}/> Compare</button></article>)}</div> : <p className="rm-compare-catalog-loading">{ids.length >= 4 ? "You have selected four products. Remove one below to add another." : "No more matching products found."}</p>}
    </section>
    {!products.length ? <div className="card rm-compare-empty"><ArrowLeftRight size={34}/><h2>Your comparison is waiting</h2><p>Use the product picker above or tap Compare on any product card.</p><Link className="btn-primary" to="/products">Explore products</Link></div> : <><div className="rm-compare-toolbar"><span>Side-by-side product comparison</span><button className="btn-secondary tiny" onClick={clear}><Trash2 size={14}/> Clear all</button></div><div className="rm-compare-grid" style={{ "--compare-count": products.length }}>{products.map(p => <article className="card rm-compare-card" key={p.id}><button className="rm-compare-remove" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}><Trash2 size={15}/></button><Link to={`/products/${p.id}`} className="rm-compare-image">{p.image_url ? <img src={imageUrl(p.image_url)} alt={p.name}/> : <span>RM</span>}</Link><h2><Link to={`/products/${p.id}`}>{p.name}</Link></h2><strong className="rm-compare-price">{money(p.price)}</strong><div className="rm-compare-row"><span>Availability</span><b className={Number(p.stock)>0?"available":"unavailable"}>{Number(p.stock)>0?`In stock (${p.stock})`:"Out of stock"}</b></div><div className="rm-compare-row"><span>Category</span><b>{p.category||"—"}</b></div><div className="rm-compare-row"><span>Actor / collection</span><b>{p.actor_name||"—"}</b></div><div className="rm-compare-row"><span>Movie / series</span><b>{p.movie_name||"—"}</b></div><p className="rm-compare-description">{p.description||"No description available."}</p><div className="rm-compare-actions"><Link className="btn-secondary" to={`/products/${p.id}`}>Details</Link><button className="btn-primary" disabled={Number(p.stock)<=0} onClick={async()=>{try{await add(p.id);show("Added to cart")}catch(e){show(getErrorMessage(e),"error")}}}><ShoppingCart size={15}/> Add to cart</button></div></article>)}</div></>}
  </div>;
}
