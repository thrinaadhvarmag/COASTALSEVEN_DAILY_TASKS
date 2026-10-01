import { BrowserRouter,Navigate,Route,Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AdminRoute,ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./pages/CartContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

function RoutesView(){return <Layout><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<ProtectedRoute/>}><Route path="/products" element={<Products/>}/><Route path="/products/:id" element={<ProductDetails/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/orders" element={<Orders/>}/><Route path="/orders/:id" element={<OrderDetails/>}/><Route path="/profile" element={<Profile/>}/></Route><Route element={<AdminRoute/>}><Route path="/admin" element={<AdminDashboard/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>}

export default function App(){return <BrowserRouter><ThemeProvider><AuthProvider><CartProvider><ToastProvider><RoutesView/></ToastProvider></CartProvider></AuthProvider></ThemeProvider></BrowserRouter>}
