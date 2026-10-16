import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingCart, LogOut, X } from "./icons";
import {
  LayoutDashboard, FileText, UploadCloud, Boxes, Package, ClipboardList,
  MessageCircle, House, ShoppingBag, UserRound, Warehouse, Bell, Check,
  ExternalLink, Images, ChevronDown, ChevronRight, Store, Heart, ArrowLeftRight, Sparkles,
  ShieldCheck, Truck, Film, Flame, Award, Tag
} from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { API_URL, imageUrl, money } from "../lib/constants";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import api from "../services/api";

const NotificationsPanel = lazy(() => import("./NotificationsPanel"));
const AIShoppingAssistant = lazy(() => import("./AIShoppingAssistant"));
const CustomerLiveChat = lazy(() =>
  import("./LiveChat").then((module) => ({ default: module.CustomerLiveChat })),
);

function AdminMessageAlert() {
  const { token } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const playAlertTone = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      oscillator.onended = () => { void context.close(); };
    } catch { /* Audio may be blocked */ }
  }, []);

  const onMessage = useCallback((message) => {
    if (!message || message.event !== "chat_notification") return;
    const messageId = String(message.message_id || `${message.customer_id}-${message.created_at}-${message.text}`);
    const customer = message.customer_name || `Customer #${message.customer_id}`;
    const preview = String(message.text || "New customer message").slice(0, 140);
    const alert = {
      id: messageId,
      customerId: Number(message.customer_id),
      customer,
      preview,
      createdAt: message.created_at || new Date().toISOString(),
    };
    setAlerts((items) => items.some((item) => item.id === messageId) ? items : [alert, ...items].slice(0, 6));
    show(`New support message from ${customer}: ${preview}`, "info");
    playAlertTone();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notification = new Notification(`Rebel Mart · New message from ${customer}`, {
          body: preview,
          tag: `admin-chat-${messageId}`,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          navigate(`/admin/chat?customerId=${encodeURIComponent(message.customer_id)}`);
          notification.close();
        };
      } catch { /* In-app alert fallback */ }
    }
  }, [navigate, playAlertTone, show]);

  const url = token ? `${API_URL.startsWith("https://") ? "wss" : "ws"}://${API_URL.replace(/^https?:\/\//, "")}/ws/admin/chat?token=${encodeURIComponent(token)}` : null;
  const connection = useWebSocket(url, { enabled: Boolean(token && url), onMessage });

  const enableDesktopNotifications = async () => {
    if (!("Notification" in window)) {
      setDesktopPermission("unsupported");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      if (permission === "granted") show("Desktop support alerts enabled", "success");
    } catch {
      setDesktopPermission(Notification.permission);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`admin-support-alert-fab${alerts.length ? " has-unread" : ""}`}
        onClick={() => setPanelOpen((open) => !open)}
        aria-label={`Support alerts${alerts.length ? `, ${alerts.length} unread` : ""}`}
        aria-expanded={panelOpen}
        title="Support alerts"
      >
        <Bell size={21} />
        {alerts.length > 0 && <span className="admin-support-alert-dot">{alerts.length > 9 ? "9+" : alerts.length}</span>}
      </button>
      {panelOpen && (
        <aside id="admin-support-alert-panel" className="admin-live-alert-center" aria-live="polite">
          <div className="admin-live-alert-toolbar">
            <span className="admin-live-alert-heading"><Bell size={16} /> Support alerts <b>{alerts.length}</b></span>
            <span className={`admin-live-alert-status ${connection.status === "open" ? "connected" : "disconnected"}`}>
              {connection.status === "open" ? "Live" : "Reconnecting…"}
            </span>
            <button type="button" className="admin-alert-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close"><X size={16} /></button>
            {desktopPermission === "default" && <button type="button" className="admin-enable-desktop-alerts" onClick={enableDesktopNotifications}>Enable desktop alerts</button>}
            {alerts.length > 0 && <button type="button" className="admin-dismiss-alerts" onClick={() => setAlerts([])}><Check size={13} /> Clear all</button>}
          </div>
          {alerts.length > 0 ? (
            <div className="admin-live-alert-list">
              {alerts.map((alert) => (
                <article className="admin-live-alert-item" key={alert.id}>
                  <span className="admin-live-alert-icon"><MessageCircle size={17} /></span>
                  <div className="admin-live-alert-copy">
                    <strong>{alert.customer}</strong>
                    <p>{alert.preview}</p>
                    <time>{new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                  </div>
                  <button type="button" className="admin-live-alert-open" onClick={() => { setPanelOpen(false); navigate(`/admin/chat?customerId=${alert.customerId}`); }} aria-label="Open conversation"><ExternalLink size={15} /></button>
                  <button type="button" className="admin-live-alert-close" onClick={() => setAlerts((items) => items.filter((item) => item.id !== alert.id))} aria-label="Dismiss">×</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-live-alert-empty">
              <MessageCircle size={24} />
              <strong>No new support messages</strong>
              <span>Customer messages appear here.</span>
            </div>
          )}
        </aside>
      )}
    </>
  );
}

export default function Layout({ children }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [movieOpen, setMovieOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

  const adminNav = [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Generate invoices", "/admin/invoices", FileText],
    ["CSV bulk upload", "/admin/import", UploadCloud],
    ["Inventory control", "/admin/inventory", Boxes],
    ["Product management", "/admin/products", Package],
    ["Order management", "/admin/orders", ClipboardList],
    ["Chat with customers", "/admin/chat", MessageCircle],
    ["Homepage editor", "/admin/homepage", Images],
  ];

  const categories = [
    { label: "T-Shirts", to: "/products?search=T-Shirts" },
    { label: "Hoodies", to: "/products?search=Hoodies" },
    { label: "Posters & Frames", to: "/products?search=Posters" },
    { label: "Collectibles & Action Figures", to: "/products?search=Collectibles" },
    { label: "Accessories", to: "/products?search=Accessories" },
  ];

  const movieUniverses = [
    { label: "Salaar: Ceasefire", to: "/products?search=Salaar", icon: "🗡️", tag: "Khansaar Epic" },
    { label: "Kalki 2898 AD", to: "/products?search=Kalki", icon: "⚡", tag: "Sci-Fi Saga" },
    { label: "Baahubali Saga", to: "/products?search=Baahubali", icon: "👑", tag: "Mahishmati Royal" },
    { label: "The Raja Saab", to: "/products?search=Raja%20Saab", icon: "🎩", tag: "Vintage Swagger" },
    { label: "Saaho Waaji City", to: "/products?search=Saaho", icon: "🕶️", tag: "Waaji Thriller" },
    { label: "Mirchi Iconic", to: "/products?search=Mirchi", icon: "🔥", tag: "Rebel Classic" },
  ];

  // Live search suggestions as user types
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/products", { params: { search: query.trim(), page: 1, page_size: 5 } });
        setSuggestions(Array.isArray(data) ? data : (data.items || []));
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products");
    closeMenus();
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setShopOpen(false);
    setMovieOpen(false);
    setAdminMenuOpen(false);
    setShowSuggestions(false);
  };

  return (
    <div className={`app-shell${isAdmin ? " admin-app-shell" : " storefront-app-shell"}`}>
      {/* Top Cinema Ticker */}
      {!isAdmin && (
        <aside className="store-announcement" aria-label="Announcement">
          {/* Desktop Static Ticker */}
          <div className="ticker-content desktop-ticker">
            <span className="badge-pill">🔥 PRABHAS BIRTHDAY SALE</span>
            <span>FLAT 23% OFF STOREWIDE · CODE: <strong>WELCOME10</strong> FOR EXTRA 10% OFF</span>
            <span className="badge-pill">🚚 FREE SHIPPING</span>
            <span>ON ORDERS OVER ₹999 ACROSS INDIA</span>
          </div>

          {/* Mobile Continuous Smooth Marquee Ticker */}
          <Link to="/offers" onClick={closeMenus} className="mobile-ticker-marquee-link" aria-label="View Prabhas birthday sale offers">
            <div className="mobile-ticker-marquee">
              <div className="mobile-ticker-track">
                <span className="badge-pill">🔥 PRABHAS BIRTHDAY SALE</span>
                <span className="ticker-text">FLAT 23% OFF STOREWIDE</span>
                <span className="ticker-bullet">•</span>
                <span className="ticker-text">USE CODE: <strong>WELCOME10</strong></span>
                <span className="ticker-bullet">•</span>
                <span className="ticker-text">🚚 FREE SHIPPING OVER ₹999</span>
                <span className="ticker-bullet">•</span>
                <span className="badge-pill">🔥 PRABHAS BIRTHDAY SALE</span>
                <span className="ticker-text">FLAT 23% OFF STOREWIDE</span>
                <span className="ticker-bullet">•</span>
                <span className="ticker-text">USE CODE: <strong>WELCOME10</strong></span>
                <span className="ticker-bullet">•</span>
                <span className="ticker-text">🚚 FREE SHIPPING OVER ₹999</span>
              </div>
            </div>
          </Link>

          <Link to="/offers" onClick={closeMenus} className="desktop-offers-link">View All Offers →</Link>
        </aside>
      )}

      {/* Main Header */}
      <header className="site-header">
        <div className="header-inner">
          <Logo toHome={!isAdmin} />

          {/* Customer Desktop Navigation - Minimalist 2-Option Layout */}
          {!isAdmin && (
            <nav className="desktop-nav" aria-label="Main navigation">
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={closeMenus}>
                Home
              </NavLink>

              {/* Mega Dropdown for "Shop" containing all options */}
              <div
                className="nav-shop-dropdown-wrap"
                style={{ position: "relative" }}
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <button
                  type="button"
                  className={`nav-link nav-shop-btn${shopOpen || location.pathname.startsWith("/products") || location.pathname === "/offers" || location.pathname === "/rewards" ? " active" : ""}`}
                  onClick={() => setShopOpen((v) => !v)}
                  aria-expanded={shopOpen}
                  aria-haspopup="true"
                >
                  <ShoppingBag size={15} color="var(--accent)" />
                  <span>Shop</span>
                  <ChevronDown size={14} style={{ transform: shopOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {shopOpen && (
                  <div className="nav-shop-megamenu card" role="menu">
                    {/* Column 1: Core Navigation */}
                    <div className="megamenu-col">
                      <div className="megamenu-heading">
                        <Sparkles size={13} color="var(--accent)" /> Explore Store
                      </div>
                      <Link to="/products" onClick={closeMenus} className="megamenu-link highlighted">
                        <Package size={15} color="var(--accent)" />
                        <div>
                          <strong>All Merchandise</strong>
                          <small>Complete Rebel Star catalogue</small>
                        </div>
                      </Link>
                      <Link to="/offers" onClick={closeMenus} className="megamenu-link">
                        <Tag size={15} color="var(--accent)" />
                        <div>
                          <strong>Offers & Deals</strong>
                          <small>Prabhas Birthday season discounts</small>
                        </div>
                      </Link>
                      <Link to="/rewards" onClick={closeMenus} className="megamenu-link">
                        <Award size={15} color="var(--accent)" />
                        <div>
                          <strong>Rebel Club Rewards</strong>
                          <small>Earn points on delivered orders</small>
                        </div>
                      </Link>
                    </div>

                    {/* Column 2: Cinema Universes */}
                    <div className="megamenu-col">
                      <div className="megamenu-heading">
                        <Film size={13} color="var(--accent)" /> Cinema Universes
                      </div>
                      <div className="megamenu-subgrid">
                        {movieUniverses.map((m) => (
                          <Link key={m.label} to={m.to} onClick={closeMenus} className="megamenu-pill-link">
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Categories */}
                    <div className="megamenu-col">
                      <div className="megamenu-heading">
                        <Boxes size={13} color="var(--accent)" /> Categories
                      </div>
                      <div className="megamenu-list">
                        {categories.map((c) => (
                          <Link key={c.label} to={c.to} onClick={closeMenus} className="megamenu-category-link">
                            <span>{c.label}</span>
                            <span className="megamenu-arrow">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Header Right Actions */}
          <div className="header-actions">
            {isAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <NavLink to="/" end className="btn-secondary small"><House size={14} /> Storefront</NavLink>
                <NavLink to="/products" className="btn-secondary small"><Store size={14} /> Catalog</NavLink>
                <ThemeToggle />
                <button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={16} /></button>
              </div>
            ) : (
              <>
                {/* Search Bar with Autocomplete Suggestions */}
                <div ref={searchWrapRef} className="header-search-wrap" style={{ position: "relative" }}>
                  <form className="header-search" onSubmit={search}>
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search Salaar, Kalki, T-Shirts…"
                      aria-label="Search products"
                    />
                  </form>

                  {/* Instant Search Suggestions Popover */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      className="card"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        zIndex: 65,
                        padding: "8px",
                        boxShadow: "var(--shadow)",
                        border: "1px solid var(--border-gold)",
                        display: "grid",
                        gap: "6px",
                      }}
                    >
                      <div style={{ padding: "4px 8px", fontSize: "10.5px", fontWeight: "800", color: "var(--accent)", textTransform: "uppercase" }}>
                        Matching Products
                      </div>
                      {suggestions.map((item) => (
                        <Link
                          key={item.id}
                          to={`/products/${item.id}`}
                          onClick={closeMenus}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            transition: "background-color 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ width: "36px", height: "36px", borderRadius: "6px", overflow: "hidden", background: "var(--surface-2)", flex: "none" }}>
                            {item.image_url ? (
                              <img src={imageUrl(item.image_url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: "10px", color: "var(--faint)" }}>RM</div>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--accent)" }}>
                              {money(item.price)} {item.movie_name ? `· 🎬 ${item.movie_name}` : ""}
                            </div>
                          </div>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={search}
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "var(--accent)",
                          borderTop: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                        }}
                      >
                        View all results for &quot;{query}&quot; →
                      </button>
                    </div>
                  )}
                </div>

                {/* Persistent Utility Action Group */}
                <div className="header-utility-group">
                  <ThemeToggle />

                  {isAuthenticated && <Suspense fallback={null}><NotificationsPanel /></Suspense>}

                  {/* Wishlist Link with Live Heart */}
                  <Link className="icon-btn header-wishlist-icon" to="/wishlist" title="Wishlist" aria-label="Wishlist">
                    <Heart size={18} />
                  </Link>

                  {/* Shopping Cart Button */}
                  <Link className="icon-btn cart-button" to="/cart" title="Shopping Cart" aria-label="Shopping Cart">
                    <ShoppingCart size={18} />
                    {count > 0 && <b>{count > 99 ? "99+" : count}</b>}
                  </Link>

                  {/* Account / Profile Chip or Sign-in Button */}
                  {isAuthenticated ? (
                    <div className="profile-menu">
                      <Link to="/profile" className="user-chip" title="My Profile">
                        <span className="mini-avatar">
                          {user?.profile_image_url ? (
                            <img src={imageUrl(user.profile_image_url)} alt="" />
                          ) : (
                            (user?.username || "R")[0].toUpperCase()
                          )}
                        </span>
                        <span className="user-chip-name">{user?.username}</span>
                      </Link>
                      <button className="icon-btn" title="Sign out" onClick={signOut} aria-label="Sign out">
                        <LogOut size={16} />
                      </button>
                    </div>
                  ) : (
                    <Link className="btn-primary small header-signin-btn" to="/login" title="Sign in">
                      <UserRound size={14} />
                      <span>Sign in</span>
                    </Link>
                  )}

                  {/* Mobile Hamburger Button */}
                  <button
                    className="mobile-menu-btn icon-btn"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Menu"
                    aria-expanded={mobileOpen}
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Slide-Out Panel */}
        {mobileOpen && !isAdmin && (
          <div className="mobile-panel" id="mobile-navigation-drawer">
            {/* 1. Mobile User Profile Card or Guest Welcome Banner */}
            {!isAuthenticated ? (
              <div className="mobile-drawer-auth-card">
                <div className="mobile-auth-intro">
                  <div className="mobile-auth-badge">
                    <Sparkles size={12} /> REBEL STAR PRABHAS OFFICIAL
                  </div>
                  <strong className="mobile-drawer-auth-title">Welcome to Rebel Mart</strong>
                  <span className="mobile-drawer-auth-sub">
                    Sign in to track orders, earn fan reward points & get VIP access.
                  </span>
                </div>
                <Link to="/login" onClick={closeMenus} className="btn-primary full mobile-auth-btn">
                  <UserRound size={16} /> Sign in / Register
                </Link>
              </div>
            ) : (
              <div className="mobile-drawer-user-card">
                <div className="mobile-user-card-top">
                  <span className="mobile-user-avatar">
                    {user?.profile_image_url ? (
                      <img src={imageUrl(user.profile_image_url)} alt={user?.username || "User"} />
                    ) : (
                      (user?.username || "R")[0].toUpperCase()
                    )}
                  </span>
                  <div className="mobile-user-details">
                    <div className="mobile-user-name-row">
                      <strong className="mobile-user-name">{user?.username}</strong>
                      <span className="mobile-user-tier-badge">Fan Club</span>
                    </div>
                    <span className="mobile-user-email">{user?.email}</span>
                  </div>
                </div>

                <div className="mobile-user-card-actions">
                  <Link to="/profile" onClick={closeMenus} className="mobile-user-action-btn profile">
                    <UserRound size={13} />
                    <span>My Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenus();
                      signOut();
                    }}
                    className="mobile-user-action-btn signout"
                    title="Sign out"
                  >
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Mobile Search Input */}
            <form className="mobile-search-bar" onSubmit={search}>
              <Search size={16} className="mobile-search-icon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Salaar, Kalki, T-Shirts, Hoodies…"
                aria-label="Search mobile"
              />
              {query && (
                <button
                  type="button"
                  className="mobile-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* 3. Primary Navigation Group */}
            <div className="mobile-nav-group">
              <NavLink to="/" end onClick={closeMenus} className="mobile-nav-row">
                <span className="mobile-nav-icon-wrap">
                  <House size={16} />
                </span>
                <span className="mobile-nav-label">Storefront Home</span>
                <ChevronRight size={15} className="mobile-nav-chevron" />
              </NavLink>

              <NavLink to="/products" onClick={closeMenus} className="mobile-nav-row">
                <span className="mobile-nav-icon-wrap">
                  <ShoppingBag size={16} />
                </span>
                <span className="mobile-nav-label">All Merchandise</span>
                <span className="mobile-nav-tag">New</span>
                <ChevronRight size={15} className="mobile-nav-chevron" />
              </NavLink>

              <NavLink to="/offers" onClick={closeMenus} className="mobile-nav-row">
                <span className="mobile-nav-icon-wrap">
                  <Tag size={16} />
                </span>
                <span className="mobile-nav-label">Offers & Deals</span>
                <span className="mobile-nav-tag discount">23% OFF</span>
                <ChevronRight size={15} className="mobile-nav-chevron" />
              </NavLink>

              <NavLink to="/rewards" onClick={closeMenus} className="mobile-nav-row">
                <span className="mobile-nav-icon-wrap">
                  <Award size={16} />
                </span>
                <span className="mobile-nav-label">Rebel Club Rewards</span>
                <ChevronRight size={15} className="mobile-nav-chevron" />
              </NavLink>
            </div>

            {/* 4. Movie Universes Grid (Curated 6 items: 2 columns x 3 rows) */}
            <div className="mobile-section-block">
              <div className="mobile-section-header">
                <span className="mobile-section-title">
                  <Film size={13} /> Cinema Universes
                </span>
                <Link to="/products" onClick={closeMenus} className="mobile-section-link">
                  View all →
                </Link>
              </div>

              <div className="mobile-universes-grid">
                {movieUniverses.map((m) => (
                  <Link key={m.label} to={m.to} onClick={closeMenus} className="mobile-universe-card">
                    <span className="mobile-universe-emoji">{m.icon}</span>
                    <div className="mobile-universe-info">
                      <strong className="mobile-universe-name">{m.label.split(":")[0]}</strong>
                      <span className="mobile-universe-tag">{m.tag || "Collection"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 5. Account & Bag Quick Shortcuts */}
            <div className="mobile-shortcuts-grid">
              <NavLink to="/cart" onClick={closeMenus} className="mobile-shortcut-btn">
                <div className="mobile-shortcut-icon-box">
                  <ShoppingCart size={17} />
                  {count > 0 && <span className="mobile-shortcut-badge">{count > 99 ? "99+" : count}</span>}
                </div>
                <span className="mobile-shortcut-label">Cart</span>
              </NavLink>

              <NavLink to="/wishlist" onClick={closeMenus} className="mobile-shortcut-btn">
                <div className="mobile-shortcut-icon-box">
                  <Heart size={17} />
                </div>
                <span className="mobile-shortcut-label">Wishlist</span>
              </NavLink>

              <NavLink to={isAuthenticated ? "/orders" : "/login"} onClick={closeMenus} className="mobile-shortcut-btn">
                <div className="mobile-shortcut-icon-box">
                  <Package size={17} />
                </div>
                <span className="mobile-shortcut-label">My Orders</span>
              </NavLink>
            </div>

            {/* 6. Mobile Drawer Footer (Theme Toggle + Full Sign Out) */}
            <div className="mobile-drawer-footer">
              <div className="mobile-theme-row">
                <span className="mobile-theme-label">Appearance</span>
                <ThemeToggle showLabel={true} />
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    signOut();
                  }}
                  className="mobile-signout-full-btn"
                >
                  <LogOut size={15} />
                  <span>Sign out of account</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={isAdmin ? "admin-workspace-main" : "storefront-main"}>{children}</main>

      {/* Floating Live Support & AI Shopping Assistant: Available to all shoppers */}
      {!isAdmin && <Suspense fallback={null}><CustomerLiveChat /></Suspense>}
      {!isAdmin && <Suspense fallback={null}><AIShoppingAssistant /></Suspense>}
      {isAuthenticated && isAdmin && <AdminMessageAlert />}

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`mobile-bottom-nav${isAdmin ? " admin-mobile-bottom-nav" : ""}`} aria-label="Mobile Navigation">
        {(isAdmin
          ? [
              ["Dashboard", "/admin", LayoutDashboard],
              ["Products", "/admin/products", Package],
              ["Inventory", "/admin/inventory", Warehouse],
              ["Orders", "/admin/orders", ClipboardList],
              ["Support", "/admin/chat", MessageCircle],
            ]
          : [
              ["Home", "/", House],
              ["Catalog", "/products", ShoppingBag],
              ["Wishlist", "/wishlist", Heart],
              ["Cart", "/cart", ShoppingCart],
              [isAuthenticated ? "Profile" : "Sign in", isAuthenticated ? "/profile" : "/login", UserRound],
            ]
        ).map(([label, to, Icon]) => (
          <NavLink
            key={label}
            to={to}
            end={to === "/" || to === "/admin"}
            className={({ isActive }) => `mobile-bottom-link${isActive ? " active" : ""}`}
            aria-label={label}
            onClick={() => {
              closeMenus();
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
              document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
            }}
          >
            <span className="bottom-icon-wrap">
              <Icon size={20} />
              {label === "Cart" && count > 0 && <span className="bottom-count">{count > 99 ? "99+" : count}</span>}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Customer Storefront Footer */}
      {!isAdmin && (
        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <Logo />
              <p className="footer-copy">
                The official premier fan destination celebrating Indian cinema superstar <strong>Rebel Star Prabhas</strong>.
                Authentic apparel, high-detail collectibles, limited-run posters and keepsakes from Baahubali, Salaar, Kalki 2898 AD, and The Raja Saab.
              </p>
              <div style={{ display: "flex", gap: "16px", marginTop: "16px", color: "var(--faint)", fontSize: "12px" }}>
                <span>🎬 Salaar</span>
                <span>⚡ Kalki 2898 AD</span>
                <span>👑 Baahubali</span>
                <span>🎩 The Raja Saab</span>
              </div>
            </div>

            <div>
              <h2>Explore Fandom</h2>
              <Link to="/products?search=Salaar">Salaar Collection</Link>
              <Link to="/products?search=Kalki">Kalki 2898 AD Apparel</Link>
              <Link to="/products?search=Baahubali">Baahubali Royal Keepsakes</Link>
              <Link to="/products?search=T-Shirts">Graphic T-Shirts</Link>
              <Link to="/products?search=Collectibles">Limited Collectibles</Link>
              <Link to="/offers">Special Fan Offers</Link>
            </div>

            <div>
              <h2>Customer Assurances</h2>
              <div style={{ display: "grid", gap: "10px", fontSize: "13px", color: "var(--muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={16} color="var(--accent)" /> 100% Official Merchandise
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={16} color="var(--accent)" /> Express Pan-India Delivery
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Award size={16} color="var(--accent)" /> Rebel Club Loyalty Rewards
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageCircle size={16} color="var(--accent)" /> 24/7 Fan Support Chat
                </span>
              </div>
              <div style={{ marginTop: "18px" }}>
                <Link to={isAuthenticated ? "/orders" : "/login"} style={{ fontWeight: "700", color: "var(--accent)" }}>
                  {isAuthenticated ? "Track My Orders →" : "Sign In to Track Orders →"}
                </Link>
              </div>
            </div>
          </div>

          <div className="container footer-bottom">
            <span>© {new Date().getFullYear()} REBEL MART. All cinema artwork and fan merchandise officially curated for Rebel Star fans.</span>
            <span>Made with passion for Indian Cinema.</span>
          </div>
        </footer>
      )}
    </div>
  );
}
