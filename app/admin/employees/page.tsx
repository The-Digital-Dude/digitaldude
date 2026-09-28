"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  RefreshCw,
  Search,
  Users,
  ShieldCheck,
  Send,
  UserPlus,
  CreditCard,
  LogIn,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  X,
  Building,
  Mail,
  Award,
  DollarSign,
  Download,
  Calendar,
  Check,
  TrendingUp,
  AlertCircle,
  Loader2,
  Flame,
  Star,
} from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  status: string;
  referral_code?: string;
  assigned_outreach_email?: string;
  currency?: string;
  created_at: string;
}

interface RepAuditLog {
  id: string;
  employee_id: string;
  action_type: string;
  description: string;
  target_identifier?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    referral_code?: string;
    role_title?: string;
  } | null;
}

interface PayoutItem {
  id: string;
  bookingId: string;
  milestoneType: "meeting_bonus" | "deal_commission";
  clientName: string;
  clientEmail: string;
  companyName: string | null;
  slotStart: string;
  bookingStatus: string;
  stage: string;
  dealValue: number;
  payoutStatus: "pending" | "paid";
  estimatedAmount: number;
  currency: string;
  payoutNotes: string | null;
  payoutDetails: Record<string, string>;
  employee: {
    id: string;
    full_name: string;
    email: string;
    referral_code?: string;
    role_title?: string;
  } | null;
  createdAt: string;
}

interface LeaderboardEntry {
  employeeId: string;
  fullName: string;
  email: string;
  roleTitle: string;
  referralCode: string;
  currency: string;
  discoveryCallsCount: number;
  qualifiedCallsCount: number;
  wonDealsCount: number;
  wonRevenueTotal: number;
  outreachEmailsCount: number;
  earnedCommissionsTotal: number;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offboarded":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function actionTypeBadge(type: string) {
  switch (type) {
    case "outreach_sent":
      return { icon: Send, label: "Outreach Sent", color: "bg-purple/10 text-purple border-purple/20" };
    case "lead_created":
      return { icon: UserPlus, label: "Lead Created", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "lead_updated":
      return { icon: Users, label: "Lead Updated", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "payout_updated":
      return { icon: CreditCard, label: "Payout Modified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "login":
      return { icon: LogIn, label: "Rep Login", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "onboarding_completed":
      return { icon: CheckCircle2, label: "Onboarded", color: "bg-teal-50 text-teal-700 border-teal-200" };
    default:
      return { icon: Clock, label: type, color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

export default function AdminEmployeesPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "payouts" | "leaderboard" | "audit">("employees");

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payouts & Approvals State
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<"all" | "pending" | "paid">("pending");
  const [payoutRepFilter, setPayoutRepFilter] = useState("all");
  const [approvingItem, setApprovingItem] = useState<PayoutItem | null>(null);

  // Approval Modal Inputs
  const [approveAmount, setApproveAmount] = useState<number>(0);
  const [approveTrxId, setApproveTrxId] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [sendNotifyEmail, setSendNotifyEmail] = useState(true);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [timeRange, setTimeRange] = useState<"all_time" | "this_month">("all_time");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<RepAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditRepFilter, setAuditRepFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [inspectingLog, setInspectingLog] = useState<RepAuditLog | null>(null);

  async function fetchEmployees() {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (data.ok) setEmployees(data.employees || []);
    } catch {
      // ignore
    } finally {
      setLoadingEmployees(false);
    }
  }

  const fetchPayoutsAndLeaderboard = useCallback(async () => {
    setLoadingPayouts(true);
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/admin/payouts?time_range=${timeRange}`);
      const data = await res.json();
      if (data.ok) {
        setPayoutItems(data.payoutItems || []);
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPayouts(false);
      setLoadingLeaderboard(false);
    }
  }, [timeRange]);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const params = new URLSearchParams();
      if (auditRepFilter !== "all") params.set("employee_id", auditRepFilter);
      if (auditActionFilter !== "all") params.set("action_type", auditActionFilter);
      if (auditSearch.trim()) params.set("search", auditSearch.trim());

      const res = await fetch(`/api/admin/rep-audit?${params.toString()}`);
      const data = await res.json();
      if (data.ok) setAuditLogs(data.logs || []);
    } catch {
      // ignore
    } finally {
      setLoadingAudit(false);
    }
  }, [auditRepFilter, auditActionFilter, auditSearch]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === "payouts" || activeTab === "leaderboard") {
      fetchPayoutsAndLeaderboard();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, fetchPayoutsAndLeaderboard, fetchAuditLogs]);

  // Open Approval Modal
  function handleOpenApproveModal(item: PayoutItem) {
    setApprovingItem(item);
    setApproveAmount(item.estimatedAmount || 1000);
    setApproveTrxId("");
    setApproveNotes(item.payoutNotes || "");
    setSendNotifyEmail(true);
  }

  // Submit Approval
  async function handleSubmitApproval(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingItem) return;

    setSubmittingApproval(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: approvingItem.bookingId,
          milestoneType: approvingItem.milestoneType,
          payoutStatus: "paid",
          amount: approveAmount,
          transactionReference: approveTrxId,
          notes: approveNotes,
          sendNotificationEmail: sendNotifyEmail,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setApprovingItem(null);
        fetchPayoutsAndLeaderboard();
      } else {
        alert(data.error || "Failed to approve payout.");
      }
    } catch {
      alert("Network error approving payout.");
    } finally {
      setSubmittingApproval(false);
    }
  }

  // Filtered lists
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayouts = payoutItems.filter((item) => {
    const matchesStatus = payoutStatusFilter === "all" || item.payoutStatus === payoutStatusFilter;
    const matchesRep = payoutRepFilter === "all" || item.employee?.id === payoutRepFilter;
    return matchesStatus && matchesRep;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.description.toLowerCase().includes(q) ||
      (log.target_identifier && log.target_identifier.toLowerCase().includes(q)) ||
      (log.employee?.full_name && log.employee.full_name.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Sales Performance &amp; Team Hub</h1>
            <p className="text-sm text-navy/60">
              Manage team onboarding, approve milestone payouts, view the rep leaderboard, and inspect compliance audit logs.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {activeTab === "payouts" && (
              <a
                href="/api/admin/payouts/export"
                download
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-navy hover:bg-slate-50 transition shadow-2xs"
              >
                <Download size={14} className="text-purple" />
                <span>Export CSV Ledger</span>
              </a>
            )}
            <button
              onClick={() => {
                if (activeTab === "employees") fetchEmployees();
                else if (activeTab === "payouts" || activeTab === "leaderboard") fetchPayoutsAndLeaderboard();
                else fetchAuditLogs();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition shadow-2xs"
            >
              <RefreshCw
                size={14}
                className={loadingEmployees || loadingPayouts || loadingAudit ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("employees")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "employees"
                ? "bg-purple text-white shadow-md shadow-purple/20"
                : "bg-white text-navy/70 hover:bg-slate-100"
            }`}
          >
            <Users size={15} />
            <span>Team Roster &amp; Onboarding</span>
            <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{employees.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "payouts"
                ? "bg-purple text-white shadow-md shadow-purple/20"
                : "bg-white text-navy/70 hover:bg-slate-100"
            }`}
          >
            <DollarSign size={15} />
            <span>Payout Approvals &amp; Ledger</span>
            <span className="ml-1 rounded-full bg-amber-500/20 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
              {payoutItems.filter((i) => i.payoutStatus === "pending").length} Pending
            </span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "leaderboard"
                ? "bg-purple text-white shadow-md shadow-purple/20"
                : "bg-white text-navy/70 hover:bg-slate-100"
            }`}
          >
            <Award size={15} />
            <span>Sales Rep Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "audit"
                ? "bg-purple text-white shadow-md shadow-purple/20"
                : "bg-white text-navy/70 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Oversight &amp; Audit Logs</span>
            <span className="ml-1 rounded-full bg-purple/10 text-purple px-2 py-0.5 text-[10px] font-bold">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: EMPLOYEES ROSTER */}
        {/* ===================================================================== */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  placeholder="Search employees by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-navy/60">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-navy outline-none focus:border-purple"
                >
                  <option value="all">All Statuses</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="active">Active</option>
                  <option value="offboarded">Offboarded</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {loadingEmployees ? (
                <div className="p-12 text-center text-xs text-navy/60">Loading employees…</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-xs text-navy/60">
                  No employees found. Convert a candidate from the Applications page to add one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                      <tr>
                        <th className="py-3 px-4">Name &amp; Email</th>
                        <th className="py-3 px-4">Official Role</th>
                        <th className="py-3 px-4">Rep Referral Tag</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-navy">{emp.full_name}</div>
                            <div className="text-[11px] text-navy/60 font-mono">{emp.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-navy/80">{emp.role_title || "—"}</td>
                          <td className="py-3.5 px-4">
                            {emp.referral_code ? (
                              <span className="font-mono text-purple font-bold bg-purple/5 px-2 py-0.5 rounded border border-purple/20">
                                ?ref={emp.referral_code}
                              </span>
                            ) : (
                              <span className="text-navy/40">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                                emp.status
                              )}`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/employees/${emp.id}`}
                              className="text-xs font-bold text-purple hover:underline"
                            >
                              Manage / Onboarding →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: PAYOUT APPROVALS & COMMISSIONS */}
        {/* ===================================================================== */}
        {activeTab === "payouts" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPayoutStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    payoutStatusFilter === "pending"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                  }`}
                >
                  Pending Approvals ({payoutItems.filter((i) => i.payoutStatus === "pending").length})
                </button>
                <button
                  onClick={() => setPayoutStatusFilter("paid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    payoutStatusFilter === "paid"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                  }`}
                >
                  Paid Ledger ({payoutItems.filter((i) => i.payoutStatus === "paid").length})
                </button>
                <button
                  onClick={() => setPayoutStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    payoutStatusFilter === "all"
                      ? "bg-purple text-white shadow-xs"
                      : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                  }`}
                >
                  All Milestones ({payoutItems.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-navy/60">Filter Rep:</label>
                <select
                  value={payoutRepFilter}
                  onChange={(e) => setPayoutRepFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy outline-none focus:border-purple"
                >
                  <option value="all">All Sales Reps</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payout Items Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {loadingPayouts ? (
                <div className="p-12 text-center text-xs text-navy/60">Loading payouts queue…</div>
              ) : filteredPayouts.length === 0 ? (
                <div className="p-12 text-center text-xs text-navy/60">
                  No milestone payouts found for this filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                      <tr>
                        <th className="py-3 px-4">Sales Rep</th>
                        <th className="py-3 px-4">Opportunity / Client</th>
                        <th className="py-3 px-4">Milestone Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payout Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredPayouts.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-navy block">{item.employee?.full_name}</span>
                            <span className="text-[10px] font-mono text-purple">?ref={item.employee?.referral_code}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-navy block">{item.clientName}</span>
                            <span className="text-[11px] text-navy/60 font-mono">{item.clientEmail}</span>
                            {item.companyName && <span className="text-[10px] text-navy/40 block">{item.companyName}</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.milestoneType === "meeting_bonus"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple/10 text-purple border border-purple/20"
                              }`}
                            >
                              {item.milestoneType === "meeting_bonus" ? "Meeting Bonus" : "Deal Commission"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-navy text-sm">
                            {item.currency === "BDT" ? "৳" : item.currency === "GBP" ? "£" : "$"}
                            {item.estimatedAmount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-navy uppercase text-[11px]">
                              {item.payoutDetails?.method || "bKash / Bank"}
                            </span>
                            {item.payoutDetails?.account_number && (
                              <span className="font-mono text-[10px] text-navy/60 block truncate max-w-[130px]">
                                {item.payoutDetails.account_number}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.payoutStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {item.payoutStatus === "paid" ? "Paid / Dispatched" : "Pending Review"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {item.payoutStatus === "pending" ? (
                              <button
                                onClick={() => handleOpenApproveModal(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple/90 shadow-2xs transition"
                              >
                                <Check size={13} />
                                <span>Approve &amp; Pay</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 size={13} /> Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: SALES REP LEADERBOARD */}
        {/* ===================================================================== */}
        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-purple" />
                <div>
                  <h3 className="text-sm font-bold text-navy">Sales Representative Leaderboard</h3>
                  <p className="text-xs text-navy/60">Ranked by Closed Won Revenue &amp; Discovery Calls Held</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeRange("all_time")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timeRange === "all_time"
                      ? "bg-purple text-white shadow-xs"
                      : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setTimeRange("this_month")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timeRange === "this_month"
                      ? "bg-purple text-white shadow-xs"
                      : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {loadingLeaderboard ? (
                <div className="p-12 text-center text-xs text-navy/60">Calculating rankings…</div>
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center text-xs text-navy/60">No representative data yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Sales Representative</th>
                        <th className="py-3 px-4">Discovery Calls</th>
                        <th className="py-3 px-4">Deals Won</th>
                        <th className="py-3 px-4">Won Deal Volume</th>
                        <th className="py-3 px-4">Outreach Emails</th>
                        <th className="py-3 px-4 text-right">Commissions Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {leaderboard.map((rep, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr key={rep.employeeId} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 font-black text-sm">
                              {rank === 1 ? (
                                <span className="inline-flex items-center gap-1 text-amber-500 font-black">
                                  🥇 #1
                                </span>
                              ) : rank === 2 ? (
                                <span className="inline-flex items-center gap-1 text-slate-400 font-black">
                                  🥈 #2
                                </span>
                              ) : rank === 3 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                                  🥉 #3
                                </span>
                              ) : (
                                <span className="text-navy/50 font-bold">#{rank}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-navy text-sm">{rep.fullName}</div>
                                {rank <= 3 && <Flame size={14} className="text-amber-500 fill-amber-500" />}
                              </div>
                              <div className="text-[11px] text-navy/60 font-mono">{rep.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-navy">{rep.discoveryCallsCount}</span>
                              <span className="text-[10px] text-emerald-600 block">
                                {rep.qualifiedCallsCount} qualified
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-navy">{rep.wonDealsCount}</td>
                            <td className="py-3.5 px-4 font-mono font-black text-navy text-sm">
                              {rep.currency === "BDT" ? "৳" : rep.currency === "GBP" ? "£" : "$"}
                              {rep.wonRevenueTotal.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-navy/70">{rep.outreachEmailsCount}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                              {rep.currency === "BDT" ? "৳" : rep.currency === "GBP" ? "£" : "$"}
                              {rep.earnedCommissionsTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: REP AUDIT & ACTIVITY LOGS */}
        {/* ===================================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  placeholder="Search audit trail by prospect email, description, or rep name…"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-navy/60">Rep:</label>
                  <select
                    value={auditRepFilter}
                    onChange={(e) => setAuditRepFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-navy outline-none focus:border-purple"
                  >
                    <option value="all">All Reps</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-navy/60">Action:</label>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-navy outline-none focus:border-purple"
                  >
                    <option value="all">All Actions</option>
                    <option value="outreach_sent">Outreach Sent</option>
                    <option value="lead_created">Lead Created</option>
                    <option value="lead_updated">Lead Updated</option>
                    <option value="payout_updated">Payout Modified</option>
                    <option value="login">Rep Login</option>
                    <option value="onboarding_completed">Onboarded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {loadingAudit ? (
                <div className="p-12 text-center text-xs text-navy/60">Loading audit records…</div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-navy/60">
                  No audit logs found matching your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Sales Rep</th>
                        <th className="py-3 px-4">Action Type</th>
                        <th className="py-3 px-4">Event Description</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredAuditLogs.map((log) => {
                        const badge = actionTypeBadge(log.action_type);
                        const IconComponent = badge.icon;
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 text-navy/60 whitespace-nowrap font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-navy block">{log.employee?.full_name || "Unknown Rep"}</span>
                              <span className="text-[10px] text-navy/50 font-mono">{log.employee?.email}</span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.color}`}
                              >
                                <IconComponent size={12} />
                                <span>{badge.label}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-navy/80 max-w-md">
                              <p className="line-clamp-2">{log.description}</p>
                              {log.target_identifier && (
                                <span className="text-[10px] text-purple font-mono block mt-0.5">
                                  Target: {log.target_identifier}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setInspectingLog(log)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-bold text-navy transition"
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* APPROVE & PAY MODAL */}
      {/* ========================================================================= */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Approve &amp; Record Payout</h3>
                  <p className="text-xs text-navy/60">
                    Disburse milestone payment to <strong>{approvingItem.employee?.full_name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovingItem(null)}
                className="p-1.5 rounded-lg text-navy/40 hover:bg-slate-100 hover:text-navy transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitApproval} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Rep Payout Summary */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Milestone</span>
                    <span className="font-bold text-navy uppercase">
                      {approvingItem.milestoneType === "meeting_bonus" ? "Meeting Bonus" : "Deal Commission"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Opportunity</span>
                    <span className="font-bold text-navy">{approvingItem.clientName} ({approvingItem.companyName || "No Company"})</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Preferred Method</span>
                    <span className="font-bold text-purple uppercase">
                      {approvingItem.payoutDetails?.method || "bKash / Bank"} (
                      {approvingItem.payoutDetails?.account_number || "No number on file"})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Disbursed Payout Amount ({approvingItem.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy font-mono font-bold outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Payment Reference / TrxID *
                  </label>
                  <input
                    type="text"
                    required
                    value={approveTrxId}
                    onChange={(e) => setApproveTrxId(e.target.value)}
                    placeholder="e.g. bKash TrxID BL920392 / Bank Wire #9932"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy font-mono outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Admin Settlement Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Settlement notes or reference details..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={sendNotifyEmail}
                    onChange={(e) => setSendNotifyEmail(e.target.checked)}
                    className="h-4 w-4 rounded text-purple border-slate-300 focus:ring-purple"
                  />
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Mail size={13} className="text-purple" /> Send Official Payment Confirmation Email to Rep via Brevo
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setApprovingItem(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy/70 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproval}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 transition shadow-md disabled:opacity-50"
                >
                  {submittingApproval ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Disbursing Payment…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Confirm &amp; Disburse
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT LOG DETAIL INSPECTION MODAL */}
      {/* ========================================================================= */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple/10 text-purple flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Audit Log Event Inspection</h3>
                  <span className="text-[10px] text-navy/50 font-mono">{inspectingLog.id}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg text-navy/40 hover:bg-slate-100 hover:text-navy transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Sales Rep</span>
                  <span className="font-bold text-navy text-sm">{inspectingLog.employee?.full_name || "Unknown"}</span>
                  <span className="text-[11px] text-navy/60 font-mono block">{inspectingLog.employee?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">Timestamp</span>
                  <span className="font-mono text-navy font-semibold">{new Date(inspectingLog.created_at).toLocaleString()}</span>
                  {inspectingLog.ip_address && (
                    <span className="text-[10px] text-navy/40 font-mono block">IP: {inspectingLog.ip_address}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block mb-1">
                  Event Description
                </span>
                <p className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-navy font-medium leading-relaxed">
                  {inspectingLog.description}
                </p>
              </div>

              {inspectingLog.metadata && Object.keys(inspectingLog.metadata).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block mb-1">
                    Event Payload / Metadata
                  </span>
                  <pre className="rounded-xl bg-slate-950 p-3.5 text-[11px] text-emerald-400 font-mono overflow-x-auto">
                    {JSON.stringify(inspectingLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple/90 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
