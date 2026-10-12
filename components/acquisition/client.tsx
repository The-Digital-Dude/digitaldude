"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { btnCls, btnDangerCls, btnGhostCls } from "./ui";

export interface ApiResult {
  ok: boolean;
  error?: string;
  issues?: ({ path?: string; message: string } | string)[];
  [k: string]: unknown;
}

export async function api(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = (await res.json().catch(() => ({}))) as ApiResult;
    return res.ok ? { ...data, ok: data.ok !== false } : { ...data, ok: false, error: data.error ?? `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export function Feedback({ result }: { result: ApiResult | null }) {
  if (!result) return null;
  if (result.ok) return <p className="mt-2 text-sm font-medium text-emerald-700" role="status">Done.</p>;
  return (
    <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
      <p className="font-semibold">{result.error}</p>
      {result.issues?.length ? (
        <ul className="mt-1 list-disc pl-5">
          {result.issues.map((i, n) => (
            <li key={n}>{typeof i === "string" ? i : `${i.path ? i.path + ": " : ""}${i.message}`}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Runs a mutation, shows the server's error verbatim, and refreshes server data on success. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  async function run(url: string, method: string, body?: unknown, after?: (r: ApiResult) => void) {
    setBusy(true);
    setResult(null);
    const r = await api(url, method, body);
    setResult(r);
    setBusy(false);
    if (r.ok) {
      after?.(r);
      router.refresh();
    }
    return r;
  }
  return { run, busy, result, setResult };
}

export function ActionButton({
  url, method = "POST", body, children, variant = "primary", confirm: confirmText, disabled,
}: {
  url: string; method?: string; body?: unknown; children: ReactNode; variant?: "primary" | "ghost" | "danger"; confirm?: string; disabled?: boolean;
}) {
  const { run, busy, result } = useAction();
  const cls = variant === "danger" ? btnDangerCls : variant === "ghost" ? btnGhostCls : btnCls;
  return (
    <div>
      <button
        className={cls}
        disabled={busy || disabled}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          void run(url, method, body);
        }}
      >
        {busy ? "Working…" : children}
      </button>
      <Feedback result={result} />
    </div>
  );
}
