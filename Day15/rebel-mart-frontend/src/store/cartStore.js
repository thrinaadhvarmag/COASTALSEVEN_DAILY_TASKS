import { create } from "zustand";

const getApi = () => import("../services/api").then((module) => module.default);

const normalizeItems = (items) => Array.isArray(items)
  ? items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) }))
  : [];

const replaceItem = (items, productId, quantity) => {
  const next = items.filter((item) => item.product_id !== Number(productId));
  if (quantity > 0) next.push({ product_id: Number(productId), quantity: Number(quantity) });
  return next;
};

export const useCartStore = create((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  refreshCart: async () => {
    if (!localStorage.getItem("rebel_mart_token")) {
      set({ items: [], initialized: true });
      return [];
    }
    set({ loading: true });
    try {
      const api = await getApi();
      const { data } = await api.get("/cart");
      const items = normalizeItems(data.items);
      set({ items, initialized: true });
      return items;
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  add: async (productId, quantity = 1) => {
    const previous = get().items;
    const current = previous.find((item) => item.product_id === Number(productId))?.quantity || 0;
    const optimistic = replaceItem(previous, productId, current + Number(quantity));
    set({ items: optimistic, loading: true });
    try {
      const api = await getApi();
      const { data } = await api.post("/cart/items", { product_id: productId, quantity });
      const items = normalizeItems(data.items);
      set({ items, initialized: true });
      return data;
    } catch (error) {
      set({ items: previous });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  update: async (productId, quantity) => {
    const previous = get().items;
    const optimistic = replaceItem(previous, productId, quantity);
    set({ items: optimistic });
    try {
      const api = await getApi();
      const { data } = await api.put(`/cart/items/${productId}`, { quantity });
      const items = normalizeItems(data.items);
      set({ items, initialized: true });
      return data;
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },

  remove: async (productId) => {
    const previous = get().items;
    set({ items: previous.filter((item) => item.product_id !== Number(productId)) });
    try {
      const api = await getApi();
      const { data } = await api.delete(`/cart/items/${productId}`);
      const items = normalizeItems(data.items);
      set({ items, initialized: true });
      return data;
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },

  clear: async () => {
    const previous = get().items;
    set({ items: [] });
    try {
      const api = await getApi();
      await api.delete("/cart");
      set({ items: [], initialized: true });
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },

  reset: () => set({ items: [], loading: false, initialized: false }),
}));
