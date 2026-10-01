import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingScreen({ text = "Loading Rebel Mart…" }) {
  return <div className="min-h-[65vh] grid place-items-center"><div className="text-center"><div className="spinner mx-auto"/><p className="mt-4 muted text-sm">{text}</p></div></div>;
}
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth(); const location = useLocation();
  if (loading) return <LoadingScreen/>; if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }}/>; return <Outlet/>;
}
export function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen/>; if (!isAuthenticated) return <Navigate to="/login" replace/>; if (!isAdmin) return <Navigate to="/products" replace/>; return <Outlet/>;
}
