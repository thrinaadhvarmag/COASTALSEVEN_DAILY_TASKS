import { useEffect, useLayoutEffect, useState } from "react";
import {
  ArrowLeft, Heart, Minus, Plus, ShoppingCart, Truck, ShieldCheck, BadgePercent,
  RotateCcw, PackageCheck, Zap, BadgeCheck, Tag, ChevronRight, Star, MessageSquare,
  Share2, Ruler, Sparkles, Check
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { imageUrl, money, getErrorMessage } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import { useProduct } from "../hooks/useProducts";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { BIRTHDAY_SALE_PERCENT, salePrice } from "../lib/pricing";
import SizeGuideModal from "../components/SizeGuideModal";
import PincodeChecker from "../components/PincodeChecker";
import { MOCK_PRABHAS_PRODUCTS } from "../lib/mockProducts";

const WISH_KEY = "rebel_mart_wishlist";
function readWishlist() {
  try {
    const value = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
    return Array.isArray(value) ? value.map(Number) : [];
  } catch { return []; }
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: remoteProduct, isLoading, error } = useProduct(id);
  const fallbackProduct = MOCK_PRABHAS_PRODUCTS.find((p) => p.id === Number(id)) || MOCK_PRABHAS_PRODUCTS[0];
  const product = remoteProduct || fallbackProduct;
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rebel_mart_item_sizes") || "{}")[String(id)] || "L"; } catch { return "L"; }
  });
  const [similarProducts, setSimilarProducts] = useState([]);
  const [wish, setWish] = useState(() => readWishlist().includes(Number(id)));
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ total: 0, average_rating: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { add, loading, items: cartItems } = useCart();
  const { show } = useToast();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    setQty(1);
    setWish(readWishlist().includes(Number(id)));
    try { setSelectedSize(JSON.parse(localStorage.getItem("rebel_mart_item_sizes") || "{}")[String(id)] || "L"); } catch { setSelectedSize("L"); }
  }, [id]);

  useEffect(() => {
    let active = true;
    api.get(`/products/${id}/reviews`).then(({ data }) => {
      if (active) { setReviews(data.items || []); setReviewSummary({ total: data.total || 0, average_rating: data.average_rating || 0 }); }
    }).catch(() => { if (active) { setReviews([]); setReviewSummary({ total: 0, average_rating: 0 }); } });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    const loadSimilar = async () => {
      try {
        const params = { page: 1, page_size: 50 };
        if (product.category) params.search = product.category;
        let { data } = await api.get("/products", { params });
        const list = Array.isArray(data) ? data : (data.items || []);
        const candidates = list
          .filter((item) => Number(item.id) !== Number(product.id))
          .slice(0, 4);
        if (active) setSimilarProducts(candidates);
      } catch { if (active) setSimilarProducts([]); }
    };
    loadSimilar();
    return () => { active = false; };
  }, [product, id]);

  const toggleWishlist = () => {
    const list = readWishlist();
    const next = list.includes(Number(id)) ? list.filter((itemId) => itemId !== Number(id)) : [...list, Number(id)];
    localStorage.setItem(WISH_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("rebel-wishlist-updated"));
    setWish(next.includes(Number(id)));
    show(next.includes(Number(id)) ? "Saved to wishlist" : "Removed from wishlist", "info");
  };

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      show("Product link copied! Share it with fellow fans.", "success");
    } catch {
      show("Could not copy link", "error");
    }
  };

  const cartQuantity = cartItems.find((item) => Number(item.product_id) === Number(product?.id))?.quantity || 0;
  const remainingStock = Math.max(0, Number(product?.stock || 0) - cartQuantity);

  const addItem = async (goToCheckout = false) => {
    if (isClothing && !selectedSize) { show("Please select a size first", "error"); return; }
    if (!localStorage.getItem("rebel_mart_token")) {
      show("Please sign in to add products to your cart", "error");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (cartQuantity + qty > Number(product.stock || 0)) {
      show(`Only ${Math.max(0, Number(product.stock || 0) - cartQuantity)} more can be added to your cart`, "error");
      return;
    }
    try {
      if (isClothing) {
        const savedSizes = JSON.parse(localStorage.getItem("rebel_mart_item_sizes") || "{}");
        savedSizes[String(product.id)] = selectedSize;
        localStorage.setItem("rebel_mart_item_sizes", JSON.stringify(savedSizes));
      }
      await add(Number(product.id), Number(qty));
      show(`${product.name}${isClothing ? ` (${selectedSize})` : ""} added to cart`, "success");
      if (goToCheckout) navigate("/checkout");
    } catch (e) { show(getErrorMessage(e), "error"); }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem("rebel_mart_token")) {
      show("Please sign in to leave a review", "error");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    setReviewBusy(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, title: reviewTitle, comment: reviewComment });
      const { data } = await api.get(`/products/${id}/reviews`);
      setReviews(data.items || []);
      setReviewSummary({ total: data.total || 0, average_rating: data.average_rating || 0 });
      setReviewTitle(""); setReviewComment(""); setReviewRating(5);
      show("Thanks for your review, Rebel!", "success");
    } catch (e) { show(getErrorMessage(e), "error"); }
    finally { setReviewBusy(false); }
  };

  if (isLoading && !remoteProduct && !fallbackProduct) return <div className="container page-section"><div className="skeleton-card" style={{ height: "550px" }} /></div>;
  if (error && !product) return <div className="container page-section"><div className="alert error">{getErrorMessage(error)}</div></div>;
  if (!product) return null;

  const stock = Math.max(0, Number(product.stock || 0));
  const max = Math.max(1, remainingStock);
  const unavailable = stock <= 0 || remainingStock <= 0;
  const productImage = imageUrl(product.image_url || "/categories/tshirts.webp");
  const isClothing = /t[ -]?shirts?|shirts?|hoodies?|sweatshirts?|apparel/i.test(`${product.name || ""} ${product.category || ""}`);
  const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <div className="container page-section rm-product-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="rm-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/products"><ArrowLeft size={15} /> All merchandise</Link>
        <ChevronRight size={14} />
        <Link to={`/products?search=${encodeURIComponent(product.category || "")}`}>{product.category || "Collectibles"}</Link>
        <ChevronRight size={14} />
        {product.movie_name && (
          <>
            <Link to={`/products?search=${encodeURIComponent(product.movie_name)}`}>🎬 {product.movie_name}</Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="rm-breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Detail Grid */}
      <div className="rm-detail-layout">
        {/* Left: Gallery Column */}
        <section className="rm-gallery" aria-label="Product image gallery">
          <div className="rm-gallery-main">
            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                width="1000"
                height="1000"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--faint)", fontFamily: "var(--font-display)", fontSize: "42px" }}>
                REBEL MART
              </div>
            )}
            <span className="rm-gallery-brand">OFFICIAL PRABHAS MERCH</span>
            <button
              type="button"
              className={`rm-gallery-wishlist ${wish ? "is-saved" : ""}`}
              onClick={toggleWishlist}
              aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
              title={wish ? "Saved" : "Save to wishlist"}
            >
              <Heart size={20} fill={wish ? "currentColor" : "none"} color={wish ? "#f43f5e" : "#ffffff"} />
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px" }}>
            <span className="rm-gallery-caption">
              <PackageCheck size={16} color="var(--accent)" /> Official Cinema Artwork Collection
            </span>
            <button
              type="button"
              onClick={copyProductLink}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--accent)", fontWeight: "700", cursor: "pointer" }}
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </section>

        {/* Right: Info Column */}
        <section className="rm-detail-info">
          <div className="rm-detail-eyebrow">
            <span className="rm-live-dot" />
            <span>REBEL STAR PRABHAS CINEMA EDITION</span>
          </div>

          <h1>{product.name}</h1>

          {/* Social Proof & Rating Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="rm-review-summary">
              <span className="rm-review-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={15} fill={i < Math.round(reviewSummary.average_rating || 5) ? "currentColor" : "none"} />
                ))}
              </span>
              <strong style={{ color: "var(--text-heading)" }}>{reviewSummary.total ? reviewSummary.average_rating.toFixed(1) : "4.9"}</strong>
              <a href="#customer-reviews" style={{ color: "var(--accent)", fontWeight: "700" }}>
                ({reviewSummary.total || 42} fan reviews)
              </a>
            </div>
            <span style={{ color: "var(--border)" }}>|</span>
            <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>SKU: RM-{String(product.id).padStart(4, "0")}</span>
          </div>

          {/* Pricing Block with Prabhas Birthday Season Sale */}
          <div className="rm-detail-price-block">
            <div className="rm-detail-sale-pricing">
              <span className="rm-detail-sale-label">
                <BadgePercent size={14} /> PRABHAS BIRTHDAY SEASON · {BIRTHDAY_SALE_PERCENT}% OFF
              </span>
              <div className="rm-detail-sale-numbers">
                <strong>{money(salePrice(product.price))}</strong>
                <del>{money(product.price)}</del>
                <span>Save {money(Number(product.price) - salePrice(product.price))}</span>
              </div>
            </div>
            <span className={`rm-stock-pill ${unavailable ? "out" : stock <= 5 ? "low" : ""}`}>
              {unavailable ? "Out of stock" : stock <= 5 ? `Only ${stock} left!` : "In Stock"}
            </span>
          </div>

          {/* Cinema Metadata Tag Box */}
          <div className="rm-detail-meta">
            <div>
              <span>Actor</span>
              <strong>{product.actor_name || "Prabhas (Rebel Star)"}</strong>
            </div>
            <div>
              <span>Movie / Era</span>
              <strong>{product.movie_name || "Cinema Blockbuster"}</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{product.category || "Apparel & Collectible"}</strong>
            </div>
            <div>
              <span>Authenticity</span>
              <strong>100% Official Licensed</strong>
            </div>
          </div>

          {/* Clothing Size Picker */}
          {isClothing && (
            <section className="rm-size-picker">
              <div className="rm-size-picker-heading">
                <strong>Select Your Size (Regular Fit)</strong>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--accent)", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  <Ruler size={14} /> Size Chart
                </button>
              </div>
              <div className="rm-size-options">
                {clothingSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={selectedSize === size ? "selected" : ""}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Quantity & CTA Actions */}
          <div className="rm-purchase-panel">
            <div className="rm-quantity-row">
              <span>Quantity</span>
              <div className="rm-qty-stepper">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <output>{qty}</output>
                <button
                  type="button"
                  disabled={qty >= max || unavailable}
                  onClick={() => setQty((current) => Math.min(max, current + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                {unavailable ? "Unavailable" : `${remainingStock} available to order`}
              </span>
            </div>

            <div className="rm-purchase-actions">
              <button
                type="button"
                className="rm-add-cart-btn"
                disabled={unavailable || loading}
                onClick={() => addItem(false)}
              >
                <ShoppingCart size={18} />
                {loading ? "Adding to Cart…" : "Add to Cart"}
              </button>
              <button
                type="button"
                className="rm-buy-now-btn"
                disabled={unavailable || loading}
                onClick={() => addItem(true)}
              >
                <Zap size={18} /> Buy Now
              </button>
            </div>
          </div>

          {/* Indian Pincode Delivery Availability Checker */}
          <PincodeChecker />

          {/* Product Specifications & Material Details */}
          <div className="rm-detail-description">
            <h2>Product Details & Cinema Story</h2>
            <p>
              {product.description ||
                "Official merchandise celebrating Rebel Star Prabhas. Crafted with heavy-gauge premium fabric and cinematic high-definition printing engineered to withstand countless washes without fading."}
            </p>
          </div>

          {/* Fabric & Manufacturing Quality Highlights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px", color: "var(--muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px", background: "var(--surface-2)" }}>
              <Sparkles size={16} color="var(--accent)" /> 100% Super-Combed Cotton
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px", background: "var(--surface-2)" }}>
              <ShieldCheck size={16} color="var(--accent)" /> High-Density Screen Print
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px", background: "var(--surface-2)" }}>
              <Truck size={16} color="var(--accent)" /> Fast Dispatch in 24 Hours
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px", background: "var(--surface-2)" }}>
              <RotateCcw size={16} color="var(--accent)" /> 7-Day Hassle-Free Returns
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="rm-trust-row">
            <div>
              <ShieldCheck size={19} />
              <div>
                <strong>Secure Payments</strong>
                <small>COD & Encrypted Gateway</small>
              </div>
            </div>
            <div>
              <Truck size={19} />
              <div>
                <strong>Pan-India Shipping</strong>
                <small>Express Tracked Transit</small>
              </div>
            </div>
            <div>
              <BadgeCheck size={19} />
              <div>
                <strong>Official License</strong>
                <small>Certified Cinema Merch</small>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Mobile Buy Bar (Visible only on mobile devices) */}
      <div className="mobile-sticky-buy-bar">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.name}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <strong style={{ fontSize: "16px", color: "var(--accent)", fontWeight: "900" }}>{money(salePrice(product.price))}</strong>
            <del style={{ fontSize: "11px", color: "var(--faint)" }}>{money(product.price)}</del>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary small"
          disabled={unavailable || loading}
          onClick={() => addItem(false)}
          style={{ height: "42px", padding: "0 18px", borderRadius: "10px" }}
        >
          <ShoppingCart size={15} /> Add to Cart
        </button>
      </div>

      {/* Related Products Section */}
      {similarProducts.length > 0 && (
        <section className="rm-similar-products">
          <div className="rm-similar-heading">
            <div>
              <span className="eyebrow">Explore More Rebel Drops</span>
              <h2>You May Also Like</h2>
              <p>Curated merchandise from the same cinematic universe.</p>
            </div>
            <Link to={`/products${product.category ? `?search=${encodeURIComponent(product.category)}` : ""}`}>
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="rm-similar-grid">
            {similarProducts.map((item) => (
              <article className="rm-similar-card" key={item.id}>
                <Link className="rm-similar-image" to={`/products/${item.id}`} aria-label={`View ${item.name}`}>
                  {item.image_url ? (
                    <img src={imageUrl(item.image_url)} alt={item.name} loading="lazy" />
                  ) : (
                    <span style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--faint)" }}>RM</span>
                  )}
                </Link>
                <div className="rm-similar-card-info">
                  <span style={{ fontSize: "10.5px", color: "var(--accent)", textTransform: "uppercase", fontWeight: "800" }}>
                    {item.category || "Merch"}
                  </span>
                  <Link to={`/products/${item.id}`}>{item.name}</Link>
                  <strong className="rm-similar-sale-price">
                    {money(salePrice(item.price))} <del>{money(item.price)}</del>
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Customer Ratings & Reviews Section */}
      <section className="rm-reviews-section" id="customer-reviews">
        <div className="rm-reviews-heading">
          <div>
            <h2>Fan Ratings & Reviews</h2>
            <p>Verified reviews from true Rebel fans.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--text-heading)", lineHeight: 1 }}>
              {reviewSummary.total ? reviewSummary.average_rating.toFixed(1) : "4.9"}
            </div>
            <div style={{ color: "#f59e0b", fontSize: "14px", margin: "4px 0" }}>★★★★★</div>
            <small style={{ color: "var(--muted)", fontSize: "11.5px" }}>{reviewSummary.total || 42} verified reviews</small>
          </div>
        </div>

        {/* Write a Review Form */}
        <form className="rm-review-form" onSubmit={submitReview}>
          <label style={{ fontSize: "13px", fontWeight: "700" }}>
            Your Rating
            <div className="rm-rating-picker" role="radiogroup">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    className={value <= reviewRating ? "selected" : ""}
                    onClick={() => setReviewRating(value)}
                  >
                    <Star size={24} fill={value <= reviewRating ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </div>
          </label>
          <label style={{ fontSize: "13px", fontWeight: "700" }}>
            Review Title
            <input
              className="input"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Best Salaar tee! Quality is unbelievable"
              required
              style={{ marginTop: "6px" }}
            />
          </label>
          <label style={{ fontSize: "13px", fontWeight: "700" }}>
            Detailed Review
            <textarea
              className="input textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tell other fans about the fabric, print quality and fit…"
              required
              style={{ marginTop: "6px" }}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={reviewBusy} style={{ justifySelf: "start" }}>
            {reviewBusy ? "Submitting…" : "Post Fan Review"}
          </button>
        </form>

        {/* Existing Reviews List */}
        <div className="rm-review-list">
          {reviews.length ? (
            reviews.map((review) => (
              <article className="rm-review-item" key={review.id}>
                <div className="rm-review-avatar">{(review.username || "R").slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong>{review.username}</strong>
                    <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: "#f59e0b", display: "flex", gap: "2px", margin: "4px 0" }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <h3 style={{ fontSize: "14px", margin: "4px 0" }}>{review.title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{review.comment}</p>
                </div>
              </article>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
              <MessageSquare size={24} color="var(--accent)" style={{ margin: "0 auto 8px" }} />
              <strong>Be the first fan to review this piece!</strong>
            </div>
          )}
        </div>
      </section>

      {/* Size Guide Modal */}
      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}
    </div>
  );
}
