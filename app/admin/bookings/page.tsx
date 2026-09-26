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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateLeadModal } from "@/components/admin/CreateLeadModal";
import Link from "next/link";
import { Plus } from "lucide-react";

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
  admin_notes: string | null;
  meet_url: string | null;
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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected booking for Detail Drawer
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [currentStatus, setCurrentStatus] = useState("confirmed");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function fetchBookings() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "all") query.set("status", statusFilter);

      const res = await fetch(`/api/admin/bookings?${query.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setBookings(data.bookings || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // fetchBookings intentionally excluded: it also reads `search`, but this
    // effect should only auto-fire on statusFilter changes — search is
    // applied explicitly via the refresh button or pressing Enter (see below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openDrawer(b: Booking) {
    setSelectedBooking(b);
    setNotes(b.admin_notes || b.message || "");
    setCurrentStatus(b.status || "confirmed");
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
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBookings((prev) =>
          prev.map((item) =>
            item.id === selectedBooking.id
              ? { ...item, status: currentStatus, admin_notes: notes }
              : item
          )
        );
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: currentStatus, admin_notes: notes } : null
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
              Manage client discovery calls, meeting links, and lead notes.
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
              onClick={fetchBookings}
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
              onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
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
                  <th className="pb-3">Call Time</th>
                  <th className="pb-3">Country</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-4">
                      <p className="font-semibold text-navy">{b.name}</p>
                      <p className="text-xs text-navy/50">{b.work_email}</p>
                    </td>
                    <td className="py-4 font-medium text-navy">
                      {b.company_name}
                      {b.team_size && <span className="block text-xs text-navy/40">Team: {b.team_size}</span>}
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
                ))}

                {bookings.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-navy/50">
                      No bookings match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Meeting Details Modal / Drawer */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
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
                    <label className="block text-xs font-bold uppercase tracking-wide text-navy/60">
                      Internal Notes
                    </label>
                    <textarea
                      rows={4}
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
          onCreated={fetchBookings}
        />
      </div>
    </AdminLayout>
  );
}
