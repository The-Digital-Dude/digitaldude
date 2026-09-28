"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

export default function ClientPortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid corporate email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send login code.");
      }

      setStep("otp");
      setSuccessMsg("A 6-digit verification code has been dispatched to your email.");
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit security code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      router.push("/portal/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#0B0F19] text-white selection:bg-purple selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple/20 via-lavender/10 to-transparent blur-[120px]" />
        <div className="absolute -bottom-40 right-10 h-[450px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-full-color.png"
            alt="The Digital Dude"
            width={160}
            height={32}
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="rounded-full border border-purple/40 bg-purple/15 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
            Client Hub
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-slate-400 hover:text-white transition"
        >
          &larr; Back to Website
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131B2E]/80 backdrop-blur-xl p-8 shadow-2xl shadow-purple/5">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple/20 text-purple-400 ring-1 ring-purple/40 shadow-inner">
              {step === "email" ? <Mail className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {step === "email" ? "Client Operations Portal" : "Enter Security Code"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {step === "email"
                ? "Track milestones, review deliverables, watch weekly Loom updates, and manage scope."
                : `We sent a one-time login code to ${email}`}
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/30 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-[#7C3AED] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  "Dispatching Secure Code..."
                ) : (
                  <>
                    Send Login Code <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl rounded-xl border border-white/10 bg-white/5 py-3 text-white placeholder-slate-600 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-[#7C3AED] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  "Verifying Authentication..."
                ) : (
                  <>
                    Access Dashboard <ShieldCheck className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtpCode("");
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  &larr; Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium transition disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 border-t border-white/10 pt-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3 w-3 text-slate-400" />
              Passwordless HMAC-signed authentication &bull; 256-bit SSL
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} The Digital Dude. All rights reserved. Direct support:{" "}
        <a href="mailto:info@digitaldude.co.uk" className="text-purple-400 hover:underline">
          info@digitaldude.co.uk
        </a>
      </footer>
    </div>
  );
}
