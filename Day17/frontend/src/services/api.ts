import axios, { type AxiosError, type AxiosInstance } from "axios";
import { API_URL } from "../lib/constants";
import type { ApiErrorBody, CartResponse, LoginRequest, Product, ProductCountResponse, ProductCreateRequest, ProductQuery, ProductUpdateRequest, RegisterRequest, TokenResponse, User, } from "../types/api";
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
    login: async (payload: LoginRequest): Promise<TokenResponse> => {
        const { data } = await api.post<TokenResponse>("/auth/login", payload);
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
export default api;
