"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CrmStage, LeadScore, CRM_STAGES } from "@/lib/crm";
import {
  ArrowLeft,
  Sparkles,
  Building,
  User,
  Mail,
  DollarSign,
  Calendar,
  Send,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export default function NewBookingLeadPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [teamSize, setTeamSize] = useState("1-10");
  const [stage, setStage] = useState<CrmStage>("new_booking");
  const [dealValue, setDealValue] = useState<number>(8500);
  const [leadScore, setLeadScore] = useState<LeadScore>("warm");
  const [slotStart, setSlotStart] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [message, setMessage] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [meetUrl, setMeetUrl] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !workEmail.trim() || !companyName.trim()) {
      setErrorMsg("Please complete Name, Work Email, and Company Name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          work_email: workEmail.trim().toLowerCase(),
          company_name: companyName.trim(),
          country: country.trim(),
          team_size: teamSize,
          message: message.trim(),
          slot_start: slotStart ? new Date(slotStart).toISOString() : new Date().toISOString(),
          meet_url: meetUrl.trim() || undefined,
          stage,
          deal_value: Number(dealValue) || 8500,
          lead_score: leadScore,
          lead_notes: leadNotes.trim(),
          send_welcome_email: sendWelcomeEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create custom lead.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating booking.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-navy/60 hover:text-navy transition"
          >
            <ArrowLeft size={14} /> Back to CRM Pipeline
          </Link>
          <span className="text-xs font-semibold text-navy/40">CRM Lead Ingestion</span>
        </div>

        {/* Title Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple mb-2">
            <Sparkles size={14} />
            <span>Manual Lead & Booking Creator</span>
          </div>
          <h1 className="text-2xl font-black text-navy">Add Custom Lead / Deal</h1>
          <p className="text-xs md:text-sm text-navy/60 mt-1 max-w-2xl">
            Create an offline prospect, referred enterprise client, or manual booking. This lead will immediately reflect in your CRM Kanban board with valuation analytics.
          </p>

          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Lead successfully created and added to pipeline! Redirecting to CRM...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700 animate-in fade-in">
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Section 1: Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50 border-b border-slate-100 pb-2">
                1. Contact & Organization
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Contact Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Sterling"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="e.g. rachel@sterlinglegal.co.uk"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Sterling Legal Tech"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Country / Headquarters
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Company Size
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  >
                    <option value="1-10">1-10 team members</option>
                    <option value="11-50">11-50 team members</option>
                    <option value="51-200">51-200 team members</option>
                    <option value="200+">200+ Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: CRM Pipeline Valuation & Stage */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50 border-b border-slate-100 pb-2">
                2. CRM Metrics & Pipeline Stage
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CrmStage)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white transition"
                  >
                    {CRM_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Estimated Deal Value (£)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Lead Score
                  </label>
                  <select
                    value={leadScore}
                    onChange={(e) => setLeadScore(e.target.value as LeadScore)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-navy outline-none focus:border-purple focus:bg-white transition"
                  >
                    <option value="hot">🔥 Hot (High Budget / Ready to Start)</option>
                    <option value="warm">⚡ Warm (Discovery Phase)</option>
                    <option value="cold">❄️ Cold (Long Term Nurture)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Schedule & Meeting Link */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50 border-b border-slate-100 pb-2">
                3. Call Scheduling & Virtual Room
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Discovery Call Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Virtual Meeting URL (Google Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    value={meetUrl}
                    onChange={(e) => setMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Project Scope & Internal Notes */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50 border-b border-slate-100 pb-2">
                4. Scope & Internal Brief
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Client Scope / Project Description
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe their business problem, legacy tools to replace, or requirements."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                    Internal Agency Notes
                  </label>
                  <textarea
                    rows={4}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Notes for the team, technical stack requirements, key stakeholders."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Brevo Automated Email Dispatch Box */}
            <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Send size={14} className="text-purple" /> Send Welcome & Discovery Follow-up via Brevo
                </span>
                <p className="text-xs text-navy/60">
                  Automatically delivers an introduction email with next steps and our discovery overview.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple"></div>
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Link
                href="/admin"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting || success}
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-7 py-3 text-xs font-bold text-white hover:bg-purple/90 shadow-md shadow-purple/20 transition disabled:opacity-50"
              >
                {submitting ? "Creating Lead…" : "Save & Add to Pipeline"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
