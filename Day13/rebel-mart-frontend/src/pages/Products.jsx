import { useEffect,useMemo,useState } from "react";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { getErrorMessage } from "../lib/constants";

export default function Products(){
  const [params,setParams]=useSearchParams(); const [products,setProducts]=useState([]); const [search,setSearch]=useState(params.get("search")||""); const [sort,setSort]=useState("featured"); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const load=async()=>{setLoading(true);setError("");try{const p={page:1,page_size:100};if(search.trim())p.search=search.trim();const {data}=await api.get("/products",{params:p});setProducts(Array.isArray(data)?data:data.items||[]);}catch(e){setError(getErrorMessage(e));}finally{setLoading(false);}};
  useEffect(()=>{const t=setTimeout(()=>load(),250);return()=>clearTimeout(t)},[search]);
  useEffect(()=>{const q=params.get("search")||"";if(q!==search)setSearch(q)},[params]);
  const visible=useMemo(()=>{const list=[...products];if(sort==="price-low")list.sort((a,b)=>Number(a.price)-Number(b.price));if(sort==="price-high")list.sort((a,b)=>Number(b.price)-Number(a.price));if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));return list},[products,sort]);
  return <div className="container page-section"><div className="page-heading"><div><div className="eyebrow">Catalog</div><h1>Find your next favorite.</h1><p>Search, compare and add products without the clutter.</p></div><div className="catalog-count">{visible.length} product{visible.length===1?"":"s"}</div></div>
    <div className="filter-bar"><div className="search-box"><Search size={18}/><input value={search} onChange={e=>{setSearch(e.target.value);setParams(e.target.value?{search:e.target.value}:{});}} placeholder="Search products…"/></div><div className="select-wrap"><SlidersHorizontal size={17}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></div><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17}/></button></div>
    {error&&<div className="alert error">{error}</div>}
    {loading?<div className="product-grid">{Array.from({length:8}).map((_,i)=><div className="skeleton-card" key={i}/>)}</div>:visible.length===0?<EmptyState icon={Search} title="No products found" text="Try a different search or clear your filters." action={<button className="btn-secondary" onClick={()=>{setSearch("");setParams({})}}>Clear search</button>}/>:<div className="product-grid">{visible.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
  </div>;
}
