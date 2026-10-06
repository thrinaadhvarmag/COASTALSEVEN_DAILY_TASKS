import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeAll, afterAll, afterEach, describe, expect, it } from 'vitest';
import { server } from '../test/server';
import { useProductPage, useProductCount } from './useProducts';
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('typed product hooks + MSW', () => {
  it('loads products from a mocked API response', async () => {
    const { result } = renderHook(() => useProductPage('', 1), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].name).toBe('Rebel T-Shirt');
    expect(result.current.data?.[0].stock).toBe(12);
  });
  it('loads the typed product count', async () => {
    const { result } = renderHook(() => useProductCount('Rebel'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(1);
  });
});
