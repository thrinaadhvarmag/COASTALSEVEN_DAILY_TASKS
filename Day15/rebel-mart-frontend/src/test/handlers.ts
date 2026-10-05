import { http, HttpResponse } from "msw";

const product = {
  id: 101,
  name: "Rebel T-Shirt",
  description: "Official Rebel Mart merchandise",
  price: 799,
  stock: 12,
  image_url: null,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

export const handlers = [
  http.get("http://localhost:8000/products", () =>
    HttpResponse.json([product]),
  ),
  http.get("http://localhost:8000/products/count", () =>
    HttpResponse.json({ total: 1 }),
  ),
];
