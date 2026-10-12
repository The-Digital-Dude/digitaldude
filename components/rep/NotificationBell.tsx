"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { call } from "./poolShared";

interface Item { id: string; kind: string; title: string; body: string; link: string | null; created_at: string; read_at: string | null }

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

/** Bell with an unread count: replies from contacts and newly assigned companies. Refreshes every minute. */
export function NotificationBell({ onOpenItem }: { onOpenItem?: (kind: string) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await call("/api/rep/notifications", "GET");
    if (r.ok) {
      setItems(r.notifications as Item[]);
      setUnread(r.unread as number);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markAll() {
    await call("/api/rep/notifications", "POST", {});
    void load();
  }
  async function openItem(n: Item) {
    if (!n.read_at) await call("/api/rep/notifications", "POST", { ids: [n.id] });
    setOpen(false);
    onOpenItem?.(n.kind);
    void load();
  }

  return (
    <div className="relative" ref={box}>
      <button onClick={() => { if (!open) void load(); setOpen((o) => !o); }} className="relative rounded-xl border border-white/[0.08] bg-[#131B2E] p-2 text-slate-300 hover:text-white transition" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open}>
        <Bell size={16} />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-[#0F1629] p-2 shadow-2xl">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-bold text-white">Notifications</p>
            {unread > 0 && <button onClick={() => void markAll()} className="text-[11px] font-semibold text-purple-300 hover:underline">Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-slate-500">Nothing yet. Replies and new assignments show up here.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => void openItem(n)} className={`block w-full rounded-xl px-2 py-2 text-left hover:bg-white/5 ${n.read_at ? "opacity-60" : ""}`}>
                    <p className="flex items-center gap-2 text-xs font-semibold text-white">{!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />}{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[11px] text-slate-400">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] text-slate-500">{ago(n.created_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
