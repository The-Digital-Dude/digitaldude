"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Search,
  Video,
  Edit3,
  Calendar,
  Building,
  Mail,
  Globe,
  Users,
  CheckCircle2,
  X,
  RefreshCw,
  UserCheck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateLeadModal } from "@/components/admin/CreateLeadModal";
import { Plus } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";

interface EmployeeRef {
  id: string;
  full_name: string;
  email: string;
  referral_code?: string;
}

interface Booking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  team_size: string | null;
  message: string | null;
  slot_start: string;
  slot_end: string;
  status: string;
  stage?: string;
  deal_value?: number;
  admin_notes: string | null;
  meet_url: string | null;
  sourced_by_employee_id: string | null;
  sourced_by_employee?: EmployeeRef | null;
  meeting_bonus_payout_status?: string;
  deal_commission_payout_status?: string;
  payout_notes?: string;
  created_at: string;
}

const statusOptions = [
  "confirmed",
  "lead_qualified",
  "proposal_sent",
  "won",
  "completed",
  "cancelled",
];

const PAYOUT_STATUS_OPTIONS = ["pending", "approved", "paid"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<EmployeeRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Selected booking for Detail Drawer
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [currentStatus, setCurrentStatus] = useState("confirmed");
  const [currentRepId, setCurrentRepId] = useState<string>("");
  const [meetingBonusPayoutStatus, setMeetingBonusPayoutStatus] = useState("pending");
  const [dealCommissionPayoutStatus, setDealCommissionPayoutStatus] = useState("pending");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (data.ok) {
        setEmployees(data.employees || []);
      }
    } catch {
      // ignore
    }
  }

  async function fetchBookings(opts?: { resetPage?: boolean }) {
    setLoading(true);
    try {
      const targetPage = opts?.resetPage ? 1 : page;
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "all") query.set("status", statusFilter);
      query.set("page", String(targetPage));
      query.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/bookings?${query.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setBookings(data.bookings || []);
        setTotalCount(data.totalCount ?? (data.bookings || []).length);
        if (opts?.resetPage) setPage(1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchBookings({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function openDrawer(b: Booking) {
    setSelectedBooking(b);
    setNotes(b.admin_notes || b.message || "");
    setCurrentStatus(b.status || "confirmed");
    setCurrentRepId(b.sourced_by_employee_id || "");
    setMeetingBonusPayoutStatus(b.meeting_bonus_payout_status || "pending");
    setDealCommissionPayoutStatus(b.deal_commission_payout_status || "pending");
  }

  async function handleUpdateBooking() {
    if (!selectedBooking) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus,
          admin_notes: notes,
          sourced_by_employee_id: currentRepId || null,
          meeting_bonus_payout_status: meetingBonusPayoutStatus,
          deal_commission_payout_status: dealCommissionPayoutStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const assignedEmp = employees.find((e) => e.id === currentRepId) || null;
        setBookings((prev) =>
          prev.map((item) =>
            item.id === selectedBooking.id
              ? {
                  ...item,
                  status: currentStatus,
                  admin_notes: notes,
                  sourced_by_employee_id: currentRepId || null,
                  sourced_by_employee: assignedEmp,
                  meeting_bonus_payout_status: meetingBonusPayoutStatus,
                  deal_commission_payout_status: dealCommissionPayoutStatus,
                }
              : item
          )
        );
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                status: currentStatus,
                admin_notes: notes,
                sourced_by_employee_id: currentRepId || null,
                sourced_by_employee: assignedEmp,
                meeting_bonus_payout_status: meetingBonusPayoutStatus,
                deal_commission_payout_status: dealCommissionPayoutStatus,
              }
            : null
        );
      }
    } catch {
      // ignore
    } finally {
      setSavingNotes(false);
    }
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy">Meetings &amp; Bookings CRM</h1>
            <p className="mt-1 text-sm text-navy/60">
              Manage client discovery calls, rep attribution, meeting links, and lead notes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-purple/90 transition"
            >
              <Plus size={15} /> Add Custom Lead
            </button>

            <button
              onClick={() => fetchBookings()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy/70 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, company, email, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBookings({ resetPage: true })}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-purple focus:outline-none"
            />
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", "confirmed", "lead_qualified", "proposal_sent", "won", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  statusFilter === s
                    ? "bg-purple text-white"
                    : "bg-slate-100 text-navy/70 hover:bg-slate-200"
                )}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-navy/50">
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Sourced By (Rep)</th>
                  <th className="pb-3">Call Time</th>
                  <th className="pb-3">Country</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const rep = b.sourced_by_employee || employees.find((e) => e.id === b.sourced_by_employee_id);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-4">
                        <p className="font-semibold text-navy">{b.name}</p>
                        <p className="text-xs text-navy/50">{b.work_email}</p>
                      </td>
                      <td className="py-4 font-medium text-navy">
                        {b.company_name}
                        {b.team_size && <span className="block text-xs text-navy/40">Team: {b.team_size}</span>}
                      </td>
                      <td className="py-4">
                        {rep ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                            <UserCheck size={12} /> {rep.full_name}
                          </span>
                        ) : (
                          <span className="text-xs text-navy/40 italic">Direct / Organic</span>
                        )}
                      </td>
                      <td className="py-4 text-navy">
                        <span className="font-semibold">{formatDateTime(b.slot_start)}</span>
                      </td>
                      <td className="py-4 text-navy/70">{b.country}</td>
                      <td className="py-4">
                        <span className="inline-block rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold capitalize text-purple">
                          {(b.status || b.stage || "confirmed").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.meet_url && (
                            <a
                              href={b.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <Video size={14} /> Meet
                            </a>
                          )}
                          <button
                            onClick={() => openDrawer(b)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy/70 hover:bg-slate-50 hover:text-purple"
                          >
                            <Edit3 size={14} /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {bookings.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-navy/50">
                      No bookings match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        {/* Meeting Details Modal / Drawer */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">
                    {selectedBooking.name} &mdash; {selectedBooking.company_name}
                  </h2>
                  <p className="text-xs text-navy/50">
                    Booked on {new Date(selectedBooking.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2 text-navy">
                    <Calendar size={16} className="text-purple" />
                    <strong>{formatDateTime(selectedBooking.slot_start)}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-navy/80">
                    <Mail size={16} className="text-purple" />
                    <a href={`mailto:${selectedBooking.work_email}`} className="hover:underline">
                      {selectedBooking.work_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-navy/80">
                    <Building size={16} className="text-purple" />
                    {selectedBooking.company_name}
                  </div>
                  <div className="flex items-center gap-2 text-navy/80">
                    <Globe size={16} className="text-purple" />
                    {selectedBooking.country}
                  </div>
                  <div className="flex items-center gap-2 text-navy/80">
                    <Users size={16} className="text-purple" />
                    Team: {selectedBooking.team_size || "Not specified"}
                  </div>

                  {selectedBooking.meet_url && (
                    <div className="pt-2">
                      <a
                        href={selectedBooking.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple py-2 text-xs font-bold text-white hover:brightness-110"
                      >
                        <Video size={16} /> Open Google Meet Room
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-navy/60">
                      Update Status
                    </label>
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm capitalize focus:border-purple focus:outline-none"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt} className="capitalize">
                          {opt.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-navy/60 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-purple" /> Assigned Sourced Rep (BDE)
                    </label>
                    <select
                      value={currentRepId}
                      onChange={(e) => setCurrentRepId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-purple focus:outline-none"
                    >
                      <option value="">— Direct / Unassigned —</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payout Status Controls if attributed to rep */}
                  {currentRepId && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                        <Award size={13} /> Commission &amp; Bonus Status
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-navy/60 mb-0.5">
                            Meeting Bonus
                          </label>
                          <select
                            value={meetingBonusPayoutStatus}
                            onChange={(e) => setMeetingBonusPayoutStatus(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs capitalize outline-none"
                          >
                            {PAYOUT_STATUS_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-navy/60 mb-0.5">
                            Deal Commission
                          </label>
                          <select
                            value={dealCommissionPayoutStatus}
                            onChange={(e) => setDealCommissionPayoutStatus(e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs capitalize outline-none"
                          >
                            {PAYOUT_STATUS_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-navy/60">
                      Internal Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add follow-up notes, proposal details, or client discussion points…"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-purple focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* What they would like to fix */}
              <div className="mt-4 rounded-xl border border-tint bg-lavender p-4">
                <span className="text-xs font-bold uppercase text-purple">
                  What they want to fix:
                </span>
                <p className="mt-1 text-sm text-navy/80">
                  {selectedBooking.message || "No custom message provided during booking."}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy/70 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateBooking}
                  disabled={savingNotes}
                  className="flex items-center gap-1.5 rounded-xl bg-purple px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {savingNotes ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Custom Lead Modal */}
        <CreateLeadModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => fetchBookings({ resetPage: true })}
        />
      </div>
    </AdminLayout>
  );
}
