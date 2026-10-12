import { useEffect, useMemo, useCallback } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, ShieldCheck } from "lucide-react";
import { imageUrl, money, getErrorMessage } from "../lib/constants";
import { useCart } from "../hooks/useCart";
import EmptyState from "../components/EmptyState";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useCartProducts } from "../hooks/useCartProducts";
export default function Cart() {
    const { items, update, remove, clear, refreshCart } = useCart();
    const navigate = useNavigate();
    const { show } = useToast();
    useEffect(() => { refreshCart().catch(() => { }); }, [refreshCart]);
    const productsQuery = useCartProducts(items);
    const products = productsQuery.products;
    const rows = items.map((item) => ({ ...item, product: products[item.product_id] })).filter((row) => row.product);
    const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.product.price) * Number(row.quantity), 0), [rows]);
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
    if (!items.length)
        return <div className="container page-section">
    <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Find something you love and it will appear here." action={<button className="btn-primary" onClick={() => navigate("/products")}>
Browse products
    <ArrowRight size={17}/>
</button>}/></div>;
    return <div className="container page-section">
    <div className="page-heading">
        <div>
            <div className="eyebrow">
Your bag
            </div>
            <h1>
Shopping cart
            </h1>
            <p>
Review your items before placing your order.
            </p>
        </div>
        <button className="btn-secondary" onClick={clearCart}>
            <Trash2 size={16}/>
 Clear cart
        </button>
    </div>

    <div className="cart-layout">
        <div className="cart-list">
{rows.map((row) =>
            <div className="cart-row" key={row.product.id}>

                <div className="cart-thumb">

{row.product.image_url ?
                    <img src={imageUrl(row.product.image_url)} alt="" loading="lazy"/>

 :
                    <span>

RM
                    </span>

}
                </div>

                <div className="cart-info">

                    <Link to={`/products/${row.product.id}`}>

{row.product.name}
                    </Link>

                    <span>

{money(row.product.price)} each
                    </span>

                </div>

                <div className="qty-control">

                    <button onClick={() => changeQuantity(row.product.id, Math.max(1, row.quantity - 1))} aria-label={`Decrease ${row.product.name}`}>

                        <Minus size={15}/>

                    </button>

                    <span>

{row.quantity}
                    </span>

                    <button onClick={() => changeQuantity(row.product.id, Math.min(Number(row.product.stock || row.quantity + 1), row.quantity + 1))} disabled={row.quantity >= Number(row.product.stock || row.quantity)} aria-label={`Increase ${row.product.name}`}>

                        <Plus size={15}/>

                    </button>

                </div>

                <strong className="cart-line-total">

{money(Number(row.product.price) * row.quantity)}
                </strong>

                <button className="icon-btn danger-icon" onClick={() => removeItem(row.product.id)} aria-label={`Remove ${row.product.name}`}>

                    <Trash2 size={17}/>

                </button>

            </div>
)}
        </div>

        <aside className="summary-card">
            <span className="eyebrow">
Order summary
            </span>
            <div className="summary-line">
                <span>
Items
                </span>
                <strong>
{items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                </strong>
            </div>
            <div className="summary-line">
                <span>
Subtotal
                </span>
                <strong>
{money(total)}
                </strong>
            </div>
            <div className="summary-total">
                <span>
Total
                </span>
                <strong>
{money(total)}
                </strong>
            </div>
<button className="btn-primary full" disabled={!rows.length} onClick={() => navigate("/checkout")}>Continue to checkout<ArrowRight size={17}/></button><div className="secure-note"><ShieldCheck size={16}/> Secure account-protected checkout</div></aside>
    </div>
  </div>;
}
