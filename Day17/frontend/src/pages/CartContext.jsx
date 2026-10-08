import { useCart } from "../hooks/useCart";
// Kept as a compatibility layer for existing imports. Cart state now lives in Zustand.
export function CartProvider({ children }) {
    return children;
}
export { useCart };
