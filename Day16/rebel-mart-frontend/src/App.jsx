import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";

/*
 * ProtectedRoute exports are handled explicitly instead of trying to
 * access properties from a React.lazy component.
 */
const ProtectedRoute = lazy(() =>
  import("./components/ProtectedRoute").then((module) => ({
    default:
      module.ProtectedRoute ||
      module.default?.ProtectedRoute ||
      module.default,
  }))
);

const AdminRoute = lazy(() =>
  import("./components/ProtectedRoute").then((module) => ({
    default:
      module.AdminRoute ||
      module.default?.AdminRoute,
  }))
);

/* Pages */
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function PageLoader() {
  return (
    <div className="container page-section">
      <div
        className="spinner mx-auto"
        aria-label="Loading page"
      />
    </div>
  );
}

function RoutesView() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected customer routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/products" element={<Products />} />
            <Route
              path="/products/:id"
              element={<ProductDetails />}
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route
              path="/orders/:id"
              element={<OrderDetails />}
            />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin route */}
          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <RoutesView />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}