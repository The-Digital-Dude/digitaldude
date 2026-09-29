"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Mail, AlertCircle, ArrowLeft } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const leadIdParam = searchParams.get("lead_id") || "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  async function handleConfirmUnsubscribe(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/outreach/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          lead_id: leadIdParam || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to process opt-out.");
      }

      setUnsubscribed(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-purple">
          {unsubscribed ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <Mail className="h-6 w-6" />}
        </div>
        <h1 className="text-xl font-bold text-navy">
          {unsubscribed ? "Opt-Out Confirmed" : "Manage Email Preferences"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {unsubscribed
            ? "You have been successfully removed from our sales and outreach sequence."
            : "Opt out of direct commercial communications from The Digital Dude sales team."}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {unsubscribed ? (
        <div className="space-y-4 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
            <p className="font-semibold">{email}</p>
            <p className="mt-1 text-[11px] text-emerald-600">
              No further automated follow-ups will be sent to this email address.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Website
          </Link>
        </div>
      ) : (
        <form onSubmit={handleConfirmUnsubscribe} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Updating Preferences..." : "Confirm 1-Click Unsubscribe"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-slate-100 pt-4 text-center">
        <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          GDPR &amp; CAN-SPAM compliant opt-out mechanism
        </p>
      </div>
    </div>
  );
}

export default function OutreachUnsubscribePage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-50 p-4 antialiased">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-full-color.png"
            alt="The Digital Dude"
            width={140}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center py-10">
        <Suspense fallback={<div className="text-sm text-slate-400">Loading...</div>}>
          <UnsubscribeContent />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} The Digital Dude &bull; info@digitaldude.co.uk
      </footer>
    </div>
  );
}
