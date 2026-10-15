import { useState } from "react";
import { X, Heart, ShoppingCart, Zap, Star, ShieldCheck, BadgePercent, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { imageUrl, money } from "../lib/constants";
import { BIRTHDAY_SALE_PERCENT, salePrice } from "../lib/pricing";
import { useCart } from "../hooks/useCart";
import { useToast } from "../context/ToastContext";
import type { Product } from "../types/api";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { add, loading } = useCart();
  const { show } = useToast() as unknown as { show: (msg: string, type?: string) => void };
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const isClothing = product ? /t[ -]?shirts?|shirts?|hoodies?|sweatshirts?|apparel/i.test(`${product.name || ""} ${product.category || ""}`) : false;
  const clothingSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [selectedSize, setSelectedSize] = useState<string>(isClothing ? "L" : "");

  if (!product) return null;

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  const handleAddToCart = async (goToCheckout = false) => {
    if (isClothing && !selectedSize) {
      show("Please select a size first", "error");
      return;
    }
    if (!localStorage.getItem("rebel_mart_token")) {
      show("Please sign in to add products to your cart", "error");
      navigate("/login");
      return;
    }
    try {
      if (isClothing) {
        const savedSizes = JSON.parse(localStorage.getItem("rebel_mart_item_sizes") || "{}");
        savedSizes[String(product.id)] = selectedSize;
        localStorage.setItem("rebel_mart_item_sizes", JSON.stringify(savedSizes));
      }
      await add(product.id, qty);
      show(`${product.name}${isClothing ? ` (${selectedSize})` : ""} added to cart`, "success");
      onClose();
      if (goToCheckout) navigate("/checkout");
    } catch {
      show("Could not add to cart", "error");
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(9, 9, 12, 0.75)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: "16px" }}>
      <div className="card" style={{ width: "min(840px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "28px", position: "relative", border: "1px solid var(--border-gold)", background: "var(--surface)" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: "18px", right: "18px", width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--muted)", cursor: "pointer", zIndex: 10 }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", alignItems: "center" }}>
          <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: "18px", overflow: "hidden", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {product.image_url ? (
              <img src={imageUrl(product.image_url)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--faint)", fontFamily: "var(--font-display)", fontSize: "36px" }}>
                REBEL MART
              </div>
            )}
            <span style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 9px", borderRadius: "8px", background: "var(--accent)", color: "#09090c", fontSize: "10px", fontWeight: "850" }}>
              <BadgePercent size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: "4px" }} />
              {BIRTHDAY_SALE_PERCENT}% BIRTHDAY SALE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--accent)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <span>{product.category || "Fan Merchandise"}</span>
              {product.movie_name && (
                <>
                  <span>•</span>
                  <span>🎬 {product.movie_name}</span>
                </>
              )}
            </div>

            <h2 style={{ fontSize: "24px", margin: "0", lineHeight: "1.2", color: "var(--text-heading)" }}>{product.name}</h2>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <div style={{ color: "#f59e0b", display: "flex", gap: "2px" }}>
                {Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <strong style={{ color: "var(--text-heading)" }}>4.9</strong>
              <span style={{ color: "var(--muted)", fontSize: "12px" }}>· Official Rebel Star Collectible</span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "12px 16px", borderRadius: "12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <strong style={{ fontSize: "26px", fontWeight: "900", color: "var(--text-heading)" }}>
                {money(salePrice(product.price))}
              </strong>
              <del style={{ fontSize: "14px", color: "var(--faint)" }}>{money(product.price)}</del>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent-crimson)", marginLeft: "auto" }}>
                Save {BIRTHDAY_SALE_PERCENT}%
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--muted)", lineClamp: 3, margin: "0" }}>
              {product.description || "Official merchandise celebrating Rebel Star Prabhas. Crafted with premium cinematic artwork and durable finish."}
            </p>

            {isClothing && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>
                  <span>Select Size</span>
                  <span style={{ color: "var(--accent)" }}>Standard India Fit</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {clothingSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: selectedSize === size ? "var(--accent)" : "var(--surface-2)",
                        color: selectedSize === size ? "#09090c" : "var(--text)",
                        border: selectedSize === size ? "1px solid var(--accent)" : "1px solid var(--border)",
                        fontWeight: "800",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", height: "42px", borderRadius: "10px", background: "var(--surface-2)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ width: "36px", height: "100%", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)" }}
                >
                  -
                </button>
                <span style={{ minWidth: "32px", textAlign: "center", fontWeight: "800", fontSize: "13px" }}>{qty}</span>
                <button
                  type="button"
                  disabled={qty >= stock || isOutOfStock}
                  onClick={() => setQty((q) => Math.min(stock, q + 1))}
                  style={{ width: "36px", height: "100%", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)" }}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={loading || isOutOfStock}
                onClick={() => handleAddToCart(false)}
                style={{ flex: 1, height: "42px" }}
              >
                <ShoppingCart size={16} />
                {loading ? "Adding…" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                type="button"
                className="btn-secondary"
                disabled={loading || isOutOfStock}
                onClick={() => handleAddToCart(true)}
                style={{ height: "42px", padding: "0 16px" }}
              >
                <Zap size={16} /> Buy Now
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border)", marginTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--faint)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <ShieldCheck size={14} color="var(--accent)" /> 100% Authentic Merch
              </span>
              <Link
                to={`/products/${product.id}`}
                onClick={onClose}
                style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                View full specifications <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
