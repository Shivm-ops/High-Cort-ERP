"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function AIDraftStudioRedirectInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/draft-workspace?mode=ai");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
      Redirecting to Draft Workspace…
    </div>
  );
}

export default function AIDraftStudioRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
          Redirecting to Draft Workspace…
        </div>
      }
    >
      <AIDraftStudioRedirectInner />
    </Suspense>
  );
}
