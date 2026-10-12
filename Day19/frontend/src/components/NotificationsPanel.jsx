import { Bell, Check, MessageCircle, Wifi, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useRealtime } from "../context/RealtimeContext";

export default function NotificationsPanel() {
    const [open, setOpen] = useState(false);
    const { notifications, unread, markAllRead, clearNotifications, orderConnection } = useRealtime();

    const toggle = () => {
        setOpen((value) => !value);
        if (!open) markAllRead();
    };

    return <div className="notification-wrap">
        <button className="icon-btn notification-button" onClick={toggle} aria-label="Notifications" title="Notifications">
            <Bell size={18} />
            {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
        </button>
        {open && <div className="notification-panel">
            <div className="notification-head">
                <div>
                    <strong>Live notifications</strong>
                    <span className={`connection-pill ${orderConnection.status === "open" ? "online" : "offline"}`}>
                        {orderConnection.status === "open" ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {orderConnection.status === "open" ? "Connected" : "Reconnecting"}
                    </span>
                </div>
                <button className="icon-btn tiny-icon" onClick={clearNotifications} aria-label="Clear notifications"><X size={14} /></button>
            </div>
            {!notifications.length ? <div className="notification-empty">
                <Bell size={18} />
                <span>No new updates yet.</span>
            </div> : <div className="notification-list">
                {notifications.map((item) => <div className="notification-item" key={item.id}>
                    <span className="notification-dot">{item.type === "chat" ? <MessageCircle size={12} /> : <Check size={12} />}</span>
                    <div>
                        <strong>{item.title}</strong>
                        <p>{item.message}</p>
                        {item.orderId && <Link to={`/orders/${item.orderId}`} onClick={() => setOpen(false)}>View order</Link>}
                    </div>
                </div>)}
            </div>}
        </div>}
    </div>;
}
