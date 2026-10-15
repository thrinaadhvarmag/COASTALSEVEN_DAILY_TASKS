import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Checkout from "./Checkout";
const { refreshCart, clear, show, navigate, post } = vi.hoisted(() => ({
    refreshCart: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    show: vi.fn(),
    navigate: vi.fn(),
    post: vi.fn(),
}));
vi.mock("../hooks/useCart", () => ({ useCart: () => ({ items: [{ product_id: 1, quantity: 2 }], clear, refreshCart }) }));
vi.mock("../hooks/useCartProducts", () => ({ useCartProducts: () => ({ products: { 1: { id: 1, name: "Rebel Hoodie", price: 1499, image_url: null } } }) }));
vi.mock("../context/ToastContext", () => ({ useToast: () => ({ show }) }));
vi.mock("../services/api", () => ({ default: { post } }));
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => navigate };
});
function renderCheckout() {
    return render(<MemoryRouter>
    <Checkout />
</MemoryRouter>);
}
beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({ data: { id: 55 } });
    refreshCart.mockResolvedValue([]);
    clear.mockResolvedValue(undefined);
});
describe("Checkout with React Hook Form and Zod", () => {
    it("renders checkout fields and order summary", async () => {
        renderCheckout();
        expect(await screen.findByRole("heading", { name: "Delivery details" })).toBeInTheDocument();
        expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
        expect(screen.getByText("Rebel Hoodie")).toBeInTheDocument();
        expect(screen.getAllByText(/₹2,998/).length).toBeGreaterThan(0);
    });
    it("blocks submission when required fields are invalid", async () => {
        const user = userEvent.setup();
        renderCheckout();
        await screen.findByRole("heading", { name: "Delivery details" });
        await user.click(screen.getByRole("button", { name: /Place order securely/i }));
        expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
        expect(post).not.toHaveBeenCalled();
    });
    it("submits a validated checkout payload", async () => {
        const user = userEvent.setup();
        renderCheckout();
        await screen.findByRole("heading", { name: "Delivery details" });
        await user.type(screen.getByPlaceholderText("Your full name"), "Test Customer");
        await user.type(screen.getByPlaceholderText("9876543210"), "9876543210");
        await user.type(screen.getByPlaceholderText("House/flat number, street, area"), "12 Main Street");
        await user.type(screen.getByPlaceholderText("City"), "Ongole");
        await user.type(screen.getByPlaceholderText("State"), "Andhra Pradesh");
        await user.type(screen.getByPlaceholderText("6-digit pincode"), "523001");
        await user.click(screen.getByRole("button", { name: /Place order securely/i }));
        await waitFor(() => expect(post).toHaveBeenCalledWith("/orders", expect.objectContaining({ customer_name: "Test Customer", phone: "9876543210", pincode: "523001" })));
    });
    it("clears the cart after a successful order", async () => {
        const user = userEvent.setup();
        renderCheckout();
        await screen.findByRole("heading", { name: "Delivery details" });
        for (const [placeholder, value] of [["Your full name", "Test Customer"], ["9876543210", "9876543210"], ["House/flat number, street, area", "12 Main Street"], ["City", "Ongole"], ["State", "Andhra Pradesh"], ["6-digit pincode", "523001"]]) {
            await user.type(screen.getByPlaceholderText(placeholder), value);
        }
        await user.click(screen.getByRole("button", { name: /Place order securely/i }));
        await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
        expect(navigate).toHaveBeenCalledWith("/orders/55");
    });
});
