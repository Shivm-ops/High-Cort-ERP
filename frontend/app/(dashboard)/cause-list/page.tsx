"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CauseListRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", "Today");
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.replace(`/hearings?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
      Redirecting to Hearings &amp; Calendar…
    </div>
  );
}

export default function CauseListRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
          Redirecting to Hearings &amp; Calendar…
        </div>
      }
    >
      <CauseListRedirectInner />
    </Suspense>
  );
}
