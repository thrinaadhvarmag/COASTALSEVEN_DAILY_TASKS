import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";
import type { Product } from "../types/api";

const add = vi.fn().mockResolvedValue(undefined);
const show = vi.fn();

vi.mock("../hooks/useCart", () => ({
  useCart: () => ({ add, loading: false }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ show }),
}));

const product: Product = {
  id: 1,
  name: "Rebel Hoodie",
  description: "Black hoodie",
  price: 1499,
  stock: 4,
  image_url: null,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

describe("ProductCard", () => {
  beforeEach(() => {
    localStorage.clear();
    add.mockClear();
    show.mockClear();
  });

  it("renders typed product information and stock state", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Rebel Hoodie")).toBeInTheDocument();
    expect(screen.getByText("Only 4 left")).toBeInTheDocument();
    expect(screen.getByText(/₹1,499/)).toBeInTheDocument();
  });

  it("adds a product to the cart from a real user click", async () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(add).toHaveBeenCalledWith(1);
  });

  it("toggles wishlist state", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", { name: /wishlist/i });
    fireEvent.click(button);

    expect(JSON.parse(localStorage.getItem("rebel_mart_wishlist") || "[]")).toContain(1);
    expect(show).toHaveBeenCalledWith("Added to wishlist", "info");
  });
});
