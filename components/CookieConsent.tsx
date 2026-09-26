"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

type Consent = "accepted" | "declined" | null;

const STORAGE_KEY = "cookie-consent";

function readStoredConsent(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    // localStorage can throw in private browsing / blocked storage — treat as no decision yet.
    return null;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setReady(true);
  }, []);

  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // If storage is blocked, the choice just won't persist across visits.
    }
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && <GoogleAnalytics />}

      {ready && consent === null && (
        <div className="fixed inset-x-0 bottom-16 z-50 border-t border-black/10 bg-white px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:bottom-0">
          <div className="mx-auto flex max-w-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-navy/70">
              We use cookies to see how visitors use this site (Google Analytics). No marketing or
              advertising cookies. See our{" "}
              <Link href="/privacy" className="font-semibold text-purple underline">
                privacy policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => choose("declined")}
                className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy"
              >
                Decline
              </button>
              <button
                onClick={() => choose("accepted")}
                className="rounded-full bg-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
