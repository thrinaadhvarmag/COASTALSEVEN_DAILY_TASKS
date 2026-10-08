export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}
export interface ProductCreateRequest {
    name: string;
    description?: string | null;
    price: number;
    stock: number;
}
export interface ProductUpdateRequest {
    name?: string;
    description?: string | null;
    price?: number;
    stock?: number;
}
export interface ProductQuery {
    page: number;
    page_size: number;
    search?: string;
}
export interface ProductCountResponse {
    total: number;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface TokenResponse {
    access_token: string;
    token_type: string;
}
export interface LoginOTPRequiredResponse {
    otp_required: boolean;
    message: string;
    email: string;
    task_id: string | null;
}
export interface VerifyLoginOTPRequest {
    email: string;
    otp: string;
}
export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    profile_image_url: string | null;
    email_verified: boolean;
    created_at: string;
}
export interface CartItem {
    product_id: number;
    quantity: number;
}
export interface CartResponse {
    items: CartItem[];
}
export interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
}
export interface Order {
    id: number;
    user_id: number;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    customer_name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    delivery_instructions: string | null;
    items: OrderItem[];
}
export interface ApiErrorDetail {
    msg?: string;
    message?: string;
}
export interface ApiErrorBody {
    detail?: string | ApiErrorDetail[];
}
