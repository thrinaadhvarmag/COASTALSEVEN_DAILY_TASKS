import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCartStore } from "../store/cartStore";

const AuthContext = createContext(null);
const getApi = () => import("../services/api").then((module) => module.default);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rebel_mart_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rebel_mart_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(token));
  const resetCart = useCartStore((state) => state.reset);
  const refreshCart = useCartStore((state) => state.refreshCart);

  const updateUser = (next) => {
    localStorage.setItem("rebel_mart_user", JSON.stringify(next));
    setUser(next);
  };

  const logout = () => {
    localStorage.removeItem("rebel_mart_token");
    localStorage.removeItem("rebel_mart_user");
    setToken(null);
    setUser(null);
    resetCart();
  };

  const refreshUser = async () => {
    const api = await getApi();
    const { data } = await api.get("/auth/me");
    updateUser(data);
    return data;
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      resetCart();
      return;
    }
    refreshUser()
      .then(() => refreshCart().catch(() => {}))
      .catch(logout)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expire = () => logout();
    window.addEventListener("rebel-auth-expired", expire);
    return () => window.removeEventListener("rebel-auth-expired", expire);
  }, []);

  const login = async (email, password) => {
    const api = await getApi();
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("rebel_mart_token", data.access_token);
    setToken(data.access_token);
    const me = await api.get("/auth/me", { headers: { Authorization: `Bearer ${data.access_token}` } });
    updateUser(me.data);
    await refreshCart().catch(() => {});
    return me.data;
  };

  const register = async (username, email, password) => {
    await api.post("/auth/register", { username, email, password });
    return login(email, password);
  };

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
