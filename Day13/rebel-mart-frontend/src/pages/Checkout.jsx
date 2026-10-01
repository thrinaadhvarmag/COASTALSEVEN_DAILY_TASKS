import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "./CartContext";
import { getErrorMessage, imageUrl, money } from "../lib/constants";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const initial = { customer_name: "", phone: "", address: "", city: "", state: "", pincode: "", delivery_instructions: "" };

export default function Checkout(){
  const { items, clear, refreshCart } = useCart();
  const [products,setProducts]=useState({});
  const [form,setForm]=useState(initial);
  const [errors,setErrors]=useState({});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const {show}=useToast(); const navigate=useNavigate();

  useEffect(()=>{ refreshCart().finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ (async()=>{ const entries=await Promise.all(items.map(async i=>{ try{return [i.product_id,(await api.get(`/products/${i.product_id}`)).data]}catch{return [i.product_id,null]} })); setProducts(Object.fromEntries(entries)); })(); },[items]);

  const rows=items.map(i=>({...i,product:products[i.product_id]})).filter(r=>r.product);
  const total=useMemo(()=>rows.reduce((s,r)=>s+Number(r.product.price)*Number(r.quantity),0),[rows]);
  const set=(name,value)=>setForm(f=>({...f,[name]:value}));
  const validate=()=>{
    const e={};
    if(form.customer_name.trim().length<2)e.customer_name="Enter your full name";
    if(!/^[0-9+\- ]{10,15}$/.test(form.phone.trim()))e.phone="Enter a valid phone number";
    if(form.address.trim().length<5)e.address="Enter your delivery address";
    if(form.city.trim().length<2)e.city="Enter your city";
    if(form.state.trim().length<2)e.state="Enter your state";
    if(!/^[0-9]{6,10}$/.test(form.pincode.trim()))e.pincode="Enter a valid pincode";
    setErrors(e); return !Object.keys(e).length;
  };
  const placeOrder=async(e)=>{e.preventDefault(); if(!validate())return; setBusy(true); try{const {data}=await api.post("/orders",{...form,delivery_instructions:form.delivery_instructions.trim()||null}); show(`Order #${data.id} placed successfully`); await clear(); navigate(`/orders/${data.id}`);}catch(err){show(getErrorMessage(err),"error")}finally{setBusy(false)}};
  if(loading)return <div className="container page-section"><div className="spinner mx-auto"/></div>;
  if(!items.length)return <div className="container page-section"><EmptyState title="Your cart is empty" text="Add products before continuing to checkout." action={<Link className="btn-primary" to="/products">Browse products <ArrowRight size={17}/></Link>}/></div>;
  return <div className="container page-section">
    <Link className="back-link" to="/cart"><ArrowLeft size={16}/> Back to cart</Link>
    <div className="page-heading checkout-heading"><div><div className="eyebrow">Secure checkout</div><h1>Delivery details</h1><p>Tell us where to deliver your Rebel Mart order.</p></div></div>
    <div className="checkout-layout">
      <form className="card checkout-form" onSubmit={placeOrder}>
        <div className="section-title"><div><h2>Customer information</h2><p>These details are saved with this order so the admin can plan delivery.</p></div></div>
        <div className="form-grid">
          <label><span>Full name *</span><div className="field-icon"><UserRound size={16}/><input className="input" value={form.customer_name} onChange={e=>set("customer_name",e.target.value)} placeholder="Your full name"/></div>{errors.customer_name&&<small className="field-error">{errors.customer_name}</small>}</label>
          <label><span>Phone number *</span><div className="field-icon"><Phone size={16}/><input className="input" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="9876543210" inputMode="tel"/></div>{errors.phone&&<small className="field-error">{errors.phone}</small>}</label>
        </div>
        <label><span>Delivery address *</span><div className="field-icon"><MapPin size={16}/><textarea className="input textarea" value={form.address} onChange={e=>set("address",e.target.value)} placeholder="House/flat number, street, area"/></div>{errors.address&&<small className="field-error">{errors.address}</small>}</label>
        <div className="form-grid">
          <label><span>City *</span><input className="input" value={form.city} onChange={e=>set("city",e.target.value)} placeholder="City"/>{errors.city&&<small className="field-error">{errors.city}</small>}</label>
          <label><span>State *</span><input className="input" value={form.state} onChange={e=>set("state",e.target.value)} placeholder="State"/>{errors.state&&<small className="field-error">{errors.state}</small>}</label>
        </div>
        <div className="form-grid">
          <label><span>Pincode *</span><input className="input" value={form.pincode} onChange={e=>set("pincode",e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="6-digit pincode" inputMode="numeric"/>{errors.pincode&&<small className="field-error">{errors.pincode}</small>}</label>
          <label><span>Delivery instructions <em>optional</em></span><input className="input" value={form.delivery_instructions} onChange={e=>set("delivery_instructions",e.target.value)} placeholder="Gate, floor, landmark…"/></label>
        </div>
        <div className="checkout-security"><ShieldCheck size={18}/><div><strong>Your information is protected</strong><span>Your delivery details are attached to this order for fulfillment.</span></div></div>
        <button className="btn-primary full" disabled={busy}>{busy?"Placing order…":"Place order securely"}<ArrowRight size={17}/></button>
      </form>
      <aside className="card checkout-summary"><span className="eyebrow">Order summary</span><div className="checkout-items">{rows.map(r=><div className="checkout-item" key={r.product.id}><div className="cart-thumb">{r.product.image_url?<img src={imageUrl(r.product.image_url)} alt=""/>:<span>RM</span>}</div><div><strong>{r.product.name}</strong><span>Qty {r.quantity}</span></div><strong>{money(Number(r.product.price)*r.quantity)}</strong></div>)}</div><div className="summary-line"><span>Items</span><strong>{items.reduce((s,i)=>s+Number(i.quantity||0),0)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside>
    </div>
  </div>;
}
