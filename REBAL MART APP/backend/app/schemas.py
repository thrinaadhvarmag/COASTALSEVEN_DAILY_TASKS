import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    admin_mode: Optional[bool] = False

class LoginOTPResponse(BaseModel):
    otp_required: bool = True
    message: str
    email: str
    task_id: Optional[str] = None
    dev_otp: Optional[str] = None

class VerifyLoginOTPRequest(BaseModel):
    email: str
    otp: str
    admin_mode: Optional[bool] = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    profile_image_url: Optional[str] = None
    email_verified: bool = True
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    actor_name: Optional[str] = "Prabhas"
    movie_name: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    actor_name: Optional[str] = None
    movie_name: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    image_url: Optional[str] = None
    rating: Optional[float] = 4.9
    review_count: Optional[int] = 24
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class ProductCountResponse(BaseModel):
    total: int

# --- Cart Schemas ---
class CartItemDto(BaseModel):
    product_id: int
    quantity: int
    size: Optional[str] = None

class CartResponse(BaseModel):
    items: List[CartItemDto]

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1
    size: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int

# --- Order Schemas ---
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    size: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    delivery_instructions: Optional[str] = None
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "COD"
    item_sizes: Optional[dict] = None

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    total_amount: float
    status: str
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    delivery_instructions: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    payment_method: Optional[str] = "COD"
    payment_status: Optional[str] = "PENDING"
    created_at: datetime.datetime
    updated_at: datetime.datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float

class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    message: str

# --- Chat & AI Schemas ---
class ChatMessageResponse(BaseModel):
    id: int
    customer_id: int
    sender_id: int
    sender_role: str
    text: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[Any]] = []

class AIDescriptionRequest(BaseModel):
    instructions: Optional[str] = None
