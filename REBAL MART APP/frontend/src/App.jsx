import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { queryClient } from "./lib/queryClient";

import { RealtimeProvider } from "./context/RealtimeContext";
import ErrorBoundary from "./components/ErrorBoundary";

const ProtectedRoute = lazy(() => import("./components/ProtectedRoute").then((module) => ({
    default: module.ProtectedRoute || module.default?.ProtectedRoute || module.default,
})));
const AdminRoute = lazy(() => import("./components/ProtectedRoute").then((module) => ({
    default: module.AdminRoute || module.default?.AdminRoute,
})));

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Offers = lazy(() => import("./pages/Offers"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function PageLoader() {
    return (
        <div className="container page-section">
            <div className="spinner mx-auto" aria-label="Loading page" />
        </div>
    );
}

function ScrollToTop() {
    const { pathname, search } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) {
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
        if (document.body) {
            document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
    }, [pathname, search]);
    return null;
}

function RoutesView() {
    const location = useLocation();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
    const routeContent = (
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/compare" element={<Navigate to="/products" replace />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/offers" element={<Offers />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/rewards" element={<Rewards />} />
                        <Route path="/orders/:id" element={<OrderDetails />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/invoices" element={<AdminDashboard />} />
                    <Route path="/admin/import" element={<AdminDashboard />} />
                    <Route path="/admin/inventory" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminDashboard />} />
                    <Route path="/admin/orders" element={<AdminDashboard />} />
                    <Route path="/admin/chat" element={<AdminDashboard />} />
                    <Route path="/admin/homepage" element={<AdminDashboard />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
    );

    // Authentication screens are intentionally standalone: no storefront header,
    // category navigation, mobile bottom bar, live chat, AI launcher, or footer.
    return (
        <>
            <ScrollToTop />
            {isAuthPage ? routeContent : <Layout>{routeContent}</Layout>}
        </>
    );
}

function AppShell() {
    return (
        <ErrorBoundary>
            <RealtimeProvider>
                <RoutesView />
            </RealtimeProvider>
        </ErrorBoundary>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <AppShell />
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
