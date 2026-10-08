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
            const { data } = await api.get("/orders/admin/all", { params: { page: 1, page_size: 100 } });
            return Array.isArray(data) ? data : data.items || [];
        },
        staleTime: 15000,
    });
}
