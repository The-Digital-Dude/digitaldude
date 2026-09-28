"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Lock,
} from "lucide-react";
import Image from "next/image";

export default function RepLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/rep/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to send login code.");
      }

      setStep(2);
      setSuccessMessage(`We sent a 6-digit code to ${email.trim()}`);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rep/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid or expired code.");
      }

      router.push("/rep/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d0d1f] px-4 py-12 text-white selection:bg-purple selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 shadow-2xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple to-indigo-500 shadow-lg shadow-purple/30 mx-auto">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rep Portal
            </h1>
            <p className="text-xs text-white/60 mt-1">
              The Digital Dude · Sales &amp; Growth Team
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300 font-medium">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Official Work Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@digitaldude.co.uk or personal email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-xs font-medium text-white placeholder-white/30 outline-none focus:border-purple focus:bg-white/[0.08] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple/25 hover:brightness-110 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sending One-Time Code…
                </>
              ) : (
                <>
                  Continue with Email <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-purple hover:underline"
                >
                  Change email
                </button>
              </div>

              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-center font-mono text-xl tracking-[8px] font-bold text-white placeholder-white/20 outline-none focus:border-purple focus:bg-white/[0.08] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple/25 hover:brightness-110 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Authenticating Session…
                </>
              ) : (
                <>
                  Verify &amp; Access Dashboard <Sparkles size={15} />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleSendOtp}
                className="text-xs text-white/50 hover:text-white disabled:opacity-40 transition flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw size={12} />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive code? Resend"}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[11px] text-white/40">
            Protected area for authorized The Digital Dude team members and contractors.
          </p>
        </div>
      </div>
    </div>
  );
}
