import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/constants/api";

const TOKEN_KEY = "hakim_auth_token";
const USER_KEY = "hakim_auth_user";

export type UserRole = "doctor" | "student" | "admin" | "patient";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  verificationStatus?: string;
  specialization?: string;
  studyYear?: number;
  isGuest?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function saveItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        getItem(TOKEN_KEY),
        getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const userData = await res.json();
          setToken(storedToken);
          setUser(userData);
        } else {
          await deleteItem(TOKEN_KEY);
          await deleteItem(USER_KEY);
        }
      }
    } catch {
      try {
        const storedUser = await getItem(USER_KEY);
        const storedToken = await getItem(TOKEN_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = useCallback(() => {
    const guestUser: AuthUser = {
      id: 0,
      fullName: "زائر",
      email: "guest",
      role: "doctor",
      verificationStatus: "approved",
      isGuest: true,
    };
    setToken("guest");
    setUser(guestUser);
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      await saveItem(TOKEN_KEY, data.token);
      await saveItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Connection error. Please try again." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      await deleteItem(TOKEN_KEY);
      await deleteItem(USER_KEY);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginAsGuest,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
