"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const BACKEND_URL = "http://5.189.144.48:8000";
const TOKEN_KEY = "cyberroad_user_token";
const USER_KEY = "cyberroad_user";

interface User {
  id: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  token: string;
  loading: boolean;
  login: (token: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: "",
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      verifyToken(saved).then((u) => {
        if (u) {
          setUser(u);
          setToken(saved);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Redirect unauthenticated users to /login (except on /login itself)
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

  async function verifyToken(t: string): Promise<User | null> {
    try {
      const res = await fetch(BACKEND_URL + "/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ token: t }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status === "ok" && data.user) return data.user as User;
      return null;
    } catch {
      return null;
    }
  }

  const login = useCallback(async (inputToken: string) => {
    try {
      const res = await fetch(BACKEND_URL + "/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ token: inputToken }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "ok") {
        return { ok: false, error: data.message || "Invalid access token" };
      }
      const u = data.user as User;
      setUser(u);
      setToken(inputToken);
      localStorage.setItem(TOKEN_KEY, inputToken);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — backend unreachable" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    fetch(BACKEND_URL + "/logout", { method: "POST", credentials: "omit" }).catch(() => {});
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
