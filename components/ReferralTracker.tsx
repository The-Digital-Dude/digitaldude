"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ReferralTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toLowerCase();
      // Store in localStorage
      try {
        localStorage.setItem("tdd_rep_ref", cleanRef);
      } catch {}

      // Store in cookie for 30 days
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `tdd_rep_ref=${encodeURIComponent(
        cleanRef
      )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
