"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Wraps protected dashboard pages.
 * Waits for Zustand's persist middleware to rehydrate from localStorage
 * before checking auth — prevents the flash-redirect on first load.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist rehydrates synchronously in the same tick on the client.
    // Setting hydrated in a useEffect gives it one render cycle to settle.
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      // Also clear the cookie so middleware doesn't loop
      document.cookie = "access_token=; path=/; max-age=0";
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // While rehydrating, show nothing (avoids flash of dashboard for unauthed users)
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F8F6]">
        <div className="w-8 h-8 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    );
  }

  // Authenticated — render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated — redirect in progress, show nothing
  return null;
}
