/** Prabhas Birthday Season Sale pricing shared by catalogue, cart and checkout. */
export const BIRTHDAY_SALE_PERCENT = 23;
export const BIRTHDAY_SALE_RATE = BIRTHDAY_SALE_PERCENT / 100;
export function salePrice(price: number | string | null | undefined): number {
  const original = Number(price || 0);
  return Math.max(0, Number((original * (1 - BIRTHDAY_SALE_RATE)).toFixed(2)));
}
export function saleSavings(price: number | string | null | undefined): number {
  return Math.max(0, Number((Number(price || 0) - salePrice(price)).toFixed(2)));
}
