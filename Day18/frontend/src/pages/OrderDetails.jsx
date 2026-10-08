import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, FileDown, LoaderCircle, PackageCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getErrorMessage, money, statusClasses, statusLabel } from "../lib/constants";
import { useOrder } from "../hooks/useOrders";
import { backgroundApi } from "../services/api";
import { useRealtime } from "../context/RealtimeContext";
const steps = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
export default function OrderDetails() {
    const { id } = useParams();
    const query = useOrder(id);
    const { orderConnection } = useRealtime();
    const [invoiceTask, setInvoiceTask] = useState(null);
    const [invoiceError, setInvoiceError] = useState("");
    const order = query.data;

    useEffect(() => {
        if (!invoiceTask || ["SUCCESS", "FAILURE", "REVOKED"].includes(invoiceTask.state)) return undefined;
        let cancelled = false;
        const poll = async () => {
            try {
                const result = await backgroundApi.status(invoiceTask.taskId);
                if (!cancelled) setInvoiceTask((current) => ({ ...current, ...result }));
            } catch (error) {
                if (!cancelled) setInvoiceError(getErrorMessage(error));
            }
        };
        poll();
        const timer = window.setInterval(poll, 1000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [invoiceTask?.taskId, invoiceTask?.state]);

    const generateInvoice = async () => {
        setInvoiceError("");
        try {
            const { task_id } = await backgroundApi.startInvoice(order.id);
            setInvoiceTask({ taskId: task_id, state: "PENDING", progress: null, result: null, error: null });
        } catch (error) {
            setInvoiceError(getErrorMessage(error));
        }
    };

    const openInvoice = async () => {
        if (!invoiceTask?.result?.filename) return;
        try {
            const blob = await backgroundApi.downloadInvoice(invoiceTask.result.filename);
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            setInvoiceError(getErrorMessage(error));
        }
    };
    if (query.error)
        return <div className="container page-section">
    <div className="alert error">
{getErrorMessage(query.error)}
    </div>
</div>;
    if (query.isLoading || !order)
        return <div className="container page-section">
    <div className="spinner mx-auto"/>
</div>;
    const current = steps.indexOf(order.status);
    return <div className="container page-section">
    <Link className="back-link" to="/orders">
        <ArrowLeft size={16}/>
 My orders
    </Link>
    <div className="order-detail card">
        <div className="detail-header">
            <div>
                <div className="eyebrow">
Order
                </div>
                <h1>
#{order.id}
                </h1>
                <p>
{order.created_at ? new Date(order.created_at).toLocaleString() : "Recently placed"}
                </p>
            </div>
            <div className="detail-live-meta">
                <span className={`realtime-order-status ${orderConnection.status === "open" ? "live" : ""}`}>
                    <span className={`chat-status-dot ${orderConnection.status === "open" ? "online" : "offline"}`} />
                    {orderConnection.status === "open" ? "Live status" : "Reconnecting"}
                </span>
                <span className={`status ${statusClasses[order.status] || ""}`}>
{statusLabel(order.status)}
                </span>
            </div>
        </div>

        <div className="progress-track">
{steps.map((step, index) =>
            <div className={`progress-step ${index <= current && order.status !== "CANCELLED" ? "done" : ""}`} key={step}>

                <span>

{index <= current && order.status !== "CANCELLED" ?
                    <CheckCircle2 size={16}/>

 : index + 1}
                </span>

                <small>

{statusLabel(step)}
                </small>

            </div>
)}
        </div>

        <div className="delivery-card">
            <div className="eyebrow">
Delivery details
            </div>
            <div className="delivery-grid">
                <div>
                    <span>
Name
                    </span>
                    <strong>
{order.customer_name || "—"}
                    </strong>
                </div>
                <div>
                    <span>
Phone
                    </span>
                    <strong>
{order.phone || "—"}
                    </strong>
                </div>
                <div className="wide">
                    <span>
Address
                    </span>
                    <strong>
{[order.address, order.city, order.state, order.pincode].filter(Boolean).join(", ") || "—"}
                    </strong>
                </div>
{order.delivery_instructions &&
                <div className="wide">

                    <span>

Instructions
                    </span>

                    <strong>

{order.delivery_instructions}
                    </strong>

                </div>
}
            </div>
        </div>

        <div className="order-items">
{(order.items || []).map((item) =>
            <div className="order-item" key={item.id}>

                <div className="cart-thumb">

                    <span>

                        <PackageCheck size={20}/>

                    </span>

                </div>

                <div>

                    <strong>

Product #{item.product_id}
                    </strong>

                    <span>

Qty {item.quantity} · {money(item.unit_price)} each
                    </span>

                </div>

                <strong>

{money(item.subtotal)}
    </strong>
</div>)}</div>
    <div className="order-total"><span>Total</span><strong>{money(order.total_amount)}</strong></div>

    <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!invoiceTask || invoiceTask.state === "FAILURE" ? (
            <button className="btn-secondary" type="button" onClick={generateInvoice}>
                <FileDown size={15} /> Generate invoice
            </button>
        ) : null}
        {invoiceTask && !["SUCCESS", "FAILURE", "REVOKED"].includes(invoiceTask.state) && (
            <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <LoaderCircle className="spin" size={15} />
                {invoiceTask.progress?.message || "Generating invoice…"}
                {invoiceTask.progress?.percent != null ? ` ${invoiceTask.progress.percent}%` : ""}
            </span>
        )}
        {invoiceTask?.state === "SUCCESS" && invoiceTask.result?.filename && (
            <button className="btn-primary" type="button" onClick={openInvoice}>
                <FileDown size={15} /> Open PDF invoice
            </button>
        )}
        {invoiceError && <div className="alert error" style={{ width: "100%" }}>{invoiceError}</div>}
        {invoiceTask?.state === "FAILURE" && <div className="alert error" style={{ width: "100%" }}>{invoiceTask.error || "Invoice generation failed"}</div>}
    </div>
  </div></div>;
}
