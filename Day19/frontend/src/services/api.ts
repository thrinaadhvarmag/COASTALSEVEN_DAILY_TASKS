import axios, { type AxiosError, type AxiosInstance } from "axios";
import { API_URL } from "../lib/constants";
import type { ApiErrorBody, CartResponse, LoginRequest, Product, ProductCountResponse, ProductCreateRequest, ProductQuery, ProductUpdateRequest, RegisterRequest, TokenResponse, User, LoginOTPRequiredResponse, VerifyLoginOTPRequest, } from "../types/api";
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 20000,
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("rebel_mart_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use((response) => response, (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("rebel_mart_token");
        localStorage.removeItem("rebel_mart_user");
        window.dispatchEvent(new Event("rebel-auth-expired"));
    }
    return Promise.reject(error);
});
/** Typed API boundary: React code consumes domain types instead of unknown JSON. */
export const productApi = {
    list: async (params: ProductQuery): Promise<Product[]> => {
        const { data } = await api.get<Product[]>("/products", { params });
        return data;
    },
    count: async (search?: string): Promise<ProductCountResponse> => {
        const { data } = await api.get<ProductCountResponse>("/products/count", {
            params: search ? { search } : {},
        });
        return data;
    },
    get: async (productId: number): Promise<Product> => {
        const { data } = await api.get<Product>(`/products/${productId}`);
        return data;
    },
    create: async (payload: ProductCreateRequest): Promise<Product> => {
        const { data } = await api.post<Product>("/products", payload);
        return data;
    },
    update: async (productId: number, payload: ProductUpdateRequest): Promise<Product> => {
        const { data } = await api.put<Product>(`/products/${productId}`, payload);
        return data;
    },
};
export const authApi = {
    login: async (payload: LoginRequest): Promise<LoginOTPRequiredResponse> => {
        const { data } = await api.post<LoginOTPRequiredResponse>("/auth/login", payload);
        return data;
    },
    verifyLoginOTP: async (payload: VerifyLoginOTPRequest): Promise<TokenResponse> => {
        const { data } = await api.post<TokenResponse>("/auth/login/verify", payload);
        return data;
    },
    resendLoginOTP: async (email: string): Promise<LoginOTPRequiredResponse> => {
        const { data } = await api.post<LoginOTPRequiredResponse>("/auth/login/resend", { email });
        return data;
    },
    register: async (payload: RegisterRequest): Promise<User> => {
        const { data } = await api.post<User>("/auth/register", payload);
        return data;
    },
    me: async (): Promise<User> => {
        const { data } = await api.get<User>("/auth/me");
        return data;
    },
};
export const cartApi = {
    get: async (): Promise<CartResponse> => {
        const { data } = await api.get<CartResponse>("/cart");
        return data;
    },
};

export const backgroundApi = {
    startInvoice: async (orderId: number): Promise<{ task_id: string }> => {
        const { data } = await api.post<{ task_id: string }>(`/background/invoices/${orderId}`);
        return data;
    },
    startBulkInvoices: async (): Promise<{ task_id: string }> => {
        const { data } = await api.post<{ task_id: string }>("/background/invoices/bulk");
        return data;
    },
    importProducts: async (file: File): Promise<{ task_id: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post<{ task_id: string }>("/background/imports/products", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },
    status: async (taskId: string) => {
        const { data } = await api.get(`/background/tasks/${taskId}`);
        return data;
    },
    downloadInvoice: async (filename: string): Promise<Blob> => {
        const { data } = await api.get(`/background/invoices/${encodeURIComponent(filename)}`, {
            responseType: "blob",
        });
        return data;
    },
    downloadBulkInvoices: async (filename: string): Promise<Blob> => {
        const { data } = await api.get(`/background/invoices/bulk/${encodeURIComponent(filename)}`, {
            responseType: "blob",
        });
        return data;
    },
};

export default api;
