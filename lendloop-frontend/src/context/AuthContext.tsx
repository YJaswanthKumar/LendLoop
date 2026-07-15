import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/api/config";
import {
  fetchProfile,
  loginUser,
  registerUser,
  type RegisterPayload,
} from "@/services/authService";
import type { User } from "@/utils/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on the client only (SSR-safe)
  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((nextUser: User, nextToken: string) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(
    async (email: string, password: string, _remember: boolean) => {
      const data = await loginUser(email, password);
      persist(data.user, data.token);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await registerUser(payload);
      persist(data.user, data.token);
    },
    [persist],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const fresh = await fetchProfile();
    setUser(fresh);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      hydrated,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, token, hydrated, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
