"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item { id: string; kind: string; title: string; body: string; link: string | null; created_at: string; read_at: string | null }

const POLL_MS = 60_000;

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

/** Bell with an unread count and a dropdown of the admin's in-app notifications. Nothing here is emailed. */
export function NotificationBell({ className }: { className?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/acquisition/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // a missed poll is fine; the next one catches up
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markAllRead() {
    setUnread(0);
    setItems((all) => all.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
    await fetch("/api/acquisition/notifications/read", { method: "POST" }).catch(() => undefined);
  }

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) void load(); }}
        className="relative rounded-lg p-2 text-navy hover:bg-lavender hover:text-purple"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-navy">Notifications</span>
            <button type="button" onClick={() => void markAllRead()} disabled={unread === 0} className="text-xs font-semibold text-purple hover:underline disabled:opacity-40 disabled:no-underline">Mark all read</button>
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-navy/50">Nothing yet.</li>}
            {items.map((n) => {
              const body = (
                <>
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-navy/60">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-navy/40">{ago(n.created_at)}</p>
                    </div>
                  </div>
                </>
              );
              return (
                <li key={n.id}>
                  {n.link ? <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-slate-50">{body}</Link> : <div className="px-4 py-3">{body}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
