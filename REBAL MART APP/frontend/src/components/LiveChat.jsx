import { MessageCircle, Send, Wifi, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useRealtime } from "../context/RealtimeContext";
import api from "../services/api";
import { API_URL } from "../lib/constants";
import { useWebSocket } from "../hooks/useWebSocket";

const chatUrl = (customerId, token) => {
    const protocol = API_URL.startsWith("https://") ? "wss" : "ws";
    return `${protocol}://${API_URL.replace(/^https?:\/\//, "")}/ws/chat/${customerId}?token=${encodeURIComponent(token)}`;
};

const normalizeMessage = (message) => ({
    ...message,
    created_at: message.created_at || new Date().toISOString(),
});

function ChatMessages({ messages, currentUserId, customerName = "Customer" }) {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    return (
        <div className="chat-messages compact" aria-live="polite">
            {!messages.length && (
                <div className="chat-empty">
                    <MessageCircle size={20} />
                    <span>No messages yet. Start the conversation.</span>
                </div>
            )}
            {messages.map((message) => {
                const isMine = message.sender_id === currentUserId;
                return (
                    <div
                        className={`chat-bubble ${isMine ? "mine" : "theirs"}`}
                        key={message.id || `${message.sender_id}-${message.created_at}-${message.text}`}
                    >
                        <div className="chat-bubble-header">
                            <small className="chat-bubble-sender">
                                {isMine ? "You" : (message.sender_role === "admin" ? "Rebel Support" : customerName)}
                            </small>
                        </div>
                        <p className="chat-bubble-text">{message.text}</p>
                        <time className="chat-bubble-time">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </time>
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>
    );
}

export function CustomerLiveChat() {
    const { user, token, isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const realtime = useRealtime();
    const unreadChat = realtime?.unreadChat ?? 0;
    const markChatRead = realtime?.markChatRead;

    const onMessage = useCallback((message) => {
        if (message?.event !== "chat_message") return;
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, normalizeMessage(message)]);
    }, []);

    const url = isAuthenticated && user && token ? chatUrl(user.id, token) : null;
    const connection = useWebSocket(url, { enabled: open && Boolean(url), onMessage });

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const fetchHistory = async () => {
            if (!user?.id) return;
            try {
                const { data } = await api.get(`/chat/${user.id}/messages`);
                if (!cancelled) setMessages(data.map(normalizeMessage));
            } catch {
                // The WebSocket can still be used if history is temporarily unavailable.
            }
        };
        void fetchHistory();
        if (typeof markChatRead === "function") {
            markChatRead();
        }
        return () => { cancelled = true; };
    }, [open, user, markChatRead]);

    const sendMessage = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || connection.status !== "open") return;
        if (connection.send({ type: "chat_message", text })) setDraft("");
    };

    return <>
        <button className="live-chat-fab" onClick={() => setOpen(true)} aria-label="Open live support chat" title="Live support">
            <MessageCircle size={19} />
            <span>Live support</span>
            {unreadChat > 0 && (
                <span className="live-chat-unread-badge" aria-label={`${unreadChat} unread chat messages`}>
                    {unreadChat > 99 ? "99+" : unreadChat}
                </span>
            )}
        </button>
        {open && <div className="chat-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <section className="chat-panel card" aria-label="Live customer support">
                <header className="chat-header">
                    <div className="chat-header-info">
                        <strong>Live Customer Support</strong>
                        <div className="chat-connection-status">
                            <span className={`chat-status-dot ${connection.status === "open" ? "online" : "offline"}`} />
                            <span>{connection.status === "open" ? "Online · Support Team Ready" : "Connecting…"}</span>
                        </div>
                    </div>
                    <button className="icon-btn chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat"><X size={17} /></button>
                </header>
                {isAuthenticated ? (
                    <>
                        <ChatMessages messages={messages} currentUserId={user?.id} />
                        <form className="chat-composer" onSubmit={sendMessage}>
                            <input className="input" value={draft} maxLength={1000} onChange={(e) => setDraft(e.target.value)} placeholder="Type your message…" aria-label="Message" />
                            <button className="btn-primary" disabled={connection.status !== "open" || !draft.trim()}><Send size={16} /></button>
                        </form>
                    </>
                ) : (
                    <div style={{ padding: "36px 20px", textAlign: "center", display: "grid", gap: "12px", placeItems: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--accent-glow)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                            <MessageCircle size={24} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--text-heading)" }}>Live Customer Support</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                            Sign in with your account to chat live with the Rebel Mart store support team.
                        </p>
                        <Link to="/login" className="btn-primary small" onClick={() => setOpen(false)} style={{ marginTop: "6px" }}>
                            Sign in to Chat
                        </Link>
                    </div>
                )}
            </section>
        </div>}
    </>;
}

export function AdminLiveChat({ customerId: initialCustomerId, customerName: initialCustomerName = "Customer", customers = [] }) {
    const { token } = useAuth();
    const [selected, setSelected] = useState(initialCustomerId ? {
        id: Number(initialCustomerId),
        name: initialCustomerName || `Customer #${initialCustomerId}`,
    } : null);
    const [incoming, setIncoming] = useState([]);
    const [unreadByCustomer, setUnreadByCustomer] = useState({});
    const { show } = useToast();

    useEffect(() => {
        if (!initialCustomerId) return;
        setSelected({ id: Number(initialCustomerId), name: initialCustomerName || `Customer #${initialCustomerId}` });
    }, [initialCustomerId, initialCustomerName]);

    const onAdminNotification = useCallback((message) => {
        if (message?.event !== "chat_notification") return;
        const id = Number(message.customer_id);
        if (!id) return;
        const customer = {
            id,
            name: message.customer_name || customers.find((item) => Number(item.id) === id)?.name || `Customer #${id}`,
        };
        setIncoming((items) => {
            const existing = items.find((item) => item.id === id);
            return existing
                ? items.map((item) => item.id === id ? { ...item, ...customer, preview: message.text || item.preview, timestamp: message.created_at || new Date().toISOString() } : item)
                : [{ ...customer, preview: message.text || "New message", timestamp: message.created_at || new Date().toISOString() }, ...items];
        });
        setUnreadByCustomer((items) => selected?.id === id ? items : { ...items, [id]: (items[id] || 0) + 1 });
        if (selected?.id !== id) show(`New customer message from ${customer.name}`, "info");
        if ("Notification" in window && Notification.permission === "granted") {
            try { new Notification(`Rebel Mart · ${customer.name}`, { body: String(message.text || "New message").slice(0, 100), tag: `admin-chat-${message.message_id}` }); } catch { /* Browser notifications may be unavailable. */ }
        }
    }, [customers, selected?.id, show]);

    const adminSocketUrl = token
        ? `${API_URL.startsWith("https://") ? "wss" : "ws"}://${API_URL.replace(/^https?:\/\//, "")}/ws/admin/chat?token=${encodeURIComponent(token)}`
        : null;
    const adminConnection = useWebSocket(adminSocketUrl, { enabled: Boolean(token), onMessage: onAdminNotification });

    const conversations = useMemo(() => {
        const map = new Map();
        customers.forEach((customer) => map.set(Number(customer.id), customer));
        incoming.forEach((customer) => map.set(Number(customer.id), { ...map.get(Number(customer.id)), ...customer }));
        if (selected?.id && !map.has(Number(selected.id))) map.set(Number(selected.id), selected);
        return [...map.values()].sort((a, b) => {
            const aTime = incoming.find((item) => item.id === Number(a.id))?.timestamp || "";
            const bTime = incoming.find((item) => item.id === Number(b.id))?.timestamp || "";
            return bTime.localeCompare(aTime);
        });
    }, [customers, incoming, selected]);

    const chooseCustomer = (customer) => {
        setSelected({ id: Number(customer.id), name: customer.name || `Customer #${customer.id}` });
        setUnreadByCustomer((items) => ({ ...items, [customer.id]: 0 }));
    };

    return <section className="admin-chat-workspace">
        <div className="admin-chat-toolbar">
            <div>
                <div className="eyebrow">Customer care</div>
                <h2>Customer conversations</h2>
                <p>Read incoming messages and reply without leaving this page.</p>
            </div>
            <span className={`connection-pill ${adminConnection.status === "open" ? "online" : "offline"}`}>
                {adminConnection.status === "open" ? <><Wifi size={12} /> Notifications live</> : <><WifiOff size={12} /> Reconnecting</>}
            </span>
        </div>
        <div className="admin-chat-workspace-grid">
            <aside className="admin-conversation-list" aria-label="Customer conversations">
                <div className="admin-conversation-list-heading">
                    <strong>Inbox</strong>
                    <span>{conversations.length}</span>
                </div>
                {!conversations.length && <div className="admin-conversation-empty"><MessageCircle size={22}/><strong>No customer conversations yet</strong><span>Customers who place an order or send a message will appear here.</span></div>}
                {conversations.map((customer) => {
                    const unreadCount = unreadByCustomer[customer.id] || 0;
                    const preview = incoming.find((item) => item.id === Number(customer.id))?.preview;
                    return <button
                        type="button"
                        key={customer.id}
                        className={`admin-conversation-item ${selected?.id === Number(customer.id) ? "selected" : ""}`}
                        onClick={() => chooseCustomer(customer)}
                    >
                        <span className="admin-conversation-avatar">{(customer.name || "C").slice(0, 1).toUpperCase()}</span>
                        <span className="admin-conversation-copy">
                            <strong>{customer.name || `Customer #${customer.id}`}</strong>
                            <small>{preview || (customer.lastOrderId ? `Order #${customer.lastOrderId}` : "Open conversation")}</small>
                        </span>
                        {unreadCount > 0 && <span className="admin-conversation-unread">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                    </button>;
                })}
            </aside>
            <div className="admin-conversation-panel">
                {selected ? <AdminLiveChatPanel key={selected.id} customerId={selected.id} customerName={selected.name} /> : (
                    <div className="admin-chat-welcome">
                        <MessageCircle size={32}/>
                        <h3>Select a conversation</h3>
                        <p>Choose a customer from the inbox to view the message history and reply directly.</p>
                    </div>
                )}
            </div>
        </div>
    </section>;
}

function AdminLiveChatPanel({ customerId, customerName = "Customer" }) {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const sectionRef = useRef(null);

    const onMessage = useCallback((message) => {
        if (message?.event !== "chat_message") return;
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, normalizeMessage(message)]);
    }, []);

    const url = token && customerId ? chatUrl(customerId, token) : null;
    const connection = useWebSocket(url, { enabled: Boolean(url), onMessage });

    useEffect(() => {
        if (!customerId) return undefined;
        let cancelled = false;
        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/chat/${customerId}/messages`);
                if (!cancelled) setMessages(data.map(normalizeMessage));
            } catch {
                if (!cancelled) setMessages([]);
            }
        };
        void fetchHistory();
        return () => { cancelled = true; };
    }, [customerId]);

    const sendMessage = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || connection.status !== "open") return;
        if (connection.send({ type: "chat_message", text })) setDraft("");
    };

    return <section ref={sectionRef} className="card admin-chat" id="admin-live-chat">
        <div className="section-title">
            <div><h2>{customerName}</h2><p>Customer #{customerId} · Direct support conversation</p></div>
            <span className={`connection-pill ${connection.status === "open" ? "online" : "offline"}`}>{connection.status === "open" ? <><Wifi size={12} /> Live</> : <><WifiOff size={12} /> Connecting</>}</span>
        </div>
        <ChatMessages messages={messages} currentUserId={user?.id} customerName={customerName} />
        <form className="chat-composer" onSubmit={sendMessage}>
            <input className="input" value={draft} maxLength={1000} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${customerName}…`} aria-label="Customer message" />
            <button className="btn-primary" disabled={connection.status !== "open" || !draft.trim()}><Send size={16} /> Reply</button>
        </form>
    </section>;
}
