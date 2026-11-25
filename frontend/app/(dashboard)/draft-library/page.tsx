"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function DraftLibraryRedirectInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/draft-workspace?mode=templates");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
      Redirecting to Draft Workspace Template Library…
    </div>
  );
}

export default function DraftLibraryRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
          Redirecting to Draft Workspace Template Library…
        </div>
      }
    >
      <DraftLibraryRedirectInner />
    </Suspense>
  );
}
