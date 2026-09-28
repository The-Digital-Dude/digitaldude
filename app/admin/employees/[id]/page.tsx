"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CheckCircle2, Circle, Save } from "lucide-react";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  employment_type: string;
  meeting_bonus_min: number | null;
  meeting_bonus_max: number | null;
  deal_commission_percent_min: number | null;
  deal_commission_percent_max: number | null;
  status: string;
  onboarding_checklist: ChecklistItem[];
}

interface CommissionSummary {
  qualifiedMeetings: number;
  meetingBonusRangeTotal: [number, number];
  wonDealValue: number;
  dealCommissionRangeTotal: [number, number];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({
    meeting_bonus_min: "",
    meeting_bonus_max: "",
    deal_commission_percent_min: "",
    deal_commission_percent_max: "",
  });
  const [savingRates, setSavingRates] = useState(false);

  async function fetchEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}`);
      const data = await res.json();
      if (data.ok) {
        setEmployee(data.employee);
        setCommission(data.commissionSummary);
        setRates({
          meeting_bonus_min: data.employee.meeting_bonus_min ?? "",
          meeting_bonus_max: data.employee.meeting_bonus_max ?? "",
          deal_commission_percent_min: data.employee.deal_commission_percent_min ?? "",
          deal_commission_percent_max: data.employee.deal_commission_percent_max ?? "",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleTask(index: number, done: boolean) {
    const res = await fetch(`/api/admin/employees/${id}/onboarding`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIndex: index, done }),
    });
    const data = await res.json();
    if (data.ok) {
      setEmployee(data.employee);
    } else {
      alert(data.error || "Failed to update task.");
    }
  }

  async function saveRates() {
    setSavingRates(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_bonus_min: rates.meeting_bonus_min === "" ? null : Number(rates.meeting_bonus_min),
          meeting_bonus_max: rates.meeting_bonus_max === "" ? null : Number(rates.meeting_bonus_max),
          deal_commission_percent_min: rates.deal_commission_percent_min === "" ? null : Number(rates.deal_commission_percent_min),
          deal_commission_percent_max: rates.deal_commission_percent_max === "" ? null : Number(rates.deal_commission_percent_max),
        }),
      });
      const data = await res.json();
      if (data.ok) fetchEmployee();
      else alert(data.error || "Failed to save rates.");
    } finally {
      setSavingRates(false);
    }
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.ok) setEmployee(data.employee);
    else alert(data.error || "Failed to update status.");
  }

  async function handleDelete() {
    if (!employee || !confirm(`Remove ${employee.full_name} from employees?`)) return;
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) router.push("/admin/employees");
    else alert(data.error || "Failed to delete.");
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-navy/60">Loading…</p>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout>
        <p className="text-sm text-red-600">Employee not found.</p>
      </AdminLayout>
    );
  }

  const checklist = employee.onboarding_checklist || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">{employee.full_name}</h1>
            <p className="text-sm text-navy/60">{employee.email} · {employee.role_title || "No role set"}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={employee.status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-navy outline-none focus:border-purple"
            >
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="offboarded">Offboarded</option>
            </select>
            <button onClick={handleDelete} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              Remove
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Onboarding checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-navy mb-3">Onboarding Checklist</h2>
            <div className="space-y-2">
              {checklist.length === 0 ? (
                <p className="text-xs text-navy/50">No checklist items.</p>
              ) : (
                checklist.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleTask(idx, !item.done)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                  >
                    {item.done ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Circle size={18} className="shrink-0 text-navy/30" />
                    )}
                    <span className={`text-sm ${item.done ? "text-navy/50 line-through" : "text-navy"}`}>{item.task}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Commission summary + rates */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-navy mb-3">Commission Rates</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">Meeting Bonus Min</label>
                  <input
                    type="number"
                    value={rates.meeting_bonus_min}
                    onChange={(e) => setRates((r) => ({ ...r, meeting_bonus_min: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">Meeting Bonus Max</label>
                  <input
                    type="number"
                    value={rates.meeting_bonus_max}
                    onChange={(e) => setRates((r) => ({ ...r, meeting_bonus_max: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">Deal Commission % Min</label>
                  <input
                    type="number"
                    value={rates.deal_commission_percent_min}
                    onChange={(e) => setRates((r) => ({ ...r, deal_commission_percent_min: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">Deal Commission % Max</label>
                  <input
                    type="number"
                    value={rates.deal_commission_percent_max}
                    onChange={(e) => setRates((r) => ({ ...r, deal_commission_percent_max: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm outline-none focus:border-purple"
                  />
                </div>
              </div>
              <button
                onClick={saveRates}
                disabled={savingRates}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple/90 disabled:opacity-50"
              >
                <Save size={14} /> {savingRates ? "Saving…" : "Save Rates"}
              </button>
            </div>

            {commission && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <h2 className="text-sm font-bold text-navy mb-3">Commission Summary (live, from bookings)</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-navy/60">Qualified meetings sourced</span>
                    <span className="font-bold text-navy">{commission.qualifiedMeetings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy/60">Meeting bonus owed</span>
                    <span className="font-bold text-navy">
                      ${commission.meetingBonusRangeTotal[0].toLocaleString()} – ${commission.meetingBonusRangeTotal[1].toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy/60">Closed-won deal value sourced</span>
                    <span className="font-bold text-navy">${commission.wonDealValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <span className="text-navy/60">Deal commission owed</span>
                    <span className="font-bold text-navy">
                      ${commission.dealCommissionRangeTotal[0].toLocaleString()} – ${commission.dealCommissionRangeTotal[1].toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
