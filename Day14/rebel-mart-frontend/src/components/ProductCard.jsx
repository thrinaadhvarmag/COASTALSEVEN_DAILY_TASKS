import { Link } from "react-router-dom";
import { Heart, ShoppingCart, ArrowUpRight, ImageOff } from "lucide-react";
import { imageUrl, money } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import { useToast } from "../context/ToastContext";
import { memo, useCallback, useState } from "react";

const WISH_KEY="rebel_mart_wishlist";
function readWish(){try{return JSON.parse(localStorage.getItem(WISH_KEY)||"[]")}catch{return[]}}

function ProductCard({ product, admin=false, onEdit, onDelete, onImage }) {
  const {add,loading}=useCart(); const {show}=useToast(); const [wish,setWish]=useState(()=>readWish().includes(product.id));
  const toggleWish=useCallback(()=>{const list=readWish();const next=list.includes(product.id)?list.filter(id=>id!==product.id):[...list,product.id];localStorage.setItem(WISH_KEY,JSON.stringify(next));setWish(!wish);show(wish?"Removed from wishlist":"Added to wishlist","info");},[show,wish]);
  const addToCart=useCallback(async()=>{try{await add(product.id);show("Added to cart");}catch(e){show(e?.response?.data?.detail||"Could not add to cart","error");}},[add,show,product.id]);
  return <article className="product-card">
    <div className="product-media">
      {product.image_url?<img src={imageUrl(product.image_url)} alt={product.name} width="640" height="640" loading="lazy" decoding="async" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}}/>:<div className="product-placeholder"><span>RM</span><small>Image coming soon</small></div>} {product.image_url&&<div className="product-image-error hidden"><ImageOff size={28}/><strong>Image unavailable</strong><small>Admin can replace this image</small></div>}
      <div className="media-actions"><button className="round-action" onClick={toggleWish} aria-label="Wishlist">{wish?<Heart size={17} fill="currentColor"/>:<Heart size={17}/>}</button><Link className="round-action" to={`/products/${product.id}`} aria-label="View product"><ArrowUpRight size={17}/></Link></div>
      {Number(product.stock)<=0?<span className="stock-badge sold">Sold out</span>:Number(product.stock)<=5?<span className="stock-badge low">Only {product.stock} left</span>:null}
    </div>
    <div className="product-body"><div className="eyebrow">Rebel Mart</div><Link className="product-title" to={`/products/${product.id}`}>{product.name}</Link><p className="product-description">{product.description||"Quality product from Rebel Mart."}</p>
      <div className="product-footer"><div><strong>{money(product.price)}</strong><span>{product.stock} in stock</span></div>{!admin?<button disabled={loading||Number(product.stock)<=0} className="btn-primary small" onClick={addToCart}><ShoppingCart size={15}/>{loading?"Adding…":"Add to cart"}</button>:<div className="admin-actions"><button className="btn-secondary tiny" onClick={()=>onEdit(product)}>Edit</button><button className="btn-secondary tiny" onClick={()=>onImage(product)}>Image</button><button className="btn-danger tiny" onClick={()=>onDelete(product)}>Delete</button></div>}</div>
    </div>
  </article>;
}

export default memo(ProductCard);
