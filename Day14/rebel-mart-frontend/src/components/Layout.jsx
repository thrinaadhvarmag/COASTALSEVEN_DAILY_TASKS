import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingCart, LogOut, X } from "./icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { imageUrl } from "../lib/constants";

export default function Layout({ children }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth(); const { count } = useCart(); const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false); const [query, setQuery] = useState("");
  const nav = [["Shop", "/products"], ...(isAuthenticated ? [["Orders", "/orders"]] : []), ...(isAdmin ? [["Admin", "/admin"]] : [])];
  const search = (e) => { e.preventDefault(); navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products"); setMobileOpen(false); };
  const signOut = () => { logout(); navigate("/login"); };
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <Logo/><nav className="desktop-nav">{nav.map(([label,to])=><NavLink key={to} to={to} className={({isActive})=>isActive?"nav-link active":"nav-link"}>{label}</NavLink>)}</nav>
      <div className="header-actions">
        <form className="header-search" onSubmit={search}><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products" aria-label="Search products"/></form>
        <ThemeToggle/>
        {isAuthenticated && <Link className="icon-btn cart-button" to="/cart" title="Cart"><ShoppingCart size={18}/>{count>0&&<b>{count>99?"99+":count}</b>}</Link>}
        {isAuthenticated ? <div className="profile-menu"><Link to="/profile" className="user-chip"><span className="mini-avatar">{user?.profile_image_url ? <img src={imageUrl(user.profile_image_url)} alt=""/> : (user?.username||"R")[0].toUpperCase()}</span><span className="user-chip-name">{user?.username}</span></Link><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div> : <Link className="btn-primary small" to="/login">Sign in</Link>}
        <button className="mobile-menu-btn icon-btn" onClick={()=>setMobileOpen(v=>!v)} aria-label="Menu">{mobileOpen?<X/>:<Menu/>}</button>
      </div>
    </div>
    {mobileOpen&&<div className="mobile-panel"><form className="mobile-search" onSubmit={search}><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products"/></form>{nav.map(([label,to])=><NavLink key={to} to={to} onClick={()=>setMobileOpen(false)} className="mobile-link">{label}</NavLink>)}{isAuthenticated&&<Link to="/profile" onClick={()=>setMobileOpen(false)} className="mobile-link">Profile</Link>}{isAuthenticated&&<button className="mobile-link danger-text" onClick={signOut}>Sign out</button>}</div>}</header>
    {isAuthenticated&&<div className="account-strip"><div className="container strip-inner"><span>Signed in as <strong>{user?.username}</strong></span><span>{isAdmin?"Administrator":"Customer"}</span></div></div>}
    <main>{children}</main>
    <footer className="site-footer"><div className="container footer-grid"><div><Logo/><p className="footer-copy">A modern shopping experience built around speed, clarity and trust.</p></div><div><h2>Shop</h2><Link to="/products">All products</Link><Link to="/cart">Cart</Link></div><div><h2>Account</h2><Link to={isAuthenticated?"/profile":"/login"}>{isAuthenticated?"Profile":"Sign in"}</Link>{isAuthenticated&&<Link to="/orders">Orders</Link>}</div></div><div className="container footer-bottom">© {new Date().getFullYear()} Rebel Mart. Built for a great customer experience.</div></footer>
  </div>;
}
