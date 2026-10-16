import axios from "axios";
import { memo, useCallback, useState } from "react";
import { ArrowUpRight, Heart, ImageOff, ShoppingCart, BadgePercent, Eye, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useCart } from "../hooks/useCart";
import { imageUrl, money } from "../lib/constants";
import { BIRTHDAY_SALE_PERCENT, salePrice } from "../lib/pricing";
import QuickViewModal from "./QuickViewModal";
import type { ApiErrorBody, Product } from "../types/api";

interface ProductCardProps {
  product: Product;
  admin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onImage?: (product: Product) => void;
}

const WISH_KEY = "rebel_mart_wishlist";

function readWish(): number[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(WISH_KEY) || "[]",
    );

    return Array.isArray(value)
      ? value.filter((id): id is number => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

function getMovieBadge(product: Product): string | null {
  if (product.movie_name) return product.movie_name;
  const name = (product.name || "").toLowerCase();
  if (name.includes("salaar")) return "Salaar";
  if (name.includes("kalki")) return "Kalki 2898 AD";
  if (name.includes("baahubali")) return "Baahubali";
  if (name.includes("raja saab") || name.includes("rajasaab")) return "The Raja Saab";
  if (name.includes("saaho")) return "Saaho";
  if (name.includes("mirchi")) return "Mirchi";
  if (name.includes("darling")) return "Darling";
  return null;
}

function ProductCard({
  product,
  admin = false,
  onEdit,
  onDelete,
  onImage,
}: ProductCardProps) {
  const { add, loading } = useCart();
  const navigate = useNavigate();
  const isClothing = /t[ -]?shirts?|shirts?|hoodies?|sweatshirts?|apparel/i.test(`${product.name || ""} ${product.category || ""}`);
  const { show } = useToast() as unknown as {
    show: (message: string, type?: string) => void;
  };
  const [wish, setWish] = useState(() => readWish().includes(product.id));
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const toggleWishlist = useCallback(() => {
    const list = readWish();
    const next = list.includes(product.id)
      ? list.filter((id) => id !== product.id)
      : [...list, product.id];

    localStorage.setItem(WISH_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("rebel-wishlist-updated"));
    setWish(!wish);
    show(wish ? "Removed from wishlist" : "Added to wishlist", "info");
  }, [product.id, show, wish]);

  const addToCart = useCallback(async () => {
    if (!localStorage.getItem("rebel_mart_token")) {
      show("Please sign in to add products to your cart", "error");
      navigate("/login");
      return;
    }
    try {
      await add(product.id);
      show("Added to cart", "success");
    } catch (error: unknown) {
      const detail = axios.isAxiosError<ApiErrorBody>(error)
        ? error.response?.data?.detail
        : undefined;
      const message =
        typeof detail === "string" ? detail : "Could not add to cart";

      show(message, "error");
    }
  }, [add, navigate, product.id, show]);

  const movieBadge = getMovieBadge(product);
  const stock = Number(product.stock || 0);

  return (
    <>
      <article className="product-card">
        <div className="product-media">
          <Link className="product-image-link" to={`/products/${product.id}`} aria-label={`View details for ${product.name}`} tabIndex={admin ? -1 : 0}>
            <img
              src={imageUrl(product.image_url || "/categories/tshirts.webp")}
              alt={product.name}
              width="640"
              height="640"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                const cat = (product.category || "").toLowerCase();
                const movie = (product.movie_name || "").toLowerCase();
                let fallback = "/categories/tshirts.webp";
                if (cat.includes("hoodie")) fallback = "/categories/hoodies.jpeg";
                else if (cat.includes("poster") || cat.includes("art")) fallback = "/categories/posters.jpg";
                else if (cat.includes("collect") || cat.includes("stand") || cat.includes("statue")) fallback = "/categories/collectibles.jpg";
                else if (cat.includes("access") || cat.includes("pin")) fallback = "/events/darling.webp";
                else if (movie.includes("saaho")) fallback = "/events/saaho.webp";
                else if (movie.includes("mirchi")) fallback = "/events/mirchi.webp";
                else if (movie.includes("raja")) fallback = "/events/rajasaab.webp";
                
                if (!event.currentTarget.src.endsWith(fallback)) {
                  event.currentTarget.src = fallback;
                }
              }}
            />
          </Link>

          {/* Action buttons (Wishlist, Quick View, Compare) */}
          <div className="media-actions">
            {!admin && (
              <button
                className="round-action"
                onClick={toggleWishlist}
                aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
                title={wish ? "Saved to wishlist" : "Save to wishlist"}
              >
                <Heart size={16} fill={wish ? "currentColor" : "none"} color={wish ? "#f43f5e" : "#ffffff"} />
              </button>
            )}

            {!admin && (
              <button
                className="round-action"
                onClick={() => setQuickViewOpen(true)}
                aria-label="Quick View"
                title="Quick View"
              >
                <Eye size={16} />
              </button>
            )}


            <Link
              className="round-action"
              to={`/products/${product.id}`}
              aria-label="View product page"
              title="Full Details"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {!admin && (
            <span className="rm-birthday-sale-badge">
              <BadgePercent size={12} />
              {BIRTHDAY_SALE_PERCENT}% OFF
            </span>
          )}

          {stock <= 0 ? (
            <span className="stock-badge sold">Sold out</span>
          ) : stock <= 5 ? (
            <span className="stock-badge low">Only {stock} left</span>
          ) : null}
        </div>

        <div className="product-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
            <span className="eyebrow">{product.category || "Fanwear"}</span>
            {movieBadge && (
              <span style={{ fontSize: "10.5px", fontWeight: "800", color: "var(--accent)", background: "rgba(245, 158, 11, 0.1)", padding: "2px 7px", borderRadius: "6px", border: "1px solid var(--border-gold-subtle)" }}>
                🎬 {movieBadge}
              </span>
            )}
          </div>

          <Link className="product-title" to={`/products/${product.id}`} title={product.name}>
            {product.name}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)", marginBottom: "6px" }}>
            <span style={{ color: "#f59e0b", display: "inline-flex" }}>
              <Star size={12} fill="currentColor" />
            </span>
            <strong style={{ color: "var(--text-heading)", fontWeight: "700" }}>4.9</strong>
            <span>• Rebel Star Edition</span>
          </div>

          <p className="product-description">
            {product.description || "Authentic Rebel Star Prabhas merchandise crafted for true fans."}
          </p>

          <div className="product-footer">
            <div>
              {admin ? (
                <strong style={{ fontSize: "17px", color: "var(--text-heading)" }}>{money(product.price)}</strong>
              ) : (
                <div className="rm-sale-price-stack">
                  <strong className="rm-sale-price">{money(salePrice(product.price))}</strong>
                  <del>{money(product.price)}</del>
                </div>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: stock > 0 ? "var(--success)" : "var(--danger)",
                    display: "inline-block",
                  }}
                />
                {stock > 0 ? `${stock} in stock` : "Unavailable"}
              </span>
            </div>

            {!admin ? (
              <button
                disabled={loading || stock <= 0}
                className="btn-primary small product-action-btn"
                onClick={isClothing ? () => navigate(`/products/${product.id}`) : addToCart}
              >
                {isClothing ? <ArrowUpRight size={14} /> : <ShoppingCart size={14} />}
                {isClothing ? "Size" : loading ? "…" : "Add"}
              </button>
            ) : (
              <div className="admin-actions">
                <button
                  className="btn-secondary tiny"
                  onClick={() => onEdit?.(product)}
                >
                  Edit
                </button>

                <button
                  className="btn-secondary tiny"
                  onClick={() => onImage?.(product)}
                >
                  Image
                </button>

                <button
                  className="btn-danger tiny"
                  onClick={() => onDelete?.(product)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {quickViewOpen && (
        <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </>
  );
}

export default memo(ProductCard);
