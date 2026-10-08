export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
export const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
export const imageUrl = (value) => {
    if (!value)
        return "";
    if (/^https?:\/\//i.test(value))
        return value;
    return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
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
