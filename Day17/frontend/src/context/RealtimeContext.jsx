import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { useToast } from "./ToastContext";

const RealtimeContext = createContext(null);
const MAX_NOTIFICATIONS = 30;

export function RealtimeProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [unreadChat, setUnreadChat] = useState(0);
    const { show } = useToast();

    const addNotification = useCallback((notification) => {
        setNotifications((items) => [notification, ...items].slice(0, MAX_NOTIFICATIONS));
        setUnread((count) => count + 1);
        if (notification.type === "chat") {
            setUnreadChat((count) => count + 1);
        }
        show(notification.message, "info");
    }, [show]);

    const markAllRead = useCallback(() => setUnread(0), []);
    const markChatRead = useCallback(() => setUnreadChat(0), []);
    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnread(0);
        setUnreadChat(0);
    }, []);

    const connection = useOrderRealtime({ onNotification: addNotification });
    const value = useMemo(() => ({
        notifications,
        unread,
        unreadChat,
        markAllRead,
        markChatRead,
        clearNotifications,
        orderConnection: connection,
    }), [clearNotifications, connection, markAllRead, markChatRead, notifications, unread, unreadChat]);

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
    const value = useContext(RealtimeContext);
    if (!value) throw new Error("useRealtime must be used inside RealtimeProvider");
    return value;
}
