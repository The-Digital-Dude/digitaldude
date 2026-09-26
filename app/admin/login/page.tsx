"use client";

import { useState, Suspense, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Invalid password.");
        setLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-navy">
          Admin Password
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
          />
          <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Access Admin Portal"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <Image
            src="/logo-full-color.png"
            alt="The Digital Dude"
            width={160}
            height={30}
            priority
            className="mx-auto h-8 w-auto"
          />
          <h1 className="mt-6 text-xl font-bold text-navy">Admin Portal Login</h1>
          <p className="mt-2 text-sm text-navy/60">
            Sign in to manage discovery meetings, leads, and blog content.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-8 py-6 text-center text-sm text-navy/40">
              Loading login form…
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-navy/40">
          Protected portal · The Digital Dude &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
