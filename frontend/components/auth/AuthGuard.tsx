"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Wraps protected dashboard pages.
 * Waits for Zustand's persist middleware to rehydrate from localStorage
 * before checking auth — prevents the flash-redirect on first load.
 * Also checks role: If user is a citizen, redirects to /citizen-portal.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (hydrated && !isAuthenticated && !hasToken) {
      document.cookie = "access_token=; path=/; max-age=0";
      router.replace("/login");
      return;
    }

    // Role boundary: Ordinary citizens access the dedicated Citizen Portal, not advocate ERP
    if (hydrated && (isAuthenticated || hasToken) && user?.role === "citizen") {
      router.replace("/citizen-portal");
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F8F6]">
        <div className="w-8 h-8 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
  if ((isAuthenticated || hasToken) && user?.role !== "citizen") {
    return <>{children}</>;
  }

  return null;
}
