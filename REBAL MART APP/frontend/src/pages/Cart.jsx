import { useEffect, useMemo, useCallback } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, ShieldCheck, Truck, Sparkles, Tag } from "lucide-react";
import { imageUrl, money, getErrorMessage } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import EmptyState from "../components/EmptyState";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useCartProducts } from "../hooks/useCartProducts";
import { BIRTHDAY_SALE_PERCENT, salePrice } from "../lib/pricing";

const FREE_SHIPPING_THRESHOLD = 999;

export default function Cart() {
    const { items, update, remove, clear, refreshCart } = useCart();
    const navigate = useNavigate();
    const { show } = useToast();

    useEffect(() => { refreshCart().catch(() => { }); }, [refreshCart]);

    const productsQuery = useCartProducts(items);
    const products = productsQuery.products;
    const rows = items.map((item) => ({ ...item, product: products[item.product_id] })).filter((row) => row.product);
    const total = useMemo(() => rows.reduce((sum, row) => sum + salePrice(row.product.price) * Number(row.quantity), 0), [rows]);
    const originalTotal = useMemo(() => rows.reduce((sum, row) => sum + Number(row.product.price) * Number(row.quantity), 0), [rows]);

    const freeShippingProgress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
    const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

    const changeQuantity = useCallback(async (productId, quantity) => {
        try {
            await update(productId, quantity);
        }
        catch (error) {
            show(getErrorMessage(error), "error");
        }
    }, [update, show]);

    const removeItem = useCallback(async (productId) => {
        try {
            await remove(productId);
        }
        catch (error) {
            show(getErrorMessage(error), "error");
        }
    }, [remove, show]);

    const clearCart = useCallback(async () => {
        try {
            await clear();
        }
        catch (error) {
            show(getErrorMessage(error), "error");
        }
    }, [clear, show]);

    if (!items.length) {
        return (
            <div className="container page-section">
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    text="Explore the official Rebel Star collections and your merchandise will appear here."
                    action={
                        <button className="btn-primary" onClick={() => navigate("/products")}>
                            Browse products <ArrowRight size={17}/>
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="container page-section">
            <div className="page-heading">
                <div>
                    <div className="eyebrow">Your Bag</div>
                    <h1>Shopping Cart</h1>
                    <p>Review your official Prabhas merchandise before proceeding to checkout.</p>
                </div>
                <button className="btn-secondary" onClick={clearCart}>
                    <Trash2 size={16}/> Clear cart
                </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div
                className="card"
                style={{
                    padding: "16px 20px",
                    marginBottom: "24px",
                    background: "var(--surface)",
                    border: "1px solid var(--border-gold-subtle)",
                    borderRadius: "16px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "750" }}>
                        <Truck size={17} color="var(--accent)" />
                        <span>
                            {amountNeededForFreeShipping === 0
                                ? "🎉 You've unlocked FREE Cinema Express Delivery!"
                                : `Add ${money(amountNeededForFreeShipping)} more to qualify for FREE Express Delivery`}
                        </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "800" }}>
                        {freeShippingProgress}%
                    </span>
                </div>
                <div style={{ width: "100%", height: "7px", background: "var(--surface-2)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                        style={{
                            width: `${freeShippingProgress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                        }}
                    />
                </div>
            </div>

            <div className="cart-layout">
                <div className="cart-list">
                    {rows.map((row) => (
                        <div className="cart-row" key={row.product.id}>
                            <div className="cart-thumb">
                                {row.product.image_url ? (
                                    <img src={imageUrl(row.product.image_url)} alt="" loading="lazy"/>
                                ) : (
                                    <span>RM</span>
                                )}
                            </div>

                            <div className="cart-info">
                                <Link to={`/products/${row.product.id}`}>
                                    {row.product.name}
                                </Link>

                                {row.product.movie_name && (
                                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: "800", color: "var(--accent)", marginBottom: "4px" }}>
                                        🎬 {row.product.movie_name}
                                    </span>
                                )}

                                <span>
                                    <>{money(salePrice(row.product.price))} each <del className="rm-cart-original-price">{money(row.product.price)}</del><small className="rm-cart-sale-note">{BIRTHDAY_SALE_PERCENT}% birthday sale</small></>
                                </span>

                                {(() => {
                                    try {
                                        const size = JSON.parse(localStorage.getItem("rebel_mart_item_sizes") || "{}")[String(row.product.id)];
                                        return size ? <small className="cart-item-size">Size: {size}</small> : null;
                                    } catch {
                                        return null;
                                    }
                                })()}
                            </div>

                            <div className="qty-control">
                                <button
                                    onClick={() => changeQuantity(row.product.id, Math.max(1, row.quantity - 1))}
                                    aria-label={`Decrease ${row.product.name}`}
                                >
                                    <Minus size={15}/>
                                </button>
                                <span>{row.quantity}</span>
                                <button
                                    onClick={() => changeQuantity(row.product.id, Math.min(Number(row.product.stock || row.quantity + 1), row.quantity + 1))}
                                    disabled={row.quantity >= Number(row.product.stock || row.quantity)}
                                    aria-label={`Increase ${row.product.name}`}
                                >
                                    <Plus size={15}/>
                                </button>
                            </div>

                            <strong className="cart-line-total">
                                <>{money(salePrice(row.product.price) * row.quantity)}<del className="rm-cart-original-price rm-cart-line-original">{money(Number(row.product.price) * row.quantity)}</del></>
                            </strong>

                            <button
                                className="icon-btn danger-icon"
                                onClick={() => removeItem(row.product.id)}
                                aria-label={`Remove ${row.product.name}`}
                            >
                                <Trash2 size={17}/>
                            </button>
                        </div>
                    ))}
                </div>

                <aside className="summary-card">
                    <span className="eyebrow">Order Summary</span>

                    <div className="summary-line">
                        <span>Total Items</span>
                        <strong>{items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
                    </div>

                    <div className="summary-line">
                        <span>Original Total</span>
                        <span><del>{money(originalTotal)}</del></span>
                    </div>

                    <div className="summary-line rm-discount-line">
                        <span>Prabhas Birthday Sale ({BIRTHDAY_SALE_PERCENT}%)</span>
                        <strong>−{money(originalTotal - total)}</strong>
                    </div>

                    <div className="summary-line">
                        <span>Estimated Shipping</span>
                        <strong style={{ color: amountNeededForFreeShipping === 0 ? "var(--success)" : "inherit" }}>
                            {amountNeededForFreeShipping === 0 ? "FREE" : "₹49"}
                        </strong>
                    </div>

                    <div className="summary-total">
                        <span>Subtotal</span>
                        <strong>{money(total)}</strong>
                    </div>

                    {/* Coupons Promo Banner */}
                    <div style={{ background: "var(--surface-2)", padding: "10px 12px", borderRadius: "10px", margin: "14px 0 16px", fontSize: "11.5px", color: "var(--muted)", border: "1px dashed var(--border-gold-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "750", color: "var(--accent)", marginBottom: "4px" }}>
                            <Tag size={13} /> Available Promo Codes
                        </div>
                        <div>Use <code>WELCOME10</code> for 10% off (₹999+) or <code>REBEL15</code> for 15% off (₹1,999+) at checkout.</div>
                    </div>

                    <button
                        className="btn-primary full"
                        disabled={!rows.length}
                        onClick={() => navigate("/checkout")}
                    >
                        Proceed to Checkout <ArrowRight size={17}/>
                    </button>

                    <div style={{ display: "grid", gap: "8px", marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                        <div className="secure-note" style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <ShieldCheck size={16} color="var(--accent)"/> 100% Encrypted & Secure Checkout
                        </div>
                        <div style={{ fontSize: "11.5px", display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                            <Sparkles size={16} color="var(--accent)"/> Official Licensed Merchandise
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
