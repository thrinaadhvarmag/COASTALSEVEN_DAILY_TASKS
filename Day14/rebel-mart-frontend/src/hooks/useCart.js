import { useCartStore } from "../store/cartStore";

export function useCart() {
  const items = useCartStore((state) => state.items);
  const loading = useCartStore((state) => state.loading);
  const initialized = useCartStore((state) => state.initialized);
  const refreshCart = useCartStore((state) => state.refreshCart);
  const add = useCartStore((state) => state.add);
  const update = useCartStore((state) => state.update);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return { items, loading, initialized, count, refreshCart, add, update, remove, clear };
}
