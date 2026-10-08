import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/constants";
import { useWebSocket } from "./useWebSocket";

const toWebSocketUrl = (baseUrl, path) => {
    const protocol = baseUrl.startsWith("https://") ? "wss" : "ws";
    return `${protocol}://${baseUrl.replace(/^https?:\/\//, "")}${path}`;
};

export function useOrderRealtime({ onNotification } = {}) {
    const { user, token, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const handleMessage = useCallback((message) => {
        if (!message || typeof message !== "object") return;

        if (message.event === "chat_notification") {
            const messageId = Number(message.message_id);
            const text = String(message.text || "").trim();
            if (!messageId || !text) return;

            onNotification?.({
                id: `chat-${messageId}`,
                type: "chat",
                title: "New support message",
                message: text,
                createdAt: Date.now(),
            });
            return;
        }

        if (message.event !== "order_status_update") return;

        const orderId = Number(message.order_id);
        const status = String(message.status || "");
        if (!orderId || !status) return;

        queryClient.setQueryData(["order", orderId], (current) =>
            current ? { ...current, status, updated_at: new Date().toISOString() } : current,
        );
        queryClient.setQueryData(["orders"], (current) =>
            Array.isArray(current)
                ? current.map((order) => order.id === orderId ? { ...order, status } : order)
                : current,
        );
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

        onNotification?.({
            id: `${orderId}-${status}-${Date.now()}`,
            type: "order",
            title: `Order #${orderId} updated`,
            message: `Your order is now ${status.toLowerCase().replace(/_/g, " ")}.`,
            orderId,
            createdAt: Date.now(),
        });
    }, [onNotification, queryClient]);

    const url = isAuthenticated && user && token
        ? toWebSocketUrl(API_URL, `/ws/orders/${user.id}?token=${encodeURIComponent(token)}`)
        : null;

    return useWebSocket(url, {
        enabled: Boolean(url),
        onMessage: handleMessage,
    });
}
