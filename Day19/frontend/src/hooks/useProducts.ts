import { useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import { useMemo } from "react";
import { productApi } from "../services/api";
import { queryClient } from "../lib/queryClient";
import type { Product } from "../types/api";
export const PRODUCTS_PAGE_SIZE = 20;
async function fetchProductsPage(search: string, page: number): Promise<Product[]> {
    return productApi.list({
        page,
        page_size: PRODUCTS_PAGE_SIZE,
        ...(search ? { search } : {}),
    });
}
export function useProductPage(search = "", page = 1) {
    return useQuery<Product[]>({
        queryKey: ["products", { search, page }],
        queryFn: () => fetchProductsPage(search, page),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });
}
export function useProducts(search = "", startPage = 1, enabled = false) {
    return useInfiniteQuery<Product[], Error, InfiniteData<Product[]>, readonly [
        string,
        {
            search: string;
            startPage: number;
        }
    ], number>({
        queryKey: ["products-infinite", { search, startPage }] as const,
        queryFn: async ({ pageParam = startPage }) => queryClient.ensureQueryData({
            queryKey: ["products", { search, page: pageParam }],
            queryFn: () => fetchProductsPage(search, pageParam),
            staleTime: 30000,
        }),
        initialPageParam: startPage,
        enabled,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => lastPage.length === PRODUCTS_PAGE_SIZE ? lastPageParam + 1 : undefined,
    });
}
export function useProductCount(search = "") {
    return useQuery<number>({
        queryKey: ["products-count", { search }],
        queryFn: async () => (await productApi.count(search)).total,
        staleTime: 60000,
    });
}
export function useProduct(productId: number | string | undefined) {
    const id = Number(productId);
    return useQuery<Product>({
        queryKey: ["product", id],
        queryFn: () => productApi.get(id),
        enabled: Number.isFinite(id) && id > 0,
        staleTime: 60000,
    });
}
export function useCatalogStats(products: Product[] = []) {
    return useMemo(() => ({
        count: products.length,
        inStock: products.filter((product) => Number(product.stock) > 0).length,
        outOfStock: products.filter((product) => Number(product.stock) <= 0).length,
    }), [products]);
}
