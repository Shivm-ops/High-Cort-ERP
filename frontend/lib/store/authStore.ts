import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export interface SubscriptionInfo {
  tier: string;
  features: string[];
  max_users: number;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  bar_council_no?: string;
  subscription?: SubscriptionInfo;
  is_superadmin?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  clientLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);
        const { data } = await api.post("/auth/token", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clientLogin: async (email: string, password: string) => {
        set({ isLoading: true });
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);
        const { data } = await api.post("/auth/client-login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        try { await api.post("/auth/logout"); } catch(e) {}
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Clear the SSR cookie so middleware doesn't redirect-loop
        if (typeof document !== "undefined") {
          document.cookie = "access_token=; path=/; max-age=0";
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        window.location.href = "/login";
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    {
      name: "fastcase-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
