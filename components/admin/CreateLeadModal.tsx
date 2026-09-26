"use client";

import { useState } from "react";
import { CrmStage, LeadScore, CRM_STAGES } from "@/lib/crm";
import { User, Building, Mail, Phone, Calendar, DollarSign, Sparkles, MessageSquare, Send, X, ShieldAlert } from "lucide-react";

export interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStage?: CrmStage;
  onCreated: () => void;
}

export function CreateLeadModal({
  isOpen,
  onClose,
  defaultStage = "new_booking",
  onCreated,
}: CreateLeadModalProps) {
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [teamSize, setTeamSize] = useState("1-10");
  const [stage, setStage] = useState<CrmStage>(defaultStage);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !workEmail.trim() || !companyName.trim()) {
      setErrorMsg("Please fill in Name, Work Email, and Company Name.");
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
        throw new Error(data.error || "Failed to create lead.");
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving lead.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-navy/40 hover:bg-slate-100 hover:text-navy transition"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-purple/10 px-2.5 py-1 text-xs font-bold text-purple">
            <Sparkles size={13} />
            <span>CRM Pipeline</span>
          </div>
          <h2 className="text-xl font-black text-navy mt-1.5">Add Custom Lead / Deal</h2>
          <p className="text-xs text-navy/60">
            Manually insert an inbound booking, referred enterprise lead, or offline deal directly into the pipeline.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Client / Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="e.g. alex@company.co.uk"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Company & Country */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Logistics Ltd"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Country / Region
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Team Size
              </label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              >
                <option value="1-10">1-10 members</option>
                <option value="11-50">11-50 members</option>
                <option value="51-200">51-200 members</option>
                <option value="200+">200+ Enterprise</option>
              </select>
            </div>
          </div>

          {/* Row 3: Pipeline Stage, Valuation, Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Initial Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CrmStage)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white"
              >
                {CRM_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Estimated Deal Value (£)
              </label>
              <input
                type="number"
                step="500"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Lead Score
              </label>
              <select
                value={leadScore}
                onChange={(e) => setLeadScore(e.target.value as LeadScore)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple focus:bg-white"
              >
                <option value="hot">🔥 Hot (High Intent)</option>
                <option value="warm">⚡ Warm (Standard)</option>
                <option value="cold">❄️ Cold (Nurture)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Meeting Slot & Meet Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Scheduled Call / Target Date
              </label>
              <input
                type="datetime-local"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Meeting Room URL (Optional)
              </label>
              <input
                type="url"
                value={meetUrl}
                onChange={(e) => setMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Row 5: Brief & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Project Scope / Client Request
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Looking to replace Airtable + Zapier setup with a dedicated Next.js CRM."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Internal CRM Notes
              </label>
              <textarea
                rows={3}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="e.g. Budget approved for Q4. Met at London Tech Summit."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Brevo Email Dispatch Toggle */}
          <div className="rounded-2xl border border-purple/20 bg-purple/5 p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Send size={13} className="text-purple" /> Send Welcome / Discovery Email via Brevo
              </span>
              <p className="text-[11px] text-navy/60">
                Immediately emails the client with our agency intro and next steps.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple"></div>
            </label>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-xs transition disabled:opacity-50"
            >
              {submitting ? "Adding Lead…" : "Create & Add to Pipeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
