const isLocalhost = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
);

export const API_URL = (
    import.meta.env.VITE_API_URL ||
    (isLocalhost ? "http://localhost:8000" : "https://rebel-mart-api.onrender.com")
).replace(/\/$/, "");
export const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
export const imageUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
    const clean = value.startsWith("/") ? value : `/${value}`;
    // Local public assets located in frontend (categories, events, logo, favicon)
    if (clean.startsWith("/categories/") || clean.startsWith("/events/") || clean.startsWith("/favicon") || clean.startsWith("/logo")) {
        return clean;
    }
    // Uploaded media stored on the backend server
    if (clean.startsWith("/uploads/")) {
        return `${API_URL}${clean}`;
    }
    return clean;
};
export const getErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail))
        return detail.map((x) => x.msg || x.message).join(", ");
    return detail || error?.message || "Something went wrong. Please try again.";
};
export const statusClasses = {
    PLACED: "status-placed", CONFIRMED: "status-confirmed", PROCESSING: "status-processing",
    SHIPPED: "status-shipped", DELIVERED: "status-delivered", CANCELLED: "status-cancelled",
};
export const statusLabel = (status = "") => status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
