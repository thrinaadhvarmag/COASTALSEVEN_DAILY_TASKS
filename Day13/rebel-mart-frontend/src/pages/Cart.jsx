import { useEffect,useMemo,useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, ShieldCheck } from "lucide-react";
import { imageUrl,money } from "../lib/constants";
import api from "../services/api";
import { useCart } from "./CartContext";
import EmptyState from "../components/EmptyState";
import { Link, useNavigate } from "react-router-dom";

export default function Cart(){
  const {items,update,remove,clear,refreshCart}=useCart(); const [products,setProducts]=useState({}); const navigate=useNavigate();
  useEffect(()=>{refreshCart().catch(()=>{})},[]);
  useEffect(()=>{(async()=>{const entries=await Promise.all(items.map(async i=>{try{return [i.product_id,(await api.get(`/products/${i.product_id}`)).data]}catch{return [i.product_id,null]}}));setProducts(Object.fromEntries(entries))})()},[items]);
  const rows=items.map(i=>({...i,product:products[i.product_id]})).filter(r=>r.product);
  const total=useMemo(()=>rows.reduce((s,r)=>s+Number(r.product.price)*Number(r.quantity),0),[rows]);
  const checkout=()=>navigate("/checkout");
  if(!items.length)return <div className="container page-section"><EmptyState icon={ShoppingBag} title="Your cart is empty" text="Find something you love and it will appear here." action={<button className="btn-primary" onClick={()=>navigate("/products")}>Browse products <ArrowRight size={17}/></button>}/></div>;
  return <div className="container page-section"><div className="page-heading"><div><div className="eyebrow">Your bag</div><h1>Shopping cart</h1><p>Review your items before placing your order.</p></div><button className="btn-secondary" onClick={()=>clear().catch(()=>{})}><Trash2 size={16}/> Clear cart</button></div>
    <div className="cart-layout"><div className="cart-list">{rows.map(r=><div className="cart-row" key={r.product.id}><div className="cart-thumb">{r.product.image_url?<img src={imageUrl(r.product.image_url)} alt=""/>:<span>RM</span>}</div><div className="cart-info"><Link to={`/products/${r.product.id}`}>{r.product.name}</Link><span>{money(r.product.price)} each</span></div><div className="qty-control"><button onClick={()=>update(r.product.id,Math.max(1,r.quantity-1))}><Minus size={15}/></button><span>{r.quantity}</span><button onClick={()=>update(r.product.id,r.quantity+1)}><Plus size={15}/></button></div><strong className="cart-line-total">{money(Number(r.product.price)*r.quantity)}</strong><button className="icon-btn danger-icon" onClick={()=>remove(r.product.id)} aria-label="Remove"><Trash2 size={17}/></button></div>)}</div>
      <aside className="summary-card"><span className="eyebrow">Order summary</span><div className="summary-line"><span>Items</span><strong>{items.reduce((s,i)=>s+Number(i.quantity||0),0)}</strong></div><div className="summary-line"><span>Subtotal</span><strong>{money(total)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><button className="btn-primary full" disabled={!rows.length} onClick={checkout}>Continue to checkout<ArrowRight size={17}/></button><div className="secure-note"><ShieldCheck size={16}/> Secure account-protected checkout</div></aside>
    </div>
  </div>;
}
