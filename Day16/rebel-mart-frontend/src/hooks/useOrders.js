import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { page: 1, page_size: 50 } });
      return Array.isArray(data) ? data : data.items || [];
    },
    staleTime: 15000,
  });
}
export function useOrder(orderId) {
  return useQuery({
    queryKey: ['order', Number(orderId)],
    queryFn: async () => (await api.get(`/orders/${orderId}`)).data,
    enabled: Boolean(orderId),
    staleTime: 15000,
  });
}
