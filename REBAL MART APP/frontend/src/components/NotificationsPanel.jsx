import { Bell, MessageCircle, Package, X, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRealtime } from "../context/RealtimeContext";

function timeAgo(timestamp) {
    if (!timestamp) return "Just now";
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return "Just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NotificationsPanel() {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const { notifications, unread, markAllRead, clearNotifications, orderConnection } = useRealtime();

    const toggle = () => {
        setOpen((prev) => {
            if (!prev) markAllRead();
            return !prev;
        });
    };

    // Close on click outside or Escape key
    useEffect(() => {
        if (!open) return undefined;
        const handleClickOutside = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const isConnected = orderConnection.status === "open";

    return (
        <div className="notification-wrap" ref={wrapRef}>
            <button
                className={`icon-btn notification-button${open ? " active" : ""}`}
                onClick={toggle}
                aria-label="Notifications"
                title="Notifications"
                type="button"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="notification-badge">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-panel" role="dialog" aria-label="Notifications">
                    {/* Header */}
                    <div className="notification-head">
                        <div className="notification-head-title-wrap">
                            <span className="notification-head-title">Notifications</span>
                            <span className={`connection-pill ${isConnected ? "online" : "offline"}`}>
                                <span className="connection-dot" />
                                {isConnected ? "Live" : "Offline"}
                            </span>
                        </div>
                        <div className="notification-head-actions">
                            {notifications.length > 0 && (
                                <button
                                    type="button"
                                    className="notification-text-action"
                                    onClick={clearNotifications}
                                    title="Clear all notifications"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                type="button"
                                className="notification-close"
                                onClick={() => setOpen(false)}
                                aria-label="Close notifications"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Notification Items */}
                    {!notifications.length ? (
                        <div className="notification-empty">
                            <div className="notification-empty-icon">
                                <Bell size={22} />
                            </div>
                            <h4 className="notification-empty-title">All Caught Up!</h4>
                            <p className="notification-empty-text">
                                No new updates right now. You'll receive live order and support alerts here.
                            </p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((item) => (
                                <div className="notification-item" key={item.id}>
                                    <div className={`notification-item-icon ${item.type === "chat" ? "chat" : "order"}`}>
                                        {item.type === "chat" ? (
                                            <MessageCircle size={16} />
                                        ) : (
                                            <Package size={16} />
                                        )}
                                    </div>
                                    <div className="notification-item-body">
                                        <div className="notification-item-header">
                                            <strong className="notification-item-title">{item.title}</strong>
                                            <span className="notification-item-time">{timeAgo(item.createdAt)}</span>
                                        </div>
                                        <p className="notification-item-message">{item.message}</p>
                                        {item.orderId && (
                                            <Link
                                                to={`/orders/${item.orderId}`}
                                                className="notification-item-action"
                                                onClick={() => setOpen(false)}
                                            >
                                                <span>View Order Details</span>
                                                <ArrowRight size={12} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="notification-footer">
                        <span>Rebel Mart Live Updates</span>
                        {notifications.length > 0 && (
                            <span>{notifications.length} {notifications.length === 1 ? "update" : "updates"}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
