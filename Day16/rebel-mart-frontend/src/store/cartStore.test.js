import { beforeEach, describe, expect, it, vi } from 'vitest';
const { api } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../services/api', () => ({ default: api }));
import { useCartStore } from './cartStore';
const cartResponse = (items) => ({ data: { items } });
beforeEach(() => {
  localStorage.clear();
  useCartStore.getState().reset();
  vi.clearAllMocks();
});
describe('Zustand cart store', () => {
  it('starts with an empty cart', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });
  it('clears the cart immediately when no auth token exists', async () => {
    await useCartStore.getState().refreshCart();
    expect(useCartStore.getState().items).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });
  it('refreshes cart data from the API', async () => {
    localStorage.setItem('rebel_mart_token', 'token');
    api.get.mockResolvedValueOnce(cartResponse([{ product_id: '4', quantity: '2' }]));
    await useCartStore.getState().refreshCart();
    expect(api.get).toHaveBeenCalledWith('/cart');
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 2 }]);
  });
  it('optimistically adds an item and keeps the server response', async () => {
    api.post.mockResolvedValueOnce(cartResponse([{ product_id: 4, quantity: 3 }]));
    await useCartStore.getState().add(4, 3);
    expect(api.post).toHaveBeenCalledWith('/cart/items', { product_id: 4, quantity: 3 });
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 3 }]);
  });
  it('increments an existing cart item when adding again', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.post.mockResolvedValueOnce(cartResponse([{ product_id: 4, quantity: 5 }]));
    await useCartStore.getState().add(4, 3);
    expect(api.post).toHaveBeenCalledWith('/cart/items', { product_id: 4, quantity: 3 });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });
  it('rolls back an add when the API fails', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.post.mockRejectedValueOnce(new Error('network'));
    await expect(useCartStore.getState().add(4, 1)).rejects.toThrow('network');
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 2 }]);
  });
  it('updates an item quantity', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.put.mockResolvedValueOnce(cartResponse([{ product_id: 4, quantity: 7 }]));
    await useCartStore.getState().update(4, 7);
    expect(api.put).toHaveBeenCalledWith('/cart/items/4', { quantity: 7 });
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 7 }]);
  });
  it('rolls back an update when the API fails', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.put.mockRejectedValueOnce(new Error('network'));
    await expect(useCartStore.getState().update(4, 7)).rejects.toThrow('network');
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 2 }]);
  });
  it('removes an item', async () => {
    useCartStore.setState({
      items: [
        { product_id: 4, quantity: 2 },
        { product_id: 8, quantity: 1 },
      ],
    });
    api.delete.mockResolvedValueOnce(cartResponse([{ product_id: 8, quantity: 1 }]));
    await useCartStore.getState().remove(4);
    expect(api.delete).toHaveBeenCalledWith('/cart/items/4');
    expect(useCartStore.getState().items).toEqual([{ product_id: 8, quantity: 1 }]);
  });
  it('rolls back a removal when the API fails', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.delete.mockRejectedValueOnce(new Error('network'));
    await expect(useCartStore.getState().remove(4)).rejects.toThrow('network');
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 2 }]);
  });
  it('clears all server cart items', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.delete.mockResolvedValueOnce({});
    await useCartStore.getState().clear();
    expect(api.delete).toHaveBeenCalledWith('/cart');
    expect(useCartStore.getState().items).toEqual([]);
  });
  it('rolls back clear when the server rejects it', async () => {
    useCartStore.setState({ items: [{ product_id: 4, quantity: 2 }] });
    api.delete.mockRejectedValueOnce(new Error('network'));
    await expect(useCartStore.getState().clear()).rejects.toThrow('network');
    expect(useCartStore.getState().items).toEqual([{ product_id: 4, quantity: 2 }]);
  });
});
