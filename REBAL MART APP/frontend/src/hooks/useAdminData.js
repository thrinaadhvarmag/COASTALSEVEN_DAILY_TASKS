import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export function useAdminProducts() {
    return useQuery({
        queryKey: ["admin-products"],
        queryFn: async () => {
            const { data } = await api.get("/products", { params: { page: 1, page_size: 100 } });
            return Array.isArray(data) ? data : data.items || [];
        },
        staleTime: 15000,
    });
}

export function useAdminOrders() {
    return useQuery({
        queryKey: ["admin-orders"],
        queryFn: async () => {
            try {
                const { data } = await api.get("/orders/admin");
                return Array.isArray(data) ? data : (data.items || []);
            } catch {
                const { data } = await api.get("/orders/admin/all");
                return Array.isArray(data) ? data : (data.items || []);
            }
        },
        staleTime: 10000,
    });
}

export function useAdminCustomers() {
    return useQuery({
        queryKey: ["admin-chat-customers"],
        queryFn: async () => {
            try {
                const { data } = await api.get("/chat/admin/customers");
                return Array.isArray(data) ? data : [];
            } catch {
                return [];
            }
        },
        staleTime: 20000,
    });
}
