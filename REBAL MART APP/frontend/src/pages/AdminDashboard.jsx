import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ImagePlus, Package, RefreshCw, ShoppingBag, X, UploadCloud, Eye, TrendingUp, 
  MessageCircle, Sparkles, Images, CheckCircle2, Clock, Truck, Search, 
  Filter, Phone, MapPin, User, Tag, SlidersHorizontal, Boxes, ArrowUpRight,
  ClipboardList, Check, AlertCircle, Layers, Pencil, Trash2, Plus, LayoutGrid, List
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { getErrorMessage, money, statusClasses, statusLabel, imageUrl } from "../lib/constants";
import { useToast } from "../context/ToastContext";
import { useAdminOrders, useAdminProducts, useAdminCustomers } from "../hooks/useAdminData";
import { useDeleteProductMutation, useUpdateProductMutation } from "../hooks/useProductMutations";
import { AdminLiveChat } from "../components/LiveChat";
import BackgroundJobsPanel from "../components/BackgroundJobsPanel";

const blank = { name: "", description: "", price: "", stock: "", actor_name: "Prabhas", movie_name: "", category: "", tags: "" };
const statuses = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const LOW_STOCK_THRESHOLD = 10;

const MOVIE_PRESETS = [
  "Salaar: Part 1 – Ceasefire",
  "Kalki 2898 AD",
  "Baahubali",
  "The Raja Saab",
  "Saaho",
  "Mirchi",
  "Spirit",
  "Darling",
  "Chatrapathi",
];

const CATEGORY_PRESETS = [
  "T-Shirts",
  "Hoodies",
  "Posters",
  "Collectibles",
  "Action Figures",
  "Accessories",
];

const TAG_SUGGESTIONS = [
  "rebel star",
  "official merchandise",
  "limited drop",
  "heavyweight cotton",
  "cinema collectible",
  "vintage wash",
];

const HOMEPAGE_DEFAULTS = {
  promo: { headline: "✦ REBEL MART FAN FEST", message: "Find your next favourite", cta: "Shop the collection" },
  campaigns: [
    { label: "THE REBEL COLLECTION", title: "Legends never fade.", copy: "Iconic fan merchandise. Everyday style. Made for the fans.", cta: "Shop the collection", image: "/events/saaho.webp" },
    { label: "ICONIC ERA", title: "Style with a story.", copy: "Celebrate the moments that made the fandom.", cta: "Explore fan favourites", image: "/events/darling.webp" },
    { label: "FRESH FROM THE REBELVERSE", title: "Your fandom. Your style.", copy: "Find your next favourite tee, collectible or poster.", cta: "Discover more", image: "/events/rajasaab.webp" }
  ],
  sale: { eyebrow: "PRABHAS BIRTHDAY SEASON", title: "Celebrate the Rebel Star.", description: "Enjoy 23% off every product during the Prabhas Birthday Season Sale. Discounted prices are shown across the store." },
  offers: [
    { label: "WELCOME OFFER", discount: "10% OFF", description: "On orders of ₹999 or more", code: "WELCOME10", hint: "Enter at checkout" },
    { label: "FAN FEST SPECIAL", discount: "15% OFF", description: "On orders of ₹1,999 or more", code: "REBEL15", hint: "Enter at checkout" }
  ],
  categoriesTitle: { eyebrow: "FIND YOUR FAVOURITE", title: "Shop by category", description: "Your favourite fandom essentials, all in one place." },
  categories: [
    { name: "T-Shirts", sub: "Everyday fan essentials", image: "/categories/tshirts.webp", search: "T-Shirts" },
    { name: "Hoodies", sub: "Layer up in style", image: "/categories/hoodies.jpeg", search: "Hoodies" },
    { name: "Posters", sub: "Bring cinema home", image: "/categories/posters.jpg", search: "Posters" },
    { name: "Collectibles", sub: "For the true fans", image: "/categories/collectibles.jpg", search: "Collectibles" }
  ],
  benefits: [
    { title: "Reliable delivery", description: "Track your order every step" },
    { title: "Secure checkout", description: "Safe and trusted payments" },
    { title: "Fan-first offers", description: "Great picks at great prices" },
    { title: "Here to help", description: "Friendly customer support" }
  ],
  featuredTitle: { eyebrow: "HAND-PICKED FOR YOU", title: "Top picks for you", description: "Fan favourites selected for your collection." },
  editorial: { eyebrow: "MADE FOR THE FANDOM", title: "More than merch.\nIt's a statement.", description: "Bring your favourite stories into your everyday style with tees, posters, hoodies and collectibles.", cta: "Explore the collection", image: "/events/mirchi.webp", sticker: "Made for\ntrue fans" },
  bestTitle: { eyebrow: "FAN FAVOURITES", title: "Best sellers", description: "Popular picks the Rebel community keeps coming back to.", badge: "Popular pick" },
  newsletter: { eyebrow: "THE REBEL COMMUNITY", title: "Stay in the loop.", description: "Discover new drops, fan favourites and special offers.", cta: "Join Rebel Mart" }
};

function HomepageEditor({ show }) {
  const [content, setContent] = useState(HOMEPAGE_DEFAULTS);
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [saving, setSaving] = useState(false);
  const [, setUploading] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/homepage/content").then(({ data }) => {
      if (active) setContent({
        ...HOMEPAGE_DEFAULTS,
        ...data,
        promo: { ...HOMEPAGE_DEFAULTS.promo, ...data.promo },
        sale: { ...HOMEPAGE_DEFAULTS.sale, ...data.sale },
        campaigns: data.campaigns || HOMEPAGE_DEFAULTS.campaigns
      });
    }).catch(error => show(getErrorMessage(error), "error"));
    return () => { active = false; };
  }, [show]);

  const setField = (path, value) => setContent(current => {
    const next = structuredClone(current);
    let target = next;
    for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
    target[path[path.length - 1]] = value;
    return next;
  });

  const textField = (label, path, { multiline = false, help = "" } = {}) => {
    let value = content;
    for (const key of path) value = value?.[key];
    return (
      <label className="admin-homepage-field" key={path.join("-")}>
        <span>{label}</span>
        {multiline ? (
          <textarea rows={3} value={value ?? ""} onChange={e => setField(path, e.target.value)} />
        ) : (
          <input value={value ?? ""} onChange={e => setField(path, e.target.value)} />
        )}
        {help && <small>{help}</small>}
      </label>
    );
  };

  const selectImage = (key, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      show("Choose a JPG, PNG, or WEBP image under 5 MB", "error");
      return;
    }
    setFiles(v => ({ ...v, [key]: file }));
    setPreviews(v => {
      if (v[key]) URL.revokeObjectURL(v[key]);
      return { ...v, [key]: URL.createObjectURL(file) };
    });
  };

  const uploadImage = async (key, endpoint) => {
    if (!files[key]) return null;
    const formData = new FormData();
    formData.append("image", files[key]);
    const { data } = await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
    setFiles(v => { const n = { ...v }; delete n[key]; return n; });
    setPreviews(v => {
      if (v[key]) URL.revokeObjectURL(v[key]);
      const n = { ...v };
      delete n[key];
      return n;
    });
    return data;
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < content.campaigns.length; i++) {
        if (files[`campaign-${i}`]) {
          setUploading(i);
          const data = await uploadImage(`campaign-${i}`, `/homepage/campaigns/${i}/image`);
          if (data?.campaigns) content.campaigns = data.campaigns;
        }
      }
      for (const key of ["category-0", "category-1", "category-2", "category-3", "editorial-image"]) {
        if (files[key]) {
          const data = await uploadImage(key, `/homepage/assets/${key}/image`);
          const path = key === "editorial-image" ? ["editorial", "image"] : ["categories", Number(key.split("-")[1]), "image"];
          setField(path, data.image);
          let target = content;
          for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
          target[path[path.length - 1]] = data.image;
        }
      }
      setUploading(null);
      const { data } = await api.put("/homepage/content", content);
      setContent({ ...content, ...data, campaigns: data.campaigns || content.campaigns });
      show("All homepage text and settings saved successfully");
    } catch (error) {
      show(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
      setUploading(null);
    }
  };

  const imageSrc = (key, value) => previews[key] || (value?.startsWith("/uploads/") ? `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")}${value}` : value);

  const imageField = (label, key, path) => {
    let value = content;
    for (const k of path) value = value?.[k];
    return (
      <div className="admin-homepage-image-field" key={key}>
        <label>
          {label}
          <input value={value || ""} onChange={e => setField(path, e.target.value)} placeholder="/events/example.webp or https://…" />
        </label>
        <img src={imageSrc(key, value)} alt={`${label} preview`} onError={e => { e.currentTarget.style.opacity = ".25"; }} />
        <label className="btn-secondary admin-homepage-file">
          <ImagePlus size={16} />
          {files[key]?.name || "Upload replacement"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => selectImage(key, e.target.files?.[0])} />
        </label>
      </div>
    );
  };

  return (
    <section className="admin-homepage-editor admin-homepage-full-editor">
      <div className="card">
        <div className="eyebrow">Full storefront content management</div>
        <h2>Edit your entire homepage</h2>
        <p className="muted">
          Change hero text and images, announcement strip, sale copy, coupon cards, category names and images, benefits, product-section headings, editorial banner and newsletter call-to-action. Image uploads accept JPG, PNG or WEBP up to 5 MB. Press Save all homepage changes to publish.
        </p>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Announcement strip</h2>
        <div className="admin-homepage-fields">
          {textField("Headline", ["promo", "headline"])}
          {textField("Supporting message", ["promo", "message"])}
          {textField("Link text", ["promo", "cta"])}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Hero carousel — text and images</h2>
        <div className="admin-homepage-campaign-grid">
          {content.campaigns.map((campaign, index) => (
            <article className="card admin-homepage-campaign" key={index}>
              <div className="admin-homepage-preview">
                <img src={imageSrc(`campaign-${index}`, campaign.image)} alt={`Campaign ${index + 1} preview`} />
              </div>
              <span className="eyebrow">Campaign {index + 1}</span>
              <div className="admin-homepage-fields">
                {textField("Small label", ["campaigns", index, "label"])}
                {textField("Main heading", ["campaigns", index, "title"])}
                {textField("Description", ["campaigns", index, "copy"], { multiline: true })}
                {textField("Button text", ["campaigns", index, "cta"])}
              </div>
              <label className="btn-secondary admin-homepage-file">
                <ImagePlus size={16} />
                {files[`campaign-${index}`]?.name || "Choose hero image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => selectImage(`campaign-${index}`, e.target.files?.[0])} />
              </label>
            </article>
          ))}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Birthday sale section</h2>
        <div className="admin-homepage-fields">
          {textField("Sale eyebrow", ["sale", "eyebrow"])}
          {textField("Heading", ["sale", "title"])}
          {textField("Description", ["sale", "description"], { multiline: true })}
        </div>
        <h3>Offer cards</h3>
        <div className="admin-homepage-campaign-grid">
          {content.offers.map((offer, index) => (
            <article className="card" key={index}>
              <h3>Offer {index + 1}</h3>
              <div className="admin-homepage-fields">
                {textField("Label", ["offers", index, "label"])}
                {textField("Discount display", ["offers", index, "discount"])}
                {textField("Description", ["offers", index, "description"])}
                {textField("Coupon code", ["offers", index, "code"])}
                {textField("Helper text", ["offers", index, "hint"])}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Shop by category</h2>
        <div className="admin-homepage-fields">
          {textField("Section eyebrow", ["categoriesTitle", "eyebrow"])}
          {textField("Section heading", ["categoriesTitle", "title"])}
          {textField("Section description", ["categoriesTitle", "description"], { multiline: true })}
        </div>
        <div className="admin-homepage-campaign-grid">
          {content.categories.map((category, index) => (
            <article className="card" key={index}>
              <h3>Category {index + 1}</h3>
              <div className="admin-homepage-fields">
                {textField("Category name", ["categories", index, "name"])}
                {textField("Subtitle", ["categories", index, "sub"])}
                {textField("Search/category term", ["categories", index, "search"])}
              </div>
              {imageField("Category image", `category-${index}`, ["categories", index, "image"])}
            </article>
          ))}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Shopping benefits</h2>
        <div className="admin-homepage-campaign-grid">
          {content.benefits.map((benefit, index) => (
            <article className="card" key={index}>
              <h3>Benefit {index + 1}</h3>
              <div className="admin-homepage-fields">
                {textField("Title", ["benefits", index, "title"])}
                {textField("Description", ["benefits", index, "description"])}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Featured products section</h2>
        <div className="admin-homepage-fields">
          {textField("Eyebrow", ["featuredTitle", "eyebrow"])}
          {textField("Heading", ["featuredTitle", "title"])}
          {textField("Description", ["featuredTitle", "description"], { multiline: true })}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Editorial banner</h2>
        <div className="admin-homepage-fields">
          {textField("Eyebrow", ["editorial", "eyebrow"])}
          {textField("Heading (use a new line for line breaks)", ["editorial", "title"], { multiline: true })}
          {textField("Description", ["editorial", "description"], { multiline: true })}
          {textField("Button text", ["editorial", "cta"])}
          {textField("Image badge text (use a new line)", ["editorial", "sticker"], { multiline: true })}
        </div>
        {imageField("Editorial image", "editorial-image", ["editorial", "image"])}
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Best sellers section</h2>
        <div className="admin-homepage-fields">
          {textField("Eyebrow", ["bestTitle", "eyebrow"])}
          {textField("Heading", ["bestTitle", "title"])}
          {textField("Description", ["bestTitle", "description"], { multiline: true })}
          {textField("Popular product badge", ["bestTitle", "badge"])}
        </div>
      </div>
      <div className="card admin-homepage-editor-section">
        <h2>Newsletter / community call-to-action</h2>
        <div className="admin-homepage-fields">
          {textField("Eyebrow", ["newsletter", "eyebrow"])}
          {textField("Heading", ["newsletter", "title"])}
          {textField("Description", ["newsletter", "description"], { multiline: true })}
          {textField("Button text", ["newsletter", "cta"])}
        </div>
      </div>
      <div className="admin-homepage-save-bar">
        <span>Changes are only published after saving.</span>
        <button className="btn-primary" disabled={saving} onClick={saveAll}>
          {saving ? "Saving homepage…" : "Save all homepage changes"}
        </button>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split("/")[2] || "dashboard";

  const [form, setForm] = useState(blank);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockBusy, setStockBusy] = useState({});
  const [editing, setEditing] = useState(null);
  const [productViewMode, setProductViewMode] = useState("grid");
  const [showProductModal, setShowProductModal] = useState(false);
  const [imageTarget, setImageTarget] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [search, setSearch] = useState("");
  const [catalogMovieFilter, setCatalogMovieFilter] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("ALL");
  const [inventorySearch, setInventorySearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatCustomer, setChatCustomer] = useState(null);
  const chatParams = new URLSearchParams(location.search);
  const selectedChatId = chatCustomer?.id ?? (chatParams.get("customerId") ? Number(chatParams.get("customerId")) : null);
  const selectedChatName = chatCustomer?.name ?? chatParams.get("customerName") ?? "Customer";
  const [upload, setUpload] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [aiUsage, setAiUsage] = useState(null);
  const [aiUsageError, setAiUsageError] = useState("");
  const [aiPolicy, setAiPolicy] = useState({
    daily_requests_per_user: 100,
    daily_calls_per_provider: 50,
    daily_external_calls_limit: 0,
    monthly_budget_usd: 0,
    external_calls_enabled: false,
    estimated_cost_per_call_cents: 1
  });
  const [aiPolicySaving, setAiPolicySaving] = useState(false);
  const fileRef = useRef();
  const { show } = useToast();
  const queryClient = useQueryClient();
  const productsQuery = useAdminProducts();
  const ordersQuery = useAdminOrders();
  const customersQuery = useAdminCustomers();

  const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
  const orders = ordersQuery.data || [];
  const apiCustomers = customersQuery.data || [];
  const loading = productsQuery.isLoading || ordersQuery.isLoading;

  useEffect(() => {
    if (section !== "dashboard") return undefined;
    let live = true;
    let inFlight = false;
    const refreshLiveMetrics = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const [analyticsResult, usageResult] = await Promise.allSettled([
          api.get("/orders/admin/analytics"),
          api.get("/ai/usage"),
        ]);
        if (!live) return;
        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value.data);
          setAnalyticsError("");
        } else {
          setAnalyticsError(getErrorMessage(analyticsResult.reason));
        }
        if (usageResult.status === "fulfilled") {
          setAiUsage(usageResult.value.data);
          setAiUsageError("");
        } else {
          setAiUsageError(getErrorMessage(usageResult.reason));
        }
      } finally {
        inFlight = false;
      }
    };
    refreshLiveMetrics();
    const timer = window.setInterval(refreshLiveMetrics, 3000);
    const onFocus = () => refreshLiveMetrics();
    window.addEventListener("focus", onFocus);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [section]);

  useEffect(() => {
    if (section !== "dashboard") return undefined;
    let active = true;
    api.get("/ai/governance/settings").then(({ data }) => {
      if (active) setAiPolicy(current => ({ ...current, ...data }));
    }).catch(error => {
      if (active) setAiUsageError(getErrorMessage(error));
    });
    return () => { active = false; };
  }, [section]);

  const saveAiPolicy = async (event) => {
    event.preventDefault();
    setAiPolicySaving(true);
    try {
      const payload = {
        daily_requests_per_user: Number(aiPolicy.daily_requests_per_user),
        daily_calls_per_provider: Number(aiPolicy.daily_calls_per_provider),
        daily_external_calls_limit: Number(aiPolicy.daily_external_calls_limit),
        monthly_budget_usd: Number(aiPolicy.monthly_budget_usd),
        external_calls_enabled: Boolean(aiPolicy.external_calls_enabled),
        estimated_cost_per_call_cents: Number(aiPolicy.estimated_cost_per_call_cents),
      };
      const { data } = await api.put("/ai/governance/settings", payload);
      setAiPolicy(current => ({ ...current, ...data }));
      const { data: usage } = await api.get("/ai/usage");
      setAiUsage(usage);
      show("AI governance limits saved and applied", "success");
    } catch (error) {
      show(getErrorMessage(error), "error");
    } finally {
      setAiPolicySaving(false);
    }
  };

  const updateAiPolicyField = (key, value) => setAiPolicy(current => ({ ...current, [key]: value }));

  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();

  const load = async () => {
    try {
      await Promise.all([productsQuery.refetch(), ordersQuery.refetch()]);
      show("Data refreshed");
    } catch (e) {
      show(getErrorMessage(e), "error");
    }
  };

  // Filtered Products for Catalog section
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase()) && !String(p.id).includes(search)) return false;
      if (catalogMovieFilter && !(p.movie_name || "").toLowerCase().includes(catalogMovieFilter.toLowerCase())) return false;
      if (catalogCategoryFilter && !(p.category || "").toLowerCase().includes(catalogCategoryFilter.toLowerCase())) return false;
      return true;
    });
  }, [products, search, catalogMovieFilter, catalogCategoryFilter]);

  const displayProductNumbers = useMemo(() => {
    const ordered = [...products].sort((a, b) => Number(a.id) - Number(b.id));
    return new Map(ordered.map((product, index) => [Number(product.id), index + 1]));
  }, [products]);

  // Inventory metrics and filtering
  const inventory = useMemo(() => [...products].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)), [products]);
  const lowStock = products.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= LOW_STOCK_THRESHOLD).length;
  const outOfStock = products.filter(p => Number(p.stock || 0) <= 0).length;
  const totalUnits = products.reduce((s, p) => s + Number(p.stock || 0), 0);
  const stockValue = products.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.price || 0)), 0);
  const stockValueLabel = money(stockValue);

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
      const stock = Number(p.stock || 0);
      if (inventoryFilter === "LOW" && !(stock > 0 && stock <= LOW_STOCK_THRESHOLD)) return false;
      if (inventoryFilter === "OUT" && stock !== 0) return false;
      if (inventoryFilter === "HEALTHY" && stock <= LOW_STOCK_THRESHOLD) return false;
      if (!inventorySearch.trim()) return true;
      const q = inventorySearch.toLowerCase();
      return (p.name || "").toLowerCase().includes(q) || String(p.id).includes(q) || (p.movie_name || "").toLowerCase().includes(q);
    });
  }, [inventory, inventoryFilter, inventorySearch]);

  const getDraft = (p) => stockDrafts[p.id] ?? String(p.stock ?? 0);
  const setDraft = (id, value) => setStockDrafts(d => ({ ...d, [id]: value }));

  const saveStock = async (p, nextStock) => {
    const value = Number(nextStock);
    if (!Number.isInteger(value) || value < 0) {
      show("Stock must be a whole number of 0 or more", "error");
      return;
    }
    setStockBusy(b => ({ ...b, [p.id]: true }));
    try {
      await updateProductMutation.mutateAsync({
        productId: p.id,
        payload: { name: p.name, description: p.description || "", price: Number(p.price), stock: value }
      });
      show(`${p.name} stock updated to ${value}`);
      setStockDrafts(d => { const n = { ...d }; delete n[p.id]; return n; });
    } catch (e) {
      show(getErrorMessage(e), "error");
    } finally {
      setStockBusy(b => ({ ...b, [p.id]: false }));
    }
  };

  const quickRestock = (p, amount) => saveStock(p, Number(p.stock || 0) + amount);

  const chooseImage = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 5 * 1024 * 1024) {
      show("Use JPG, PNG or WEBP under 5 MB", "error");
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const resetForm = () => {
    setForm(blank);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setShowProductModal(false);
  };

  const openNewProductModal = () => {
    setForm(blank);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setShowProductModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        actor_name: form.actor_name.trim() || null,
        movie_name: form.movie_name.trim() || null,
        category: form.category.trim() || null,
        tags: form.tags.trim() || null
      };
      let product;
      if (editing) {
        product = await updateProductMutation.mutateAsync({ productId: editing.id, payload });
        show("Product updated successfully");
      } else {
        const r = await api.post("/products", payload);
        product = r.data;
        show("Product created successfully");
      }
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        await api.post(`/products/${product.id}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (p) => p.total && setUpload(Math.round((p.loaded * 100) / p.total))
        });
        show("Product image uploaded");
      }
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), "error");
    } finally {
      setBusy(false);
      setUpload(0);
    }
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      actor_name: p.actor_name || "Prabhas",
      movie_name: p.movie_name || "",
      category: p.category || "",
      tags: p.tags || ""
    });
    setImageFile(null);
    setImagePreview(p.image_url ? imageUrl(p.image_url) : "");
    setShowProductModal(true);
  };

  const generateDescription = async () => {
    if (!editing?.id) {
      show("Save the product first, then generate an AI description.", "error");
      return;
    }
    setBusy(true);
    try {
      const response = await api.post(`/ai/products/${editing.id}/generate-description`, {
        instructions: "Keep the Rebel Mart brand tone: high-octane cinema energy, premium craftsmanship, and official Prabhas fandom pride."
      });
      setForm((current) => ({ ...current, description: response.data.draft }));
      show("AI draft generated. Review it and save to publish.");
    } catch (error) {
      show(getErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  };

  const openImage = (p) => {
    setImageTarget(p);
    setImageFile(null);
    setImagePreview(p.image_url ? imageUrl(p.image_url) : "");
  };

  const uploadOnly = async () => {
    if (!imageTarget || !imageFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      await api.post(`/products/${imageTarget.id}/image`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      show("Product image updated");
      setImageTarget(null);
      setImageFile(null);
      setImagePreview("");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", imageTarget.id] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await deleteProductMutation.mutateAsync(p.id);
      show("Product removed from the catalogue");
    } catch (e) {
      show(getErrorMessage(e), "error");
    }
  };

  const updateOrder = async (o, status) => {
    try {
      await api.patch(`/orders/admin/${o.id}/status`, { status });
      show(`Order #${o.id} status changed to ${statusLabel(status)}`);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["order", o.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await load();
    } catch (e) {
      show(getErrorMessage(e), "error");
    }
  };

  // Order filtering and counts
  const orderCounts = useMemo(() => {
    const counts = { ALL: orders.length, CONFIRMED: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach(o => {
      const s = (o.status || "").toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === "ALL" || (o.status || "").toUpperCase() === orderStatusFilter;
      if (!matchesStatus) return false;
      if (!orderSearch.trim()) return true;
      const q = orderSearch.toLowerCase();
      const idMatch = String(o.id).includes(q) || `#${o.id}`.includes(q);
      const nameMatch = (o.customer_name || "").toLowerCase().includes(q);
      const phoneMatch = (o.phone || "").toLowerCase().includes(q);
      const cityMatch = (o.city || "").toLowerCase().includes(q);
      return idMatch || nameMatch || phoneMatch || cityMatch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const withImages = products.filter(p => p.image_url).length;
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  // Admin Subnavigation Tabs
  const adminTabs = [
    { id: "dashboard", label: "Dashboard", path: "/admin", icon: TrendingUp },
    { id: "products", label: "Products", path: "/admin/products", icon: Package },
    { id: "inventory", label: "Inventory", path: "/admin/inventory", icon: Boxes },
    { id: "orders", label: "Orders", path: "/admin/orders", icon: ClipboardList, badge: orderCounts.CONFIRMED + orderCounts.PROCESSING },
    { id: "chat", label: "Live Support", path: "/admin/chat", icon: MessageCircle },
    { id: "invoices", label: "Invoices", path: "/admin/invoices", icon: RefreshCw },
    { id: "import", label: "CSV Import", path: "/admin/import", icon: UploadCloud },
    { id: "homepage", label: "Homepage Editor", path: "/admin/homepage", icon: Images },
  ];

  return (
    <div className="container page-section">
      {/* Admin Subnav Pill Tabs */}
      <nav className="admin-nav-tabs" aria-label="Admin Sections">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = section === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`admin-nav-tab${isActive ? " active" : ""}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && <span className="badge">{tab.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {section !== "chat" && (
        <div className="page-heading">
          <div>
            <div className="eyebrow">Rebel Mart Console</div>
            <h1>
              {({
                dashboard: "Executive Store Dashboard",
                inventory: "Stock & Inventory Control",
                products: "Catalogue & Merch Management",
                orders: "Order Fulfillment Workflow",
                chat: "Customer Support Hub",
                invoices: "Automated Invoice Generation",
                import: "CSV Merch Bulk Upload",
                homepage: "Storefront Homepage Editor"
              })[section] || "Admin Dashboard"}
            </h1>
            <p>
              {({
                dashboard: "Real-time revenue, customer metrics, sales velocity, and AI cost governance.",
                inventory: "Monitor stock quantities, reorder thresholds, and perform instant one-click restocking.",
                products: "Create merchandise, configure cinema presets, generate AI copy, and upload luxury media.",
                orders: "Move orders seamlessly from Confirmed to Processing, Shipped, and Delivered.",
                chat: "Direct real-time communication with fans placing merchandise orders.",
                invoices: "Generate and download branded PDF invoices using asynchronous Celery tasks.",
                import: "Batch upload dozens of Prabhas merchandise products using standard CSV files.",
                homepage: "Customize hero banners, cinema collection campaigns, and promotional announcement copy."
              })[section] || "Manage Rebel Mart official merchandise."}
            </p>
          </div>
          <button className="btn-secondary" onClick={load} title="Refresh dataset">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      )}

      {/* 1. HOMEPAGE EDITOR */}
      {section === "homepage" && <HomepageEditor show={show} />}

      {/* 2. MAIN DASHBOARD OVERVIEW */}
      {section === "dashboard" && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <Package />
              <strong>{products.length}</strong>
              <span>Catalogue Products</span>
            </div>
            <div className="stat-card">
              <ShoppingBag />
              <strong>{orders.length}</strong>
              <span>Total Orders</span>
            </div>
            <div className="stat-card">
              <ImagePlus />
              <strong>{withImages}</strong>
              <span>Products with Images</span>
            </div>
            <div className="stat-card">
              <TrendingUp />
              <strong>{money(revenue)}</strong>
              <span>Gross Order Value</span>
            </div>
          </div>

          <section className="rm-analytics-panel">
            <div className="rm-analytics-heading">
              <div>
                <div className="eyebrow">Store Intelligence</div>
                <h2>Sales Performance & Volume</h2>
                <p className="muted">Live transaction summary and ranked best-selling Rebel Star merchandise.</p>
              </div>
              <TrendingUp size={22} color="var(--accent)" />
            </div>
            {analyticsError && <p className="muted">Analytics currently unavailable: {analyticsError}</p>}
            {analytics && (
              <>
                <div className="rm-analytics-metrics">
                  <div>
                    <span>Delivered Orders</span>
                    <strong>{analytics.delivered_orders}</strong>
                  </div>
                  <div>
                    <span>Average Order Value</span>
                    <strong>{money(analytics.average_order_value)}</strong>
                  </div>
                  <div>
                    <span>Net Order Revenue</span>
                    <strong>{money(analytics.revenue)}</strong>
                  </div>
                </div>
                <div className="rm-top-products">
                  <h3>Top-Selling Prabhas Merchandise</h3>
                  {analytics.top_products?.length ? (
                    analytics.top_products.map((item, index) => (
                      <div className="rm-top-product-row" key={item.name}>
                        <span className="rm-top-rank">{index + 1}</span>
                        <strong style={{ flex: 1 }}>{item.name}</strong>
                        <span>{item.units_sold} units sold</span>
                      </div>
                    ))
                  ) : (
                    <p className="muted">Sales rankings will appear automatically as customer orders are delivered.</p>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="rm-analytics-panel">
            <div className="rm-analytics-heading">
              <div>
                <div className="eyebrow">Responsible AI & Cost Control</div>
                <h2>AI Assistant Usage & Governance</h2>
                <p className="muted">Monitor token budgets, cache hit ratios, and adjust runtime external API limits safely.</p>
              </div>
              <Sparkles size={22} color="var(--accent)" />
            </div>
            {aiUsageError && <p className="muted">Usage metrics unavailable: {aiUsageError}</p>}
            {aiUsage && (
              <>
                <div className="rm-analytics-metrics">
                  <div>
                    <span>AI Requests Today</span>
                    <strong>{aiUsage.requests_today ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Cache Hits Today</span>
                    <strong>{aiUsage.cache_hits_today ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Estimated Monthly Spend</span>
                    <strong>${Number(aiUsage.estimated_monthly_spend_usd ?? 0).toFixed(2)}</strong>
                  </div>
                </div>
                <p className="muted">
                  External providers: {aiUsage.external_calls_enabled ? "enabled with strict budget limits" : "disabled — $0 API-spend default"}. Global daily calls: {aiUsage.external_calls_today ?? 0}/{aiUsage.external_calls_daily_limit ?? 0}.
                </p>
                <div className="admin-ai-provider-usage">
                  <h3>Provider Usage Today (UTC)</h3>
                  {Object.entries(aiUsage.providers || {}).map(([provider, metrics]) => (
                    <div className="admin-ai-provider-row" key={provider}>
                      <strong>{provider.toUpperCase()}</strong>
                      <span>{metrics.calls_today} / {metrics.daily_limit} calls</span>
                      <progress value={metrics.calls_today} max={Math.max(1, metrics.daily_limit)} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <form className="admin-ai-policy-form" onSubmit={saveAiPolicy}>
              <h3>Configure Runtime AI Limits</h3>
              <p className="muted" style={{ marginBottom: 16 }}>Changes apply instantly via Redis without restarting the backend service.</p>
              <label className="admin-ai-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(aiPolicy.external_calls_enabled)}
                  onChange={e => updateAiPolicyField("external_calls_enabled", e.target.checked)}
                />
                <span>Enable External LLM Provider APIs</span>
              </label>
              <div className="admin-homepage-fields" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", display: "grid" }}>
                <label className="admin-homepage-field">
                  <span>Requests per user per day</span>
                  <input type="number" min="1" max="10000" required value={aiPolicy.daily_requests_per_user} onChange={e => updateAiPolicyField("daily_requests_per_user", e.target.value)} />
                </label>
                <label className="admin-homepage-field">
                  <span>Calls per provider per day</span>
                  <input type="number" min="1" max="10000" required value={aiPolicy.daily_calls_per_provider} onChange={e => updateAiPolicyField("daily_calls_per_provider", e.target.value)} />
                </label>
                <label className="admin-homepage-field">
                  <span>Global external calls daily limit</span>
                  <input type="number" min="0" max="100000" required value={aiPolicy.daily_external_calls_limit} onChange={e => updateAiPolicyField("daily_external_calls_limit", e.target.value)} />
                </label>
                <label className="admin-homepage-field">
                  <span>Monthly budget limit (USD)</span>
                  <input type="number" min="0" max="100000" step="0.01" required value={aiPolicy.monthly_budget_usd} onChange={e => updateAiPolicyField("monthly_budget_usd", e.target.value)} />
                </label>
              </div>
              <button className="btn-primary" type="submit" disabled={aiPolicySaving} style={{ marginTop: 18 }}>
                {aiPolicySaving ? "Saving Limits…" : "Save AI Governance Limits"}
              </button>
            </form>
          </section>
        </>
      )}

      {/* 3. INVOICES & BULK IMPORT (BACKGROUND JOBS) */}
      {section === "invoices" && <div className="admin-section-route"><BackgroundJobsPanel orders={orders} mode="invoices" /></div>}
      {section === "import" && <div className="admin-section-route"><BackgroundJobsPanel orders={orders} mode="import" /></div>}

      {/* 4. INVENTORY CONTROL */}
      {section === "inventory" && (
        <section className="inventory-section">
          <div className="inventory-head">
            <div>
              <div className="eyebrow">Inventory Overview</div>
              <h2>Stock Levels & Restocking</h2>
              <p className="muted">Monitor units across all film collections and execute quick restocks.</p>
            </div>
            <div className="inventory-threshold">
              Low stock alert: <strong>≤ {LOW_STOCK_THRESHOLD} units</strong>
            </div>
          </div>

          <div className="inventory-metrics">
            <div className="inventory-metric">
              <div className="inventory-metric-icon">
                <Package size={22} color="var(--accent)" />
              </div>
              <div className="inventory-metric-data">
                <strong>{totalUnits.toLocaleString()}</strong>
                <span>Total Units in Stock</span>
              </div>
            </div>
            <div className="inventory-metric low">
              <div className="inventory-metric-icon">
                <AlertCircle size={22} color="#fbbf24" />
              </div>
              <div className="inventory-metric-data">
                <strong>{lowStock}</strong>
                <span>Low Stock Items</span>
              </div>
            </div>
            <div className="inventory-metric danger">
              <div className="inventory-metric-icon">
                <X size={22} color="#f87171" />
              </div>
              <div className="inventory-metric-data">
                <strong>{outOfStock}</strong>
                <span>Out of Stock</span>
              </div>
            </div>
            <div className="inventory-metric value">
              <div className="inventory-metric-icon">
                <TrendingUp size={22} color="#34d399" />
              </div>
              <div className="inventory-metric-data">
                <strong>{stockValueLabel}</strong>
                <span>Total Asset Value</span>
              </div>
            </div>
          </div>

          {/* Inventory Filters & Search Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div className="admin-filter-tabs" style={{ marginBottom: 0 }}>
              {[
                { id: "ALL", label: "All Items", count: inventory.length },
                { id: "LOW", label: "Low Stock", count: lowStock },
                { id: "OUT", label: "Out of Stock", count: outOfStock },
                { id: "HEALTHY", label: "Healthy Stock", count: inventory.length - lowStock - outOfStock },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-filter-tab${inventoryFilter === tab.id ? " active" : ""}`}
                  onClick={() => setInventoryFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="badge">{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="header-search" style={{ maxWidth: 300, height: 40 }}>
              <Search size={15} />
              <input
                placeholder="Search stock by name/id…"
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="inventory-table-card card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="inventory-table">
              <div className="inventory-row inventory-header">
                <span>Product & Film</span>
                <span>In Stock</span>
                <span>Status</span>
                <span>Quick Restock Stepper</span>
                <span style={{ textAlign: "right" }}>Action</span>
              </div>

              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div className="inventory-row inventory-skeleton" key={i} />)
              ) : filteredInventory.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
                  <Package size={36} color="var(--accent)" style={{ margin: "0 auto 12px" }} />
                  <strong style={{ display: "block", fontSize: 16, color: "var(--text-heading)", marginBottom: 4 }}>No inventory matches this filter</strong>
                  <span>Try selecting another stock status tab or clearing your search term.</span>
                </div>
              ) : (
                filteredInventory.map(p => {
                  const stock = Number(p.stock || 0);
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                  return (
                    <div className={`inventory-row ${isOut ? "is-out" : ""} ${isLow ? "is-low" : ""}`} key={p.id}>
                      <div className="inventory-product">
                        <div className="inventory-thumb">
                          {p.image_url ? (
                            <img src={imageUrl(p.image_url)} alt="" width="96" height="96" loading="lazy" />
                          ) : (
                            <span>{p.name?.[0] || "R"}</span>
                          )}
                        </div>
                        <div>
                          <strong className="inventory-product-title">{p.name}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            {p.movie_name ? <span className="admin-chip film" style={{ fontSize: 11, padding: "1px 6px" }}>🎬 {p.movie_name}</span> : null}
                            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                              RM-{String(displayProductNumbers.get(Number(p.id)) ?? p.id).padStart(3, "0")} · {money(p.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stock-number">
                        <strong style={{ fontSize: 16, color: "var(--text-heading)" }}>{stock}</strong>
                        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>units</span>
                      </div>

                      <div>
                        <span className={`inventory-status ${isOut ? "out" : isLow ? "low" : "healthy"}`}>
                          {isOut ? "Out of stock" : isLow ? "Low stock" : "Healthy"}
                        </span>
                      </div>

                      <div className="restock-control">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="1"
                          value={getDraft(p)}
                          onChange={e => setDraft(p.id, e.target.value)}
                          aria-label={`Stock for ${p.name}`}
                          style={{ width: 72, height: 36, textAlign: "center", fontWeight: 700 }}
                        />
                        <div className="quick-restock">
                          <button type="button" onClick={() => quickRestock(p, 10)}>+10</button>
                          <button type="button" onClick={() => quickRestock(p, 25)}>+25</button>
                          <button type="button" onClick={() => quickRestock(p, 50)}>+50</button>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          className="btn-primary tiny"
                          disabled={Boolean(stockBusy[p.id])}
                          onClick={() => saveStock(p, getDraft(p))}
                        >
                          <Check size={12} style={{ display: "inline", marginRight: 4 }} />
                          {stockBusy[p.id] ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. PRODUCT & CATALOGUE MANAGEMENT */}
      {section === "products" && (
        <section className="admin-catalog-management">
          {/* Header with Title and Add Button */}
          <div className="admin-catalog-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2>Merchandise & Catalog Control</h2>
                <span className="admin-catalog-counter">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                </span>
              </div>
              <p className="muted">
                Manage Prabhas official merchandise, live pricing, universe tags, and product imagery.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary admin-add-product-btn"
              onClick={openNewProductModal}
            >
              <Plus size={18} />
              <span>Add New Merchandise</span>
            </button>
          </div>

          {/* Filter, Search & View Mode Toolbar */}
          <div className="admin-catalog-toolbar">
            <div className="admin-catalog-search-wrap">
              <Search size={16} />
              <input
                className="input admin-catalog-search"
                placeholder="Search products by title, universe, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-catalog-filters">
              {/* Movie Universe Filter Dropdown */}
              <select
                className="input admin-select-filter"
                value={catalogMovieFilter}
                onChange={e => setCatalogMovieFilter(e.target.value)}
              >
                <option value="">🎬 All Film Universes</option>
                {MOVIE_PRESETS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Category Filter Dropdown */}
              <select
                className="input admin-select-filter"
                value={catalogCategoryFilter}
                onChange={e => setCatalogCategoryFilter(e.target.value)}
              >
                <option value="">🏷️ All Categories</option>
                {CATEGORY_PRESETS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Grid / Table View Switcher */}
              <div className="admin-view-toggle">
                <button
                  type="button"
                  className={`admin-view-btn${productViewMode === "grid" ? " active" : ""}`}
                  onClick={() => setProductViewMode("grid")}
                  title="Grid View"
                >
                  <LayoutGrid size={17} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  className={`admin-view-btn${productViewMode === "table" ? " active" : ""}`}
                  onClick={() => setProductViewMode("table")}
                  title="Table View"
                >
                  <List size={17} />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Products Content: Grid or Table */}
          {loading ? (
            <div className="admin-product-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="skeleton-card" key={i} style={{ height: 380, borderRadius: 12 }} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card admin-empty-state" style={{ padding: 56, textAlign: "center" }}>
              <Package size={40} color="var(--accent)" style={{ margin: "0 auto 14px" }} />
              <h3>No merchandise matches your criteria</h3>
              <p className="muted">Try adjusting your search terms or clearing film/category filters.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={() => { setSearch(""); setCatalogMovieFilter(""); setCatalogCategoryFilter(""); }}
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  className="btn-primary small"
                  onClick={openNewProductModal}
                >
                  <Plus size={14} /> Add First Product
                </button>
              </div>
            </div>
          ) : productViewMode === "grid" ? (
            /* HIGH-END ADMIN PRODUCT GRID */
            <div className="admin-product-grid">
              {filteredProducts.map(p => {
                const stock = Number(p.stock || 0);
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                const sku = `RM-${String(displayProductNumbers.get(Number(p.id)) ?? p.id).padStart(3, "0")}`;

                return (
                  <article className="admin-product-card card" key={p.id}>
                    {/* Media Container */}
                    <div className="admin-product-media-wrap">
                      {p.image_url ? (
                        <img
                          src={imageUrl(p.image_url)}
                          alt={p.name}
                          className="admin-product-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-product-no-img">
                          <Package size={32} opacity={0.4} />
                          <span>No Image</span>
                        </div>
                      )}

                      {/* Floating Badges */}
                      <span className="admin-product-sku-tag">{sku}</span>
                      <span className={`admin-product-stock-tag ${isOut ? "out" : isLow ? "low" : "healthy"}`}>
                        {isOut ? "Out of Stock" : isLow ? `Low (${stock})` : `${stock} in Stock`}
                      </span>

                      {/* Storefront Link Pill */}
                      <Link
                        to={`/product/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-product-live-badge"
                        title="View on Storefront"
                      >
                        <ArrowUpRight size={13} />
                        <span>Live View</span>
                      </Link>
                    </div>

                    {/* Content Section */}
                    <div className="admin-product-info">
                      <div className="admin-product-tags-row">
                        {p.movie_name && (
                          <span className="admin-chip film" title={p.movie_name}>
                            🎬 {p.movie_name}
                          </span>
                        )}
                        {p.category && (
                          <span className="admin-chip category">
                            {p.category}
                          </span>
                        )}
                      </div>

                      <h3 className="admin-product-title" title={p.name}>
                        {p.name}
                      </h3>

                      <div className="admin-product-meta-row">
                        <div className="admin-product-price-block">
                          <span className="admin-product-price-label">Price</span>
                          <strong className="admin-product-price">{money(p.price)}</strong>
                        </div>
                        <div className="admin-product-stock-block">
                          <span className="admin-product-stock-label">Inventory</span>
                          <span className="admin-product-stock-value">{stock} units</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="admin-product-action-row">
                      <button
                        type="button"
                        className="admin-card-btn edit"
                        onClick={() => startEdit(p)}
                        title="Edit product details"
                      >
                        <Pencil size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="admin-card-btn photo"
                        onClick={() => openImage(p)}
                        title="Update product photo"
                      >
                        <UploadCloud size={14} />
                        <span>Photo</span>
                      </button>
                      <button
                        type="button"
                        className="admin-card-btn delete"
                        onClick={() => removeProduct(p)}
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* EXECUTIVE DATA TABLE VIEW */
            <div className="admin-product-table-card card">
              <div className="admin-product-table">
                <div className="admin-table-row admin-table-header">
                  <span className="cell-product">Product & SKU</span>
                  <span className="cell-movie">Movie Universe</span>
                  <span className="cell-category">Category</span>
                  <span className="cell-price">Price</span>
                  <span className="cell-stock">In Stock</span>
                  <span className="cell-status">Status</span>
                  <span className="cell-actions" style={{ textAlign: "right" }}>Actions</span>
                </div>

                {filteredProducts.map(p => {
                  const stock = Number(p.stock || 0);
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                  const sku = `RM-${String(displayProductNumbers.get(Number(p.id)) ?? p.id).padStart(3, "0")}`;

                  return (
                    <div className="admin-table-row" key={p.id}>
                      <div className="cell-product admin-table-product-cell">
                        <div className="admin-table-thumb">
                          {p.image_url ? (
                            <img src={imageUrl(p.image_url)} alt="" loading="lazy" />
                          ) : (
                            <span>{p.name?.[0] || "R"}</span>
                          )}
                        </div>
                        <div className="admin-table-product-details">
                          <strong className="admin-table-product-title">{p.name}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span className="admin-table-sku">{sku}</span>
                            <Link to={`/product/${p.id}`} target="_blank" rel="noreferrer" className="admin-table-view-link">
                              Live <ArrowUpRight size={11} />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="cell-movie">
                        {p.movie_name ? (
                          <span className="admin-chip film">🎬 {p.movie_name}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </div>

                      <div className="cell-category">
                        {p.category ? (
                          <span className="admin-chip category">{p.category}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </div>

                      <div className="cell-price">
                        <strong style={{ color: "var(--accent)" }}>{money(p.price)}</strong>
                      </div>

                      <div className="cell-stock">
                        <strong>{stock}</strong> <span style={{ fontSize: 12, color: "var(--muted)" }}>units</span>
                      </div>

                      <div className="cell-status">
                        <span className={`inventory-status ${isOut ? "out" : isLow ? "low" : "healthy"}`}>
                          {isOut ? "Out of stock" : isLow ? "Low stock" : "Healthy"}
                        </span>
                      </div>

                      <div className="cell-actions" style={{ textAlign: "right" }}>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-mini-btn edit"
                            onClick={() => startEdit(p)}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="admin-mini-btn photo"
                            onClick={() => openImage(p)}
                            title="Photo"
                          >
                            <UploadCloud size={13} />
                          </button>
                          <button
                            type="button"
                            className="admin-mini-btn delete"
                            onClick={() => removeProduct(p)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD / EDIT PRODUCT MODAL DIALOG */}
          {showProductModal && (
            <div className="modal-backdrop" onClick={resetForm}>
              <div
                className="modal-dialog admin-product-modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="admin-modal-header">
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 750, color: "var(--text-heading)", margin: 0 }}>
                      {editing ? `Edit Merchandise #${editing.id}` : "Create New Merchandise"}
                    </h2>
                    <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                      {editing
                        ? `Updating catalogue item “${editing.name}”`
                        : "Configure new official Prabhas fan collection item with AI descriptions and media."}
                    </p>
                  </div>
                  <button type="button" className="icon-btn" onClick={resetForm} title="Close dialog">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={submit} className="admin-product-modal-body">
                  <div className="admin-modal-grid">
                    {/* LEFT COLUMN: Metadata & Presets */}
                    <div className="admin-modal-col form-stack">
                      <label>
                        <span style={{ fontWeight: 600 }}>Product Name *</span>
                        <input
                          className="input"
                          required
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Salaar Deva Titanium Oversized T-Shirt"
                        />
                      </label>

                      {/* Movie Universe Presets */}
                      <div className="admin-presets-wrap">
                        <span className="admin-presets-label">🎬 Prabhas Movie Universe Preset:</span>
                        <div className="admin-presets-list">
                          {MOVIE_PRESETS.map((movie) => (
                            <button
                              key={movie}
                              type="button"
                              className={`admin-preset-btn${form.movie_name === movie ? " active" : ""}`}
                              onClick={() => setForm({ ...form, movie_name: movie, actor_name: "Prabhas" })}
                            >
                              {movie}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Presets */}
                      <div className="admin-presets-wrap">
                        <span className="admin-presets-label">🏷️ Merchandise Category Preset:</span>
                        <div className="admin-presets-list">
                          {CATEGORY_PRESETS.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              className={`admin-preset-btn${form.category === cat ? " active" : ""}`}
                              onClick={() => setForm({ ...form, category: cat })}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-grid">
                        <label>
                          <span>Movie Universe</span>
                          <input
                            className="input"
                            value={form.movie_name}
                            onChange={e => setForm({ ...form, movie_name: e.target.value })}
                            placeholder="e.g. Salaar: Part 1 – Ceasefire"
                            maxLength={150}
                          />
                        </label>
                        <label>
                          <span>Category</span>
                          <input
                            className="input"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            placeholder="e.g. T-Shirts"
                            maxLength={100}
                          />
                        </label>
                      </div>

                      <div className="form-grid">
                        <label>
                          <span>Price (₹) *</span>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            placeholder="999"
                          />
                        </label>
                        <label>
                          <span>Stock Quantity *</span>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={form.stock}
                            onChange={e => setForm({ ...form, stock: e.target.value })}
                            placeholder="50"
                          />
                        </label>
                      </div>

                      <div className="form-grid">
                        <label>
                          <span>Actor / Star</span>
                          <input
                            className="input"
                            value={form.actor_name}
                            onChange={e => setForm({ ...form, actor_name: e.target.value })}
                            placeholder="Prabhas"
                            maxLength={150}
                          />
                        </label>
                        <label>
                          <span>Tags (comma-separated)</span>
                          <input
                            className="input"
                            value={form.tags}
                            onChange={e => setForm({ ...form, tags: e.target.value })}
                            placeholder="prabhas, rebel star, tee"
                            maxLength={1000}
                          />
                        </label>
                      </div>

                      {/* Tag Quick Chips */}
                      <div className="admin-presets-wrap" style={{ marginTop: -4 }}>
                        <span className="admin-presets-label">Suggested Tags:</span>
                        <div className="admin-presets-list">
                          {TAG_SUGGESTIONS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className="admin-preset-btn"
                              onClick={() => {
                                const existing = form.tags ? form.tags.split(",").map(t => t.trim()) : [];
                                if (!existing.includes(tag)) {
                                  setForm({ ...form, tags: [...existing, tag].filter(Boolean).join(", ") });
                                }
                              }}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Description, AI & Media */}
                    <div className="admin-modal-col form-stack">
                      <label>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>Product Description</span>
                          <button
                            type="button"
                            className="btn-secondary tiny"
                            onClick={generateDescription}
                            disabled={busy || !editing}
                            title={editing ? "Generate description using AI" : "Save product first to generate AI copy"}
                          >
                            <Sparkles size={13} />
                            <span>{editing ? "AI Generate" : "Save first for AI"}</span>
                          </button>
                        </div>
                        <textarea
                          className="input textarea"
                          rows={6}
                          value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          placeholder="Describe fabric weight, cinema iconography, styling notes, and official merchandise details…"
                        />
                      </label>

                      {/* Product Media Dropzone */}
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-heading)", display: "block", marginBottom: 6 }}>
                          Product Imagery
                        </span>
                        <div
                          className="image-picker admin-modal-image-picker"
                          onClick={() => fileRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            chooseImage(e.dataTransfer.files?.[0]);
                          }}
                        >
                          <input
                            ref={fileRef}
                            hidden
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => chooseImage(e.target.files?.[0])}
                          />
                          {imagePreview ? (
                            <>
                              <img src={imagePreview} alt="Preview" />
                              <div className="image-picker-overlay">
                                <Eye size={17} /> Change Image
                              </div>
                            </>
                          ) : (
                            <div className="upload-empty">
                              <UploadCloud size={30} color="var(--accent)" />
                              <strong>Upload Product Image</strong>
                              <span>Drag & drop or click · JPG, PNG, WEBP · up to 5 MB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {upload > 0 && (
                        <div className="upload-progress">
                          <span style={{ width: `${upload}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="admin-modal-footer">
                    <button type="button" className="btn-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                    <button disabled={busy} className="btn-primary" style={{ minWidth: 160 }}>
                      {busy ? "Saving…" : editing ? "Save Product Changes" : "Create Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. ORDER FULFILLMENT MANAGEMENT */}
      {section === "orders" && (
        <section className="admin-orders">
          {/* Order Metrics Bar */}
          <div className="admin-order-stats-grid">
            <div className="admin-order-stat-card">
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="admin-order-stat-card">
              <span>Action Needed (Confirmed)</span>
              <strong style={{ color: "var(--accent)" }}>{orderCounts.CONFIRMED}</strong>
            </div>
            <div className="admin-order-stat-card">
              <span>In Processing</span>
              <strong style={{ color: "#38bdf8" }}>{orderCounts.PROCESSING}</strong>
            </div>
            <div className="admin-order-stat-card">
              <span>Dispatched / Shipped</span>
              <strong style={{ color: "#a855f7" }}>{orderCounts.SHIPPED}</strong>
            </div>
            <div className="admin-order-stat-card">
              <span>Delivered</span>
              <strong style={{ color: "#34d399" }}>{orderCounts.DELIVERED}</strong>
            </div>
            <div className="admin-order-stat-card">
              <span>Cancelled</span>
              <strong style={{ color: "#f87171" }}>{orderCounts.CANCELLED || 0}</strong>
            </div>
          </div>

          {/* Order Status Filter Tabs & Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
            <div className="admin-filter-tabs" style={{ marginBottom: 0 }}>
              {[
                { id: "ALL", label: "All Orders", count: orderCounts.ALL },
                { id: "CONFIRMED", label: "Confirmed", count: orderCounts.CONFIRMED },
                { id: "PROCESSING", label: "Processing", count: orderCounts.PROCESSING },
                { id: "SHIPPED", label: "Shipped", count: orderCounts.SHIPPED },
                { id: "DELIVERED", label: "Delivered", count: orderCounts.DELIVERED },
                { id: "CANCELLED", label: "Cancelled", count: orderCounts.CANCELLED || 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-filter-tab${orderStatusFilter === tab.id ? " active" : ""}`}
                  onClick={() => setOrderStatusFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="badge">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="header-search" style={{ maxWidth: 320, height: 40 }}>
              <Search size={16} />
              <input
                placeholder="Search order #, customer, phone…"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredOrders.length ? (
            <div>
              {filteredOrders.map(o => (
                <article className="admin-order-card" key={o.id}>
                  {/* Order Header */}
                  <div className="admin-order-head">
                    <div className="admin-order-id-group">
                      <span className="admin-order-id">Order #{o.id}</span>
                      <span className="admin-order-date">
                        <Clock size={13} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
                        {o.created_at ? new Date(o.created_at).toLocaleString() : "Recently placed"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className={`status ${statusClasses[o.status] || ""}`}>
                        {statusLabel(o.status)}
                      </span>
                      <button
                        className="btn-secondary tiny"
                        onClick={() => {
                          setChatCustomer({ id: o.user_id, name: o.customer_name || "Customer" });
                          navigate(`/admin/chat?customerId=${o.user_id}&customerName=${encodeURIComponent(o.customer_name || "Customer")}`);
                        }}
                      >
                        <MessageCircle size={13} /> Chat with Customer
                      </button>
                    </div>
                  </div>

                  {/* Customer and Shipping Details Grid */}
                  <div className="admin-order-meta-grid">
                    <div className="admin-order-customer-box">
                      <div className="admin-order-box-title">
                        <User size={13} color="var(--accent)" /> Customer Profile
                      </div>
                      <strong style={{ display: "block", fontSize: 14, color: "var(--text-heading)", marginBottom: 4 }}>
                        {o.customer_name || "Customer details not provided"}
                      </strong>
                      <div style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Phone size={13} />
                        {o.phone ? (
                          <a href={`tel:${o.phone}`} style={{ color: "var(--accent)" }}>{o.phone}</a>
                        ) : "No phone number"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        User ID: #{o.user_id || "Guest"}
                      </div>
                    </div>

                    <div className="admin-order-shipping-box">
                      <div className="admin-order-box-title">
                        <MapPin size={13} color="var(--accent)" /> Shipping Address & Delivery Note
                      </div>
                      <div style={{ color: "var(--text-heading)", lineHeight: 1.4, marginBottom: 4 }}>
                        {[o.address, o.city, o.state, o.pincode].filter(Boolean).join(", ") || "No address provided"}
                      </div>
                      {o.delivery_instructions && (
                        <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>
                          <b>Instructions:</b> {o.delivery_instructions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="admin-order-items-wrap">
                    <div className="admin-order-items-head">
                      <span>Purchased Items ({(o.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0)})</span>
                      <span>Subtotal</span>
                    </div>

                    {(o.items || []).length ? (
                      (o.items || []).map((item) => (
                        <div className="admin-order-item-line" key={item.id || `${o.id}-${item.product_id}`}>
                          <div className="admin-order-item-preview">
                            <div className="admin-order-item-thumb">
                              {item.image_url ? (
                                <img src={imageUrl(item.image_url)} alt="" loading="lazy" />
                              ) : (
                                <Package size={16} />
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: 13.5, color: "var(--text-heading)", display: "block" }}>
                                {item.product_name || `Product #${item.product_id}`}
                              </strong>
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                                Product #{item.product_id} · Qty {item.quantity}
                                {item.size ? <span className="cart-item-size" style={{ marginLeft: 6 }}>Size: {item.size}</span> : null}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>
                              {money(item.unit_price)} each
                            </span>
                            <strong style={{ fontSize: 14, color: "var(--text-heading)" }}>
                              {money(item.subtotal)}
                            </strong>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 14, color: "var(--muted)", fontSize: 13 }}>
                        Item details unavailable for this order.
                      </div>
                    )}
                  </div>

                  {/* Order Card Footer & Status Workflow Buttons */}
                  <div className="admin-order-footer">
                    <div className="admin-order-total-block">
                      <span>Order Total:</span>
                      <strong>{money(o.total_amount)}</strong>
                      {o.payment_method && (
                        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>
                          via {o.payment_method === "COD" ? "Cash on Delivery" : "Simulated Online (Demo)"}
                        </span>
                      )}
                    </div>

                    <div className="admin-order-action-pills">
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", marginRight: 4 }}>
                        Update Status:
                      </span>
                      {statuses.map(s => {
                        const isCurrent = o.status === s;
                        return (
                          <button
                            key={s}
                            disabled={isCurrent}
                            className={`btn-secondary tiny${isCurrent ? " active" : ""}`}
                            style={isCurrent ? { background: "var(--accent)", color: "#09090c", borderColor: "var(--accent)", fontWeight: 800 } : {}}
                            onClick={() => updateOrder(o, s)}
                          >
                            {isCurrent && <Check size={12} style={{ marginRight: 4, display: "inline" }} />}
                            {statusLabel(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card empty-inline" style={{ padding: 48, textAlign: "center" }}>
              <Package size={36} color="var(--accent)" style={{ margin: "0 auto 12px" }} />
              <h3>No orders match your criteria</h3>
              <p className="muted">Try selecting another status tab or clear the search field.</p>
            </div>
          )}
        </section>
      )}

      {/* 7. CUSTOMER LIVE CHAT */}
      {section === "chat" && (
        <div className="admin-section-route">
          <AdminLiveChat
            customerId={selectedChatId}
            customerName={selectedChatName}
            customers={(() => {
              const map = new Map();
              apiCustomers.forEach((c) => {
                map.set(Number(c.id), { id: Number(c.id), name: c.name || `Customer #${c.id}`, lastOrderId: c.lastOrderId || null });
              });
              orders.filter((order) => order.user_id).forEach((order) => {
                const id = Number(order.user_id);
                const existing = map.get(id);
                map.set(id, {
                  id,
                  name: order.customer_name || existing?.name || `Customer #${id}`,
                  lastOrderId: order.id,
                });
              });
              return Array.from(map.values());
            })()}
          />
        </div>
      )}

      {/* 8. PRODUCT IMAGE MODAL */}
      {section === "products" && imageTarget && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">Product Media</div>
                <h2>Change Product Image</h2>
                <p>{imageTarget.name}</p>
              </div>
              <button className="icon-btn" onClick={() => { setImageTarget(null); setImagePreview(""); }}>
                <X size={18} />
              </button>
            </div>

            <div className="image-picker large-picker" onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <div className="upload-empty">
                  <ImagePlus size={32} color="var(--accent)" />
                  <strong>Select replacement image</strong>
                  <span>JPG, PNG or WEBP under 5 MB</span>
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setImageTarget(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!imageFile || busy} onClick={uploadOnly}>
                {busy ? "Uploading…" : "Upload New Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
