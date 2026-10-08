import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCartStore } from "../store/cartStore";
import { authApi } from "../services/api";
import type { User } from "../types/api";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  requestLoginOTP: (email: string, password: string) => Promise<{ email: string; message: string }>;
  verifyLoginOTP: (email: string, otp: string) => Promise<User>;
  resendLoginOTP: (email: string) => Promise<{ email: string; message: string }>;
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
      return JSON.parse(
        localStorage.getItem("rebel_mart_user") || "null",
      ) as User | null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(token));
  const initialToken = useRef(token).current;

  const resetCart = useCallback(() => {
    useCartStore.getState().reset();
  }, []);

  const refreshCart = useCallback(async () => {
    await useCartStore.getState().refreshCart();
  }, []);

  const updateUser = useCallback((next: User) => {
    localStorage.setItem("rebel_mart_user", JSON.stringify(next));
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("rebel_mart_token");
    localStorage.removeItem("rebel_mart_user");
    setToken(null);
    setUser(null);
    setLoading(false);
    resetCart();
  }, [resetCart]);

  const refreshUser = useCallback(async (): Promise<User> => {
    const data = await authApi.me();
    updateUser(data);
    return data;
  }, [updateUser]);

  useEffect(() => {
    if (!initialToken) {
      resetCart();
      return;
    }

    let active = true;

    refreshUser()
      .then(() => refreshCart().catch(() => undefined))
      .catch(logout)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [logout, refreshCart, refreshUser, resetCart]);

  useEffect(() => {
    const expire = () => logout();
    window.addEventListener("rebel-auth-expired", expire);
    return () => window.removeEventListener("rebel-auth-expired", expire);
  }, [logout]);

  const requestLoginOTP = useCallback(
    async (email: string, password: string): Promise<{ email: string; message: string }> => {
      const data = await authApi.login({ email, password });
      return { email: data.email, message: data.message };
    },
    [],
  );

  const verifyLoginOTP = useCallback(
    async (email: string, otp: string): Promise<User> => {
      const data = await authApi.verifyLoginOTP({ email, otp });
      localStorage.setItem("rebel_mart_token", data.access_token);
      setToken(data.access_token);
      const me = await authApi.me();
      updateUser(me);
      await refreshCart().catch(() => undefined);
      return me;
    },
    [refreshCart, updateUser],
  );

  const resendLoginOTP = useCallback(
    async (email: string): Promise<{ email: string; message: string }> => {
      const data = await authApi.resendLoginOTP(email);
      return { email: data.email, message: data.message };
    },
    [],
  );

  const register = useCallback(
    async (username: string, email: string, password: string): Promise<User> => {
      return authApi.register({ username, email, password });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      requestLoginOTP,
      verifyLoginOTP,
      resendLoginOTP,
      register,
      logout,
      refreshUser,
      updateUser,
    }),
    [loading, logout, refreshUser, register, requestLoginOTP, resendLoginOTP, token, updateUser, user, verifyLoginOTP],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
