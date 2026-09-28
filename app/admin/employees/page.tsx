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
  const [activeTab, setActiveTab] = useState<"employees" | "audit">("employees");

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
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
            <h1 className="text-2xl font-bold tracking-tight text-navy">Employees &amp; Sales Rep CRM</h1>
            <p className="text-sm text-navy/60">
              Manage internal team members, onboarding checklists, and inspect live Sales Rep outreach &amp; CRM audit logs.
            </p>
          </div>
          <button
            onClick={() => (activeTab === "employees" ? fetchEmployees() : fetchAuditLogs())}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={loadingEmployees || loadingAudit ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Dual Tab Navigator */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("employees")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
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
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "audit"
                ? "bg-purple text-white shadow-md shadow-purple/20"
                : "bg-white text-navy/70 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Rep Oversight &amp; Audit Logs</span>
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
                  No employees found. Convert a hired application from the Applications page to add one.
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
        {/* TAB 2: REP AUDIT & ACTIVITY LOGS */}
        {/* ===================================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            {/* Filter Bar */}
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

            {/* Audit Logs Table */}
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
      {/* AUDIT LOG DETAIL INSPECTION MODAL */}
      {/* ========================================================================= */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
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

            {/* Body */}
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

            {/* Footer */}
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
