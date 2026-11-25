"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function CaseLawsRedirectInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/legal-research?tab=library");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
      Redirecting to Legal Research &amp; Case Laws…
    </div>
  );
}

export default function CaseLawsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[60vh] text-sm text-gray-500">
          Redirecting to Legal Research &amp; Case Laws…
        </div>
      }
    >
      <CaseLawsRedirectInner />
    </Suspense>
  );
}
