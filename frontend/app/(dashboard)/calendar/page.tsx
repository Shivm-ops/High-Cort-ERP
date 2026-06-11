"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hearings");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Redirecting to Hearings Calendar...</p>
    </div>
  );
}
