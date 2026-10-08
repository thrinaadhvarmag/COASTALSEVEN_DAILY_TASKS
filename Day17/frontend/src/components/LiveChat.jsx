import { MessageCircle, Send, Wifi, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
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
            {messages.map((message) => (
                <div
                    className={`chat-bubble ${message.sender_id === currentUserId ? "mine" : "theirs"}`}
                    key={message.id || `${message.sender_id}-${message.created_at}-${message.text}`}
                >
                    <small>{message.sender_role === "admin" ? "Support" : customerName}</small>
                    <span>{message.text}</span>
                    <time>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
}

export function CustomerLiveChat() {
    const { user, token, isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const { unreadChat, markChatRead } = useRealtime();

    const loadHistory = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data } = await api.get(`/chat/${user.id}/messages`);
            setMessages(data.map(normalizeMessage));
        } catch {
            // The WebSocket can still be used if history is temporarily unavailable.
        }
    }, [user?.id]);

    const onMessage = useCallback((message) => {
        if (message?.event !== "chat_message") return;
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, normalizeMessage(message)]);
    }, []);

    const url = isAuthenticated && user && token ? chatUrl(user.id, token) : null;
    const connection = useWebSocket(url, { enabled: open && Boolean(url), onMessage });

    useEffect(() => {
        if (open) {
            loadHistory();
            markChatRead();
        }
    }, [open, loadHistory, markChatRead]);

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
                    <div>
                        <strong>Customer support</strong>
                        <span><span className={`chat-status-dot ${connection.status === "open" ? "online" : "offline"}`} />{connection.status === "open" ? "Connected" : "Connecting…"}</span>
                    </div>
                    <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat"><X size={17} /></button>
                </header>
                <ChatMessages messages={messages} currentUserId={user?.id} />
                <form className="chat-composer" onSubmit={sendMessage}>
                    <input className="input" value={draft} maxLength={1000} onChange={(e) => setDraft(e.target.value)} placeholder="Type your message…" aria-label="Message" />
                    <button className="btn-primary" disabled={connection.status !== "open" || !draft.trim()}><Send size={16} /></button>
                </form>
            </section>
        </div>}
    </>;
}

export function AdminLiveChat({ customerId, customerName = "Customer" }) {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const sectionRef = useRef(null);

    const loadHistory = useCallback(async () => {
        if (!customerId) return;
        try {
            const { data } = await api.get(`/chat/${customerId}/messages`);
            setMessages(data.map(normalizeMessage));
        } catch {
            setMessages([]);
        }
    }, [customerId]);

    const onMessage = useCallback((message) => {
        if (message?.event !== "chat_message") return;
        setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, normalizeMessage(message)]);
    }, []);

    const url = token && customerId ? chatUrl(customerId, token) : null;
    const connection = useWebSocket(url, { enabled: Boolean(url), onMessage });

    useEffect(() => {
        setDraft("");
        if (!customerId) {
            setMessages([]);
            return;
        }
        loadHistory();
        requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, [customerId, loadHistory]);

    const sendMessage = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || connection.status !== "open") return;
        if (connection.send({ type: "chat_message", text })) setDraft("");
    };

    if (!customerId) return <section ref={sectionRef} className="card admin-chat"><div className="section-title"><div><h2>Live customer chat</h2><p>Select an order below to open customer chat.</p></div></div></section>;

    return <section ref={sectionRef} className="card admin-chat" id="admin-live-chat">
        <div className="section-title">
            <div><h2>Live customer chat</h2><p>{customerName} · Customer #{customerId}</p></div>
            <span className="connection-pill online">{connection.status === "open" ? <><Wifi size={12} /> Live</> : <><WifiOff size={12} /> Connecting</>}</span>
        </div>
        <ChatMessages messages={messages} currentUserId={user?.id} customerName={customerName} />
        <form className="chat-composer" onSubmit={sendMessage}>
            <input className="input" value={draft} maxLength={1000} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to customer…" aria-label="Customer message" />
            <button className="btn-primary" disabled={connection.status !== "open" || !draft.trim()}><Send size={16} /></button>
        </form>
    </section>;
}
