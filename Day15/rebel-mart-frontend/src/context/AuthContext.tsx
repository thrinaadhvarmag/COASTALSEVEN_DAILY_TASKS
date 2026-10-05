import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCartStore } from "../store/cartStore";
import { authApi } from "../services/api";
import type { User } from "../types/api";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User>;
  updateUser: (next: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("rebel_mart_token"),
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("rebel_mart_user") || "null") as User | null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(token));
  const resetCart = useCartStore((state: any) => state.reset);
  const refreshCart = useCartStore((state: any) => state.refreshCart);

  const updateUser = (next: User) => {
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

  const refreshUser = async (): Promise<User> => {
    const data = await authApi.me();
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
      .then(() => refreshCart().catch(() => undefined))
      .catch(logout)
      .finally(() => setLoading(false));
    // Auth is initialized once when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const expire = () => logout();
    window.addEventListener("rebel-auth-expired", expire);
    return () => window.removeEventListener("rebel-auth-expired", expire);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("rebel_mart_token", data.access_token);
    setToken(data.access_token);

    const me = await authApi.me();
    updateUser(me);
    await refreshCart().catch(() => undefined);
    return me;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<User> => {
    await authApi.register({ username, email, password });
    return login(email, password);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
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
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
