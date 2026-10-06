import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { imageUrl, money, getErrorMessage } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import { useProduct } from "../hooks/useProducts";
import { useToast } from "../context/ToastContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id);
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rebel_mart_wishlist") || "[]").includes(Number(id)); } catch { return false; }
  });
  const { add } = useCart();
  const { show } = useToast();

  useEffect(() => {
    if (!product) return;
    try {
      const list = JSON.parse(localStorage.getItem("rebel_mart_recent") || "[]");
      const next = [Number(id), ...list.filter((x) => x !== Number(id))].slice(0, 6);
      localStorage.setItem("rebel_mart_recent", JSON.stringify(next));
    } catch { /* local browser storage is optional */ }
  }, [id, product]);

  const toggle = () => {
    const list = JSON.parse(localStorage.getItem("rebel_mart_wishlist") || "[]");
    const next = list.includes(Number(id)) ? list.filter((x) => x !== Number(id)) : [...list, Number(id)];
    localStorage.setItem("rebel_mart_wishlist", JSON.stringify(next));
    setWish(!wish);
  };

  if (isLoading) return <div className="container page-section"><div className="product-detail-skeleton"/></div>;
  if (error) return <div className="container page-section"><div className="alert error">{getErrorMessage(error)}</div></div>;
  if (!product) return null;

  const max = Math.max(1, Number(product.stock || 1));
  const addItem = async () => {
    try { await add(product.id, qty); show(`${product.name} added to cart`); }
    catch (e) { show(getErrorMessage(e), "error"); }
  };

  return <div className="container page-section">
    <Link className="back-link" to="/products"><ArrowLeft size={16}/> Back to products</Link>
    <div className="detail-grid">
      <div className="detail-image">{product.image_url ? <img src={imageUrl(product.image_url)} alt={product.name}/> : <div className="product-placeholder large"><span>RM</span><small>Image coming soon</small></div>}</div>
      <div className="detail-copy">
        <div className="eyebrow">Rebel Mart / Product</div><h1>{product.name}</h1><div className="detail-price">{money(product.price)}</div>
        <p className="detail-description">{product.description || "A carefully selected product from Rebel Mart."}</p>
        <div className="stock-line">{Number(product.stock) > 0 ? <><CheckCircle2 size={17}/> {product.stock} available</> : <>Currently unavailable</>}</div>
        <div className="purchase-row"><div className="qty-control"><button disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={16}/></button><span>{qty}</span><button disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity"><Plus size={16}/></button></div><button className="btn-primary grow" disabled={Number(product.stock) <= 0} onClick={addItem}><ShoppingCart size={18}/> Add {qty > 1 ? `${qty} items` : "to cart"}</button><button className={`icon-btn favorite-btn ${wish ? "liked" : ""}`} onClick={toggle} aria-label="Wishlist"><Heart size={20} fill={wish ? "currentColor" : "none"}/></button></div>
        <div className="detail-benefits"><span><CheckCircle2/> Secure checkout</span><span><CheckCircle2/> Easy cart updates</span><span><CheckCircle2/> Order tracking</span></div>
      </div>
    </div>
  </div>;
}
