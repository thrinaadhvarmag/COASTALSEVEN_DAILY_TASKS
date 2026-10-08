import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../services/api";
import { useCart } from "../hooks/useCart";
import { useCartProducts } from "../hooks/useCartProducts";
import { getErrorMessage, imageUrl, money } from "../lib/constants";
import { checkoutDefaults, checkoutSchema } from "../lib/checkoutSchema";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
export default function Checkout() {
    const { items, clear, refreshCart } = useCart();
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const { show } = useToast();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: checkoutDefaults,
        mode: "onBlur",
    });
    useEffect(() => {
        refreshCart().finally(() => setLoading(false));
    }, [refreshCart]);
    const productsQuery = useCartProducts(items);
    const products = productsQuery.products;
    const rows = items
        .map((item) => ({ ...item, product: products[item.product_id] }))
        .filter((row) => row.product);
    const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.product.price) * Number(row.quantity), 0), [rows]);
    const placeOrder = async (form) => {
        setBusy(true);
        try {
            const payload = {
                ...form,
                customer_name: form.customer_name.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                pincode: form.pincode.trim(),
                delivery_instructions: form.delivery_instructions?.trim() || null,
            };
            const { data } = await api.post("/orders", payload);
            show(`Order #${data.id} placed successfully`);
            await clear();
            navigate(`/orders/${data.id}`);
        }
        catch (err) {
            show(getErrorMessage(err), "error");
        }
        finally {
            setBusy(false);
        }
    };
    if (loading) {
        return <div className="container page-section">
    <div className="spinner mx-auto"/>
</div>;
    }
    if (!items.length) {
        return (<div className="container page-section">

    <EmptyState title="Your cart is empty" text="Add products before continuing to checkout." action={<Link className="btn-primary" to="/products">
Browse products
    <ArrowRight size={17}/>
</Link>}/>

      </div>);
    }
    return (<div className="container page-section">

    <Link className="back-link" to="/cart">
        <ArrowLeft size={16}/>
 Back to cart
    </Link>

    <div className="page-heading checkout-heading">

        <div>
            <div className="eyebrow">
Secure checkout
            </div>
            <h1>
Delivery details
            </h1>
            <p>
Tell us where to deliver your Rebel Mart order.
            </p>
        </div>

    </div>

    <div className="checkout-layout">

        <form className="card checkout-form" onSubmit={handleSubmit(placeOrder)} noValidate>

            <div className="section-title">
                <div>
                    <h2>
Customer information
                    </h2>
                    <p>
These details are saved with this order so the admin can plan delivery.
                    </p>
                </div>
            </div>

            <div className="form-grid">

                <label>

                    <span>
Full name *
                    </span>

                    <div className="field-icon">
                        <UserRound size={16}/>
                        <input className="input" {...register("customer_name")} placeholder="Your full name" aria-invalid={Boolean(errors.customer_name)}/>
                    </div>

              {errors.customer_name &&
                    <small className="field-error">

{errors.customer_name.message}
                    </small>
}
                </label>

                <label>

                    <span>
Phone number *
                    </span>

                    <div className="field-icon">
                        <Phone size={16}/>
                        <input className="input" {...register("phone")} placeholder="9876543210" inputMode="tel" aria-invalid={Boolean(errors.phone)}/>
                    </div>

              {errors.phone &&
                    <small className="field-error">

{errors.phone.message}
                    </small>
}
                </label>

            </div>

            <label>

                <span>
Delivery address *
                </span>

                <div className="field-icon">
                    <MapPin size={16}/>
                    <textarea className="input textarea" {...register("address")} placeholder="House/flat number, street, area" aria-invalid={Boolean(errors.address)}/>
                </div>

            {errors.address &&
                <small className="field-error">

{errors.address.message}
                </small>
}
            </label>

            <div className="form-grid">

                <label>
                    <span>
City *
                    </span>
                    <input className="input" {...register("city")} placeholder="City" aria-invalid={Boolean(errors.city)}/>
{errors.city &&
                    <small className="field-error">

{errors.city.message}
                    </small>
}
                </label>

                <label>
                    <span>
State *
                    </span>
                    <input className="input" {...register("state")} placeholder="State" aria-invalid={Boolean(errors.state)}/>
{errors.state &&
                    <small className="field-error">

{errors.state.message}
                    </small>
}
                </label>

            </div>

            <div className="form-grid">

                <label>
                    <span>
Pincode *
                    </span>
                    <input className="input" {...register("pincode")} placeholder="6-digit pincode" inputMode="numeric" aria-invalid={Boolean(errors.pincode)}/>
{errors.pincode &&
                    <small className="field-error">

{errors.pincode.message}
                    </small>
}
                </label>

                <label>
                    <span>
Delivery instructions
                        <em>
optional
                        </em>
                    </span>
                    <input className="input" {...register("delivery_instructions")} placeholder="Gate, floor, landmark…" aria-invalid={Boolean(errors.delivery_instructions)}/>
{errors.delivery_instructions &&
                    <small className="field-error">

{errors.delivery_instructions.message}
                    </small>
}
                </label>

            </div>

            <div className="checkout-security">
                <ShieldCheck size={18}/>
                <div>
                    <strong>
Your information is protected
                    </strong>
                    <span>
Your delivery details are attached to this order for fulfillment.
                    </span>
                </div>
            </div>

            <button className="btn-primary full" disabled={busy}>
{busy ? "Placing order…" : "Place order securely"}
                <ArrowRight size={17}/>
            </button>

        </form>

        <aside className="card checkout-summary">
            <span className="eyebrow">
Order summary
            </span>
            <div className="checkout-items">
{rows.map((row) =>
                <div className="checkout-item" key={row.product.id}>

                    <div className="cart-thumb">

{row.product.image_url ?
                        <img src={imageUrl(row.product.image_url)} alt=""/>

 :
                        <span>

RM
                        </span>

}
                    </div>

                    <div>

                        <strong>

{row.product.name}
                        </strong>

                        <span>

Qty {row.quantity}
                        </span>

                    </div>

                    <strong>

{money(Number(row.product.price) * row.quantity)}
                    </strong>

                </div>
)}
            </div>
            <div className="summary-line">
                <span>
Items
                </span>
                <strong>
{items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                </strong>
            </div>
<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside>
      </div>
    </div>);
}
