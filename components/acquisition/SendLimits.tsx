"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Card, Empty, btnCls, btnGhostCls, inputCls, labelCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";
import type { EffectiveLimits, LimitSettings, RepLimitRow, Sent } from "@/lib/crm/sendLimits";

interface RepRow extends RepLimitRow {
  id: string;
  name: string;
  status: string;
  effective: EffectiveLimits;
  sent: Sent;
  dueFollowUps: number;
}
interface Loaded {
  settings: LimitSettings;
  reps: RepRow[];
  team: { ceiling: number; allocated: number; sent24h: number; acquisitionSent24h: number };
  migrated: boolean;
}

const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

export function SendLimits() {
  const [data, setData] = useState<Loaded | null>(null);
  const [msg, setMsg] = useState<ApiResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { coldMax: string; followUpMax: string; warmup: boolean }>>({});
  const [settings, setSettings] = useState<Record<keyof LimitSettings, string> | null>(null);
  const focus = useSearchParams().get("rep");
  const focused = useRef<HTMLTableRowElement | null>(null);

  const load = useCallback(async () => {
    const r = await api("/api/acquisition/limits", "GET");
    if (!r.ok) return setMsg(r);
    const d = r as unknown as Loaded;
    setData(d);
    setSettings(Object.fromEntries(Object.entries(d.settings).map(([k, v]) => [k, String(v)])) as Record<keyof LimitSettings, string>);
    setDraft(Object.fromEntries(d.reps.map((x) => [x.id, { coldMax: String(x.coldMax), followUpMax: String(x.followUpMax), warmup: x.warmup }])));
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { focused.current?.scrollIntoView({ block: "center" }); }, [data, focus]);

  async function saveRep(id: string, restartWarmup = false) {
    const d = draft[id];
    setBusy(id);
    const r = await api("/api/acquisition/limits", "PUT", { action: "rep", employeeId: id, coldMax: num(d.coldMax), followUpMax: num(d.followUpMax), warmup: d.warmup, restartWarmup });
    setBusy(null);
    setMsg(r);
    if (r.ok) void load();
  }

  async function saveSettings() {
    if (!settings) return;
    setBusy("settings");
    const r = await api("/api/acquisition/limits", "PUT", { action: "settings", settings: { teamCeiling: num(settings.teamCeiling), startCold: num(settings.startCold), startFollowUp: num(settings.startFollowUp), stepPerWeek: num(settings.stepPerWeek) } });
    setBusy(null);
    setMsg(r);
    if (r.ok) void load();
  }

  if (!data || !settings) return <p className="text-sm text-navy/50">{msg?.error ?? "Loading…"}</p>;
  const { team } = data;
  const over = team.allocated > team.ceiling;

  return (
    <div className="space-y-6">
      {!data.migrated && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p className="font-semibold">One database step is needed</p>
          <p className="mt-1">Run <code>supabase/migrations/0043_rep_send_limits.sql</code> in the Supabase SQL editor. Until then cold and follow-up emails are counted together and warm-up is off.</p>
        </div>
      )}

      <Card title="Team total">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase text-navy/50">Sent, last 24 hours</div><div className="text-xl font-extrabold text-navy">{team.sent24h}</div><div className="text-xs text-navy/50">reps plus {team.acquisitionSent24h} from admin campaigns</div></div>
          <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase text-navy/50">Allocated to active reps</div><div className={`text-xl font-extrabold ${over ? "text-red-600" : "text-navy"}`}>{team.allocated}</div><div className="text-xs text-navy/50">today&apos;s cold plus follow-up limits added up</div></div>
          <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase text-navy/50">Team ceiling</div><div className="text-xl font-extrabold text-navy">{team.ceiling}</div><div className="text-xs text-navy/50">Brevo free allows about 300 a day, including system email</div></div>
        </div>
        {over && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">The reps&apos; limits add up to more than the team ceiling. Lower some limits, or raise the ceiling if your email plan allows it.</p>}
      </Card>

      <Card title="Reps">
        {data.reps.length === 0 ? <Empty>No reps.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">Rep</th><th>Cold max / day</th><th>Follow-up max / day</th><th>Warm-up</th><th>Today&apos;s limit</th><th>Sent (24h)</th><th>Due follow-ups</th><th /></tr></thead>
              <tbody>
                {data.reps.map((r) => {
                  const d = draft[r.id];
                  if (!d) return null;
                  const behind = r.dueFollowUps > r.effective.followUp;
                  const isFocus = focus === r.id;
                  return (
                    <tr key={r.id} ref={isFocus ? focused : undefined} className={`border-t border-slate-100 align-top ${isFocus ? "bg-lavender/60" : ""}`}>
                      <td className="py-2 pr-3"><div className="font-semibold text-navy">{r.name}</div>{r.status !== "active" && <Badge tone="amber">{r.status}</Badge>}</td>
                      <td className="pr-3"><input className={`${inputCls} w-24`} inputMode="numeric" value={d.coldMax} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, coldMax: e.target.value } })} aria-label={`${r.name} cold maximum`} /></td>
                      <td className="pr-3"><input className={`${inputCls} w-24`} inputMode="numeric" value={d.followUpMax} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, followUpMax: e.target.value } })} aria-label={`${r.name} follow-up maximum`} /></td>
                      <td className="pr-3 text-xs">
                        <label className="flex items-center gap-1.5 font-semibold text-navy"><input type="checkbox" checked={d.warmup} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, warmup: e.target.checked } })} /> Ramp up</label>
                        {r.warmup && <div className="mt-1 text-navy/50">week {r.effective.week + 1}{r.effective.ramping ? "" : ", at maximum"}</div>}
                        {r.warmup && <button type="button" className="mt-1 font-semibold text-purple hover:underline" disabled={busy === r.id} onClick={() => void saveRep(r.id, true)}>Restart</button>}
                      </td>
                      <td className="pr-3 text-xs"><div>Cold <strong>{r.effective.cold}</strong></div><div>Follow-up <strong>{r.effective.followUp}</strong></div></td>
                      <td className="pr-3 text-xs"><div>Cold {r.sent.cold}</div><div>Follow-up {r.sent.followUp}</div></td>
                      <td className="pr-3 text-xs"><span className={behind ? "font-bold text-red-600" : ""}>{r.dueFollowUps}</span>{behind && <div className="text-red-600">more than their limit</div>}</td>
                      <td className="py-2 text-right"><button className={btnCls} disabled={busy === r.id} onClick={() => void saveRep(r.id)}>{busy === r.id ? "Saving…" : "Save"}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-navy/50">Limits count the last 24 hours, cold and follow-up separately, so cold outreach can never use up a rep&apos;s follow-ups. Turn on ramp-up to start a rep low and raise them every week up to their maximums. Follow-ups a rep cannot send within their limit move to the next working day and you get an alert.</p>
      </Card>

      <Card title="Warm-up and team settings" action={<button className={btnGhostCls} onClick={() => void saveSettings()} disabled={busy === "settings"}>{busy === "settings" ? "Saving…" : "Save settings"}</button>}>
        <div className="grid gap-3 md:grid-cols-4">
          {([["startCold", "Start: cold per day"], ["startFollowUp", "Start: follow-ups per day"], ["stepPerWeek", "Rise per week (each)"], ["teamCeiling", "Team ceiling per day"]] as const).map(([k, label]) => (
            <div key={k}><label className={labelCls}>{label}</label><input className={inputCls} inputMode="numeric" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} /></div>
          ))}
        </div>
        <p className="mt-3 text-xs text-navy/50">Example: start 10, rise 5 a week, maximum 30: a new rep sends 10, then 15, 20, 25, then 30 a day. Reps who were already sending when this was added are not ramped.</p>
      </Card>

      <Feedback result={msg} />
    </div>
  );
}
