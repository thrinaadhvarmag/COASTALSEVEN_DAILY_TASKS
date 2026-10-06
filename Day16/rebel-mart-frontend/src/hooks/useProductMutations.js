import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

function updateProductInValue(value, productId, updater) {
  if (Array.isArray(value)) {
    return value.map((product) => Number(product.id) === Number(productId) ? updater(product) : product);
  }
  if (value?.pages) {
    return {
      ...value,
      pages: value.pages.map((page) => updateProductInValue(page, productId, updater)),
    };
  }
  return value;
}

function removeProductFromValue(value, productId) {
  if (Array.isArray(value)) {
    return value.filter((product) => Number(product.id) !== Number(productId));
  }
  if (value?.pages) {
    return {
      ...value,
      pages: value.pages.map((page) => removeProductFromValue(page, productId)),
    };
  }
  return value;
}

function snapshotProductQueries(queryClient) {
  return [
    ...queryClient.getQueriesData({ queryKey: ["admin-products"] }),
    ...queryClient.getQueriesData({ queryKey: ["products"] }),
    ...queryClient.getQueriesData({ queryKey: ["products-infinite"] }),
    ...queryClient.getQueriesData({ queryKey: ["product"] }),
  ];
}

function restoreSnapshots(queryClient, snapshots) {
  snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
}

function updateAllProductCaches(queryClient, productId, updater) {
  queryClient.setQueriesData({ queryKey: ["admin-products"] }, (value) => updateProductInValue(value, productId, updater));
  queryClient.setQueriesData({ queryKey: ["products"] }, (value) => updateProductInValue(value, productId, updater));
  queryClient.setQueriesData({ queryKey: ["products-infinite"] }, (value) => updateProductInValue(value, productId, updater));
  queryClient.setQueryData(["product", Number(productId)], (value) => value ? updater(value) : value);
}

function removeFromAllProductCaches(queryClient, productId) {
  queryClient.setQueriesData({ queryKey: ["admin-products"] }, (value) => removeProductFromValue(value, productId));
  queryClient.setQueriesData({ queryKey: ["products"] }, (value) => removeProductFromValue(value, productId));
  queryClient.setQueriesData({ queryKey: ["products-infinite"] }, (value) => removeProductFromValue(value, productId));
  queryClient.removeQueries({ queryKey: ["product", Number(productId)] });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, payload }) =>
      (await api.put(`/products/${productId}`, payload)).data,
    onMutate: async ({ productId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const snapshots = snapshotProductQueries(queryClient);
      updateAllProductCaches(queryClient, productId, (product) => ({ ...product, ...payload }));
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshots) restoreSnapshots(queryClient, context.snapshots);
    },
    onSuccess: (product) => {
      updateAllProductCaches(queryClient, product.id, () => product);
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/products/${productId}`);
      return productId;
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const snapshots = snapshotProductQueries(queryClient);
      removeFromAllProductCaches(queryClient, productId);
      return { snapshots };
    },
    onError: (_error, _productId, context) => {
      if (context?.snapshots) restoreSnapshots(queryClient, context.snapshots);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
    },
  });
}
