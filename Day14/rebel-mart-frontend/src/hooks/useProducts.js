import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "../services/api";
import { queryClient } from "../lib/queryClient";

export const PRODUCTS_PAGE_SIZE = 20;

async function fetchProductsPage({ page, search }) {
  const { data } = await api.get("/products", {
    params: {
      page,
      page_size: PRODUCTS_PAGE_SIZE,
      ...(search ? { search } : {}),
    },
  });
  return Array.isArray(data) ? data : data.items || [];
}

/**
 * Server-state hook for the catalog. Every page is cached independently by
 * TanStack Query, so page navigation can reuse data that was already fetched.
 */
export function useProductPage(search = "", page = 1) {
  return useQuery({
    queryKey: ["products", { search, page }],
    queryFn: () => fetchProductsPage({ page, search }),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

/**
 * Infinite-query hook used by the customer-controlled Load More experience.
 * It starts at the currently selected page and appends one server page at a
 * time. ensureQueryData reuses a page-query cache entry when one already exists.
 */
export function useProducts(search = "", startPage = 1, enabled = false) {
  return useInfiniteQuery({
    queryKey: ["products-infinite", { search, startPage }],
    queryFn: async ({ pageParam = startPage }) =>
      queryClient.ensureQueryData({
        queryKey: ["products", { search, page: pageParam }],
        queryFn: () => fetchProductsPage({ page: pageParam, search }),
        staleTime: 30_000,
      }),
    initialPageParam: startPage,
    enabled,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PRODUCTS_PAGE_SIZE ? lastPageParam + 1 : undefined,
  });
}

export function useProductCount(search = "") {
  return useQuery({
    queryKey: ["products-count", { search }],
    queryFn: async () => {
      const { data } = await api.get("/products/count", {
        params: search ? { search } : {},
      });
      return Number(data.total || 0);
    },
    staleTime: 60_000,
  });
}

export function useProduct(productId) {
  return useQuery({
    queryKey: ["product", Number(productId)],
    queryFn: async () => (await api.get(`/products/${productId}`)).data,
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

/** Small reusable calculation hook demonstrating memoized derived server data. */
export function useCatalogStats(products = []) {
  return useMemo(() => ({
    count: products.length,
    inStock: products.filter((product) => Number(product.stock) > 0).length,
    outOfStock: products.filter((product) => Number(product.stock) <= 0).length,
  }), [products]);
}
