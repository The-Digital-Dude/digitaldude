"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  CheckCircle2,
  Circle,
  Save,
  Copy,
  Check,
  Link as LinkIcon,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Award,
  ExternalLink,
  Search,
  X,
  Loader2,
  Building,
  UserCheck,
  Star,
  FileText,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

interface SourcedBooking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  slot_start: string;
  status: string;
  stage?: string;
  deal_value?: number;
  meeting_bonus_payout_status?: string;
  deal_commission_payout_status?: string;
  payout_notes?: string;
  created_at: string;
}

interface SourceApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  cv_path: string;
  proof_of_results_path: string | null;
  written_test_response: string;
  internal_notes?: string;
  scorecard?: {
    written_test?: number;
    experience?: number;
    communication?: number;
    overall?: number;
  };
  created_at: string;
  job_postings?: { title: string };
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  employment_type: string;
  currency: string;
  referral_code?: string;
  meeting_bonus_min: number | null;
  meeting_bonus_max: number | null;
  deal_commission_percent_min: number | null;
  deal_commission_percent_max: number | null;
  status: string;
  source_application_id?: string | null;
  onboarding_checklist: ChecklistItem[];
}

interface CommissionSummary {
  currency: string;
  totalBookingsCount: number;
  qualifiedMeetings: number;
  meetingBonusRangeTotal: [number, number];
  meetingBonusPaidCount: number;
  wonDealsCount: number;
  wonDealValue: number;
  dealCommissionRangeTotal: [number, number];
  dealCommissionPaidCount: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  GBP: "£",
  USD: "$",
  EUR: "€",
};

const PAYOUT_STATUS_OPTIONS = ["pending", "approved", "paid"];

function statusBadgeClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "approved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sourceApplication, setSourceApplication] = useState<SourceApplication | null>(null);
  const [sourcedBookings, setSourcedBookings] = useState<SourcedBooking[]>([]);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Profile & Commission Settings State
  const [rates, setRates] = useState({
    role_title: "",
    assigned_outreach_email: "",
    outreach_display_name: "",
    referral_code: "",
    currency: "BDT",
    meeting_bonus_min: "",
    meeting_bonus_max: "",
    deal_commission_percent_min: "",
    deal_commission_percent_max: "",
  });
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSuccess, setRatesSuccess] = useState(false);

  // New Onboarding Task State
  const [newTaskInput, setNewTaskInput] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Custom Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allBookings, setAllBookings] = useState<SourcedBooking[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [loadingAllBookings, setLoadingAllBookings] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function fetchEmployee() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}`);
      const data = await res.json();
      if (data.ok) {
        setEmployee(data.employee);
        setSourceApplication(data.sourceApplication || null);
        setSourcedBookings(data.sourcedBookings || []);
        setCommission(data.commissionSummary);
        setRates({
          role_title: data.employee.role_title || "",
          assigned_outreach_email: data.employee.assigned_outreach_email || "",
          outreach_display_name: data.employee.outreach_display_name || "",
          referral_code: data.employee.referral_code || "",
          currency: data.employee.currency || "BDT",
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
      body: JSON.stringify({ action: "toggle", taskIndex: index, done }),
    });
    const data = await res.json();
    if (data.ok) {
      setEmployee(data.employee);
    } else {
      alert(data.error || "Failed to update task.");
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}/onboarding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", task: newTaskInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmployee(data.employee);
        setNewTaskInput("");
      } else {
        alert(data.error || "Failed to add task.");
      }
    } finally {
      setAddingTask(false);
    }
  }

  async function handleDeleteTask(index: number) {
    if (!confirm("Delete this checklist task?")) return;
    const res = await fetch(`/api/admin/employees/${id}/onboarding`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", taskIndex: index }),
    });
    const data = await res.json();
    if (data.ok) {
      setEmployee(data.employee);
    } else {
      alert(data.error || "Failed to delete task.");
    }
  }

  async function saveRates() {
    setSavingRates(true);
    setRatesSuccess(false);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_title: rates.role_title.trim(),
          assigned_outreach_email: rates.assigned_outreach_email.trim().toLowerCase() || null,
          outreach_display_name: rates.outreach_display_name.trim() || null,
          referral_code: rates.referral_code.trim().toLowerCase(),
          currency: rates.currency,
          meeting_bonus_min: rates.meeting_bonus_min === "" ? null : Number(rates.meeting_bonus_min),
          meeting_bonus_max: rates.meeting_bonus_max === "" ? null : Number(rates.meeting_bonus_max),
          deal_commission_percent_min:
            rates.deal_commission_percent_min === "" ? null : Number(rates.deal_commission_percent_min),
          deal_commission_percent_max:
            rates.deal_commission_percent_max === "" ? null : Number(rates.deal_commission_percent_max),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRatesSuccess(true);
        fetchEmployee();
        setTimeout(() => setRatesSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save settings.");
      }
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

  async function handleUpdateBookingPayout(
    bookingId: string,
    field: "meeting_bonus_payout_status" | "deal_commission_payout_status",
    val: string
  ) {
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
    const data = await res.json();
    if (data.ok) {
      setSourcedBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, [field]: val } : b))
      );
      fetchEmployee();
    } else {
      alert(data.error || "Failed to update payout status.");
    }
  }

  async function openAssignModal() {
    setIsAssignModalOpen(true);
    setLoadingAllBookings(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data.ok) {
        setAllBookings(data.bookings || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAllBookings(false);
    }
  }

  async function assignBookingToRep(bookingId: string) {
    setAssigningId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourced_by_employee_id: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAssignModalOpen(false);
        fetchEmployee();
      } else {
        alert(data.error || "Failed to assign lead.");
      }
    } finally {
      setAssigningId(null);
    }
  }

  async function handleDelete() {
    if (!employee || !confirm(`Remove ${employee.full_name} from employees?`)) return;
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) router.push("/admin/employees");
    else alert(data.error || "Failed to delete.");
  }

  function copyReferralLink() {
    if (!employee) return;
    const refCode = employee.referral_code || employee.id;
    const link = `${SITE_URL}/contact?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-navy/60">Loading employee details…</p>
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
  const symbol = CURRENCY_SYMBOLS[rates.currency] || "$";
  const refCode = employee.referral_code || employee.id;
  const referralUrl = `${SITE_URL}/contact?ref=${refCode}`;

  const unassignedBookings = allBookings.filter(
    (b) =>
      b.name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.company_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.work_email.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-navy">{employee.full_name}</h1>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  employee.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : employee.status === "offboarded"
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {employee.status}
              </span>
            </div>
            <p className="text-sm text-navy/60 mt-0.5">
              {employee.email} · {employee.role_title || "Sales Rep (BDE)"}
            </p>
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
            <button
              onClick={handleDelete}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Rep Referral Link & Attribution Banner */}
        <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-purple uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon size={14} /> Rep Outreach &amp; Referral Link
            </span>
            <p className="text-xs text-navy/70">
              When a prospect clicks this link, any discovery call they book within 30 days is automatically attributed to {employee.full_name}.
            </p>
            <div className="font-mono text-xs text-navy/80 bg-white/80 p-2 rounded-lg border border-purple/10 break-all select-all">
              {referralUrl}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyReferralLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple/90 transition"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? "Copied Link!" : "Copy Outreach Link"}
            </button>
          </div>
        </div>

        {/* Candidate Hiring Origin & Evaluation Scorecard (if hired from job_applications) */}
        {sourceApplication && (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Hired from Job Application</h3>
                  <p className="text-xs text-navy/60">
                    Applied for <strong className="text-navy">{sourceApplication.job_postings?.title || "Role"}</strong> on{" "}
                    {new Date(sourceApplication.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/admin/applications"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple hover:underline"
                >
                  View in Applications Pipeline <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Scorecard Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-white p-3 border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Overall Score</span>
                <div className="mt-1 flex items-center gap-1 font-extrabold text-navy text-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{sourceApplication.scorecard?.overall || "—"}</span>
                  <span className="text-xs text-navy/40 font-normal">/5</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Written Test</span>
                <div className="mt-1 flex items-center gap-1 font-bold text-navy">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{sourceApplication.scorecard?.written_test || "—"}/5</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Experience</span>
                <div className="mt-1 flex items-center gap-1 font-bold text-navy">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{sourceApplication.scorecard?.experience || "—"}/5</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Communication</span>
                <div className="mt-1 flex items-center gap-1 font-bold text-navy">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{sourceApplication.scorecard?.communication || "—"}/5</span>
                </div>
              </div>
            </div>

            {sourceApplication.internal_notes && (
              <div className="text-xs text-navy/80 bg-white/80 p-3 rounded-xl border border-emerald-100 font-medium">
                <span className="font-bold text-navy/60 block text-[11px] uppercase tracking-wider mb-1">Interviewer Notes:</span>
                {sourceApplication.internal_notes}
              </div>
            )}
          </div>
        )}

        {/* Live Commission Summary Cards */}
        {commission && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">
                Total Sourced Calls
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-navy">{commission.qualifiedMeetings}</span>
                <span className="text-xs text-navy/60">qualified</span>
              </div>
              <p className="mt-1 text-[11px] text-navy/50">
                {commission.meetingBonusPaidCount} bonus payouts completed
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">
                Meeting Bonus Accrued
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black text-navy">
                  {symbol}
                  {commission.meetingBonusRangeTotal[0].toLocaleString()}
                </span>
                <span className="text-xs text-navy/50">
                  – {symbol}
                  {commission.meetingBonusRangeTotal[1].toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-navy/50">Based on meeting bonus range</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">
                Sourced Deal Revenue
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">
                  ${commission.wonDealValue.toLocaleString()}
                </span>
                <span className="text-xs text-navy/60">({commission.wonDealsCount} won)</span>
              </div>
              <p className="mt-1 text-[11px] text-navy/50">Closed-won project contracts</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">
                Deal Commission Value
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black text-purple">
                  ${commission.dealCommissionRangeTotal[0].toLocaleString()}
                </span>
                <span className="text-xs text-navy/50">
                  – ${commission.dealCommissionRangeTotal[1].toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-navy/50">{rates.deal_commission_percent_min || 10}%–{rates.deal_commission_percent_max || 15}% deal share</p>
            </div>
          </div>
        )}

        {/* Sourced Discovery Calls & Pipeline Deals Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">Sourced Meetings &amp; Pipeline Deals</h2>
              <p className="text-xs text-navy/60">
                Leads and bookings attributed to {employee.full_name} via referral links or manual assignment.
              </p>
            </div>
            <button
              onClick={openAssignModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple/30 bg-purple/5 px-3.5 py-2 text-xs font-bold text-purple hover:bg-purple/10 transition"
            >
              <UserCheck size={14} /> Custom Assign Lead / Deal
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                <tr>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Meeting Date</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Meeting Bonus</th>
                  <th className="py-3 px-4">Deal Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sourcedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy">{b.name}</div>
                      <div className="text-[11px] text-navy/60">
                        {b.company_name} · {b.work_email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-navy/70">
                      {new Date(b.slot_start).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy/70">
                        {(b.stage || b.status || "confirmed").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-navy">
                      ${(Number(b.deal_value) || 8500).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={b.meeting_bonus_payout_status || "pending"}
                        onChange={(e) =>
                          handleUpdateBookingPayout(b.id, "meeting_bonus_payout_status", e.target.value)
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-bold uppercase tracking-wider outline-none ${statusBadgeClass(
                          b.meeting_bonus_payout_status || "pending"
                        )}`}
                      >
                        {PAYOUT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={b.deal_commission_payout_status || "pending"}
                        onChange={(e) =>
                          handleUpdateBookingPayout(b.id, "deal_commission_payout_status", e.target.value)
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-bold uppercase tracking-wider outline-none ${statusBadgeClass(
                          b.deal_commission_payout_status || "pending"
                        )}`}
                      >
                        {PAYOUT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}

                {sourcedBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-navy/50">
                      No discovery calls or deals attributed to this rep yet. Share their referral link or click &ldquo;Custom Assign Lead / Deal&rdquo; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customizable Onboarding Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-navy">Onboarding Checklist</h2>
                <p className="text-xs text-navy/50">
                  {checklist.filter((c) => c.done).length} of {checklist.length} tasks completed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {checklist.length === 0 ? (
                <p className="text-xs text-navy/50">No checklist items.</p>
              ) : (
                checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50 transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(idx, !item.done)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      {item.done ? (
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      ) : (
                        <Circle size={18} className="shrink-0 text-navy/30" />
                      )}
                      <span className={`text-xs ${item.done ? "text-navy/50 line-through" : "text-navy font-medium"}`}>
                        {item.task}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(idx)}
                      className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Custom Task Form */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="Add custom task (e.g. Schedule Shadowing Session)..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
              <button
                type="submit"
                disabled={addingTask || !newTaskInput.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-white hover:bg-navy/90 disabled:opacity-50 transition"
              >
                <Plus size={14} /> Add Task
              </button>
            </form>
          </div>

          {/* Commission & Referral Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-navy">Commission &amp; Referral Settings</h2>
              {ratesSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Check size={14} /> Saved!
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Outreach Sender Identity Section */}
              <div className="rounded-xl border border-purple/20 bg-purple/5 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple">
                    Outreach Sender Identity (Brevo Verified)
                  </span>
                  <span className="text-[10px] text-purple/70 font-medium">Domain: @digitaldude.co.uk</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-navy/70 mb-1">
                      Assigned Outreach Alias Email
                    </label>
                    <input
                      type="email"
                      value={rates.assigned_outreach_email}
                      onChange={(e) => setRates((r) => ({ ...r, assigned_outreach_email: e.target.value }))}
                      placeholder="e.g. alex.sales@digitaldude.co.uk"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono text-navy outline-none focus:border-purple"
                    />
                    <p className="mt-1 text-[10px] text-navy/50">
                      Outgoing &amp; reply email address. Any @digitaldude.co.uk sends without extra Brevo setup.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy/70 mb-1">
                      Outreach Display Name
                    </label>
                    <input
                      type="text"
                      value={rates.outreach_display_name}
                      onChange={(e) => setRates((r) => ({ ...r, outreach_display_name: e.target.value }))}
                      placeholder="e.g. Alex | The Digital Dude"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-navy outline-none focus:border-purple"
                    />
                    <p className="mt-1 text-[10px] text-navy/50">
                      Used in From header &amp; signature. Real personal name is NOT exposed unless typed here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Referral Slug / Code
                  </label>
                  <input
                    type="text"
                    value={rates.referral_code}
                    onChange={(e) => setRates((r) => ({ ...r, referral_code: e.target.value }))}
                    placeholder="e.g. john-doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-mono text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Payout Currency
                  </label>
                  <select
                    value={rates.currency}
                    onChange={(e) => setRates((r) => ({ ...r, currency: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-navy outline-none focus:border-purple focus:bg-white"
                  >
                    <option value="BDT">BDT (৳ Bangladeshi Taka)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Meeting Bonus Min ({symbol})
                  </label>
                  <input
                    type="number"
                    value={rates.meeting_bonus_min}
                    onChange={(e) => setRates((r) => ({ ...r, meeting_bonus_min: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Meeting Bonus Max ({symbol})
                  </label>
                  <input
                    type="number"
                    value={rates.meeting_bonus_max}
                    onChange={(e) => setRates((r) => ({ ...r, meeting_bonus_max: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Deal Comm % Min
                  </label>
                  <input
                    type="number"
                    value={rates.deal_commission_percent_min}
                    onChange={(e) =>
                      setRates((r) => ({ ...r, deal_commission_percent_min: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1">
                    Deal Comm % Max
                  </label>
                  <input
                    type="number"
                    value={rates.deal_commission_percent_max}
                    onChange={(e) =>
                      setRates((r) => ({ ...r, deal_commission_percent_max: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={saveRates}
                  disabled={savingRates}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-2xs transition disabled:opacity-50"
                >
                  {savingRates ? <Loader2 size={13} className="animate-spin" /> : <Save size={14} />}
                  {savingRates ? "Saving…" : "Save Settings & Rates"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Assign Booking Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-navy">
                  Custom Assign Lead / Booking to {employee.full_name}
                </h2>
                <p className="text-xs text-navy/60 mt-0.5">
                  Search through client bookings and attach attribution directly to this rep.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl p-1.5 text-navy/40 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                placeholder="Search leads by client name, company, email..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
              {loadingAllBookings ? (
                <div className="p-8 text-center text-xs text-navy/60">Loading available leads…</div>
              ) : unassignedBookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-navy/60">No bookings match your search.</div>
              ) : (
                unassignedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-navy">{b.name}</div>
                      <div className="text-[11px] text-navy/60">
                        {b.company_name} · {b.work_email}
                      </div>
                      <div className="text-[10px] text-navy/40 mt-0.5">
                        Booked: {new Date(b.slot_start).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={assigningId === b.id}
                      onClick={() => assignBookingToRep(b.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple/90 disabled:opacity-50 transition shadow-2xs"
                    >
                      {assigningId === b.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      {assigningId === b.id ? "Assigning…" : "Assign to Rep"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
