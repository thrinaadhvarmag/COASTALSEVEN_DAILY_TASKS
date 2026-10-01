import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(false);
  const refreshCart=async()=>{const {data}=await api.get("/cart"); setItems(data.items||[]); return data.items||[];};
  useEffect(()=>{if(localStorage.getItem("rebel_mart_token")) refreshCart().catch(()=>{});},[]);
  const add=async(productId,quantity=1)=>{setLoading(true);try{const {data}=await api.post("/cart/items",{product_id:productId,quantity});setItems(data.items||[]);return data;}finally{setLoading(false);}};
  const update=async(productId,quantity)=>{const {data}=await api.put(`/cart/items/${productId}`,{quantity});setItems(data.items||[]);};
  const remove=async(productId)=>{const {data}=await api.delete(`/cart/items/${productId}`);setItems(data.items||[]);};
  const clear=async()=>{await api.delete("/cart");setItems([]);};
  const count=items.reduce((s,i)=>s+Number(i.quantity||0),0);
  return <CartContext.Provider value={useMemo(()=>({items,loading,count,refreshCart,add,update,remove,clear}),[items,loading,count])}>{children}</CartContext.Provider>;
}
export const useCart=()=>useContext(CartContext);
