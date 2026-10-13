"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DraftsNewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/draft-workspace?${params}` : "/draft-workspace");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-workspace-bg">
      <div className="text-sm text-gray-500 animate-pulse">Redirecting to Draft Workspace...</div>
    </div>
  );
}
