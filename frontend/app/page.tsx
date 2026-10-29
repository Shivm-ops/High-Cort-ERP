"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/lib/store/authStore";

const LandingPage = dynamic(() => import("@/components/landing/LandingPage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#013B36]">
      <div className="w-8 h-8 rounded-full border-2 border-[#6EE7B7] border-t-transparent animate-spin" />
    </div>
  ),
});

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (isAuthenticated || hasToken) {
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#013B36]">
        <div className="w-8 h-8 rounded-full border-2 border-[#6EE7B7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <LandingPage />;
}
