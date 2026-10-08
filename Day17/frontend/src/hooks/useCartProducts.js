import { useQueries } from "@tanstack/react-query";
import api from "../services/api";
export function useCartProducts(items) {
    const queries = useQueries({
        queries: items.map((item) => ({
            queryKey: ["product", Number(item.product_id)],
            queryFn: async () => (await api.get(`/products/${item.product_id}`)).data,
            staleTime: 60000,
        })),
    });
    const products = Object.fromEntries(items.map((item, index) => [Number(item.product_id), queries[index]?.data || null]));
    return {
        products,
        loading: queries.some((query) => query.isLoading),
        error: queries.find((query) => query.error)?.error || null,
    };
}
