"use client";

import { useState } from "react";
import {
  X,
  UserCheck,
  Mail,
  DollarSign,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface ApplicationForHire {
  id: string;
  applicant_name: string;
  applicant_email: string;
  job_title?: string;
}

interface HireCandidateModalProps {
  application: ApplicationForHire;
  onClose: () => void;
  onSuccess: () => void;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function HireCandidateModal({ application, onClose, onSuccess }: HireCandidateModalProps) {
  const [roleTitle, setRoleTitle] = useState(application.job_title || "Sales Rep (BDE)");
  const [employmentType, setEmploymentType] = useState<"commission" | "salaried">("commission");
  const [currency, setCurrency] = useState<"BDT" | "GBP" | "USD">("BDT");
  const [referralCode, setReferralCode] = useState(slugifyName(application.applicant_name));
  
  const [meetingBonusMin, setMeetingBonusMin] = useState<number>(1000);
  const [meetingBonusMax, setMeetingBonusMax] = useState<number>(2000);
  const [dealCommMin, setDealCommMin] = useState<number>(10);
  const [dealCommMax, setDealCommMax] = useState<number>(15);

  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [customNotes, setCustomNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = currency === "BDT" ? "৳" : currency === "GBP" ? "£" : "$";
  const cleanRefCode = referralCode.trim().toLowerCase();
  const liveReferralUrl = `${SITE_URL}/contact?ref=${cleanRefCode || "rep"}`;

  async function handleHireSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: application.applicant_name,
          email: application.applicant_email,
          role_title: roleTitle,
          employment_type: employmentType,
          currency,
          referral_code: cleanRefCode,
          meeting_bonus_min: Number(meetingBonusMin),
          meeting_bonus_max: Number(meetingBonusMax),
          deal_commission_percent_min: Number(dealCommMin),
          deal_commission_percent_max: Number(dealCommMax),
          source_application_id: application.id,
          send_welcome_email: sendWelcomeEmail,
          custom_welcome_notes: customNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to convert candidate to employee.");
      }

      onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">Convert Candidate to Employee</h2>
              <p className="text-xs text-navy/60">
                Hire <strong className="text-navy">{application.applicant_name}</strong> into the team CRM &amp; initialize onboarding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-navy/40 hover:bg-slate-100 hover:text-navy transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleHireSubmit} className="space-y-5">
          {/* Candidate Profile Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">Candidate Name</span>
              <span className="font-bold text-navy text-sm">{application.applicant_name}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 block">Candidate Email</span>
              <span className="font-mono text-navy text-xs">{application.applicant_email}</span>
            </div>
          </div>

          {/* Role & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                Official Role Title *
              </label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Business Development Executive"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-navy outline-none focus:border-purple font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                Compensation Model
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as "commission" | "salaried")}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy font-semibold outline-none focus:border-purple"
              >
                <option value="commission">Commission + Meeting Bonus (BDE)</option>
                <option value="salaried">Salaried / Fixed Compensation</option>
              </select>
            </div>
          </div>

          {/* Referral Slug & Outreach Link */}
          <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon size={14} /> Unique Rep Referral Code
              </label>
              <span className="text-[11px] text-purple/80 font-medium">Auto-tracks discovery calls</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. john-doe"
                className="w-full rounded-xl border border-purple/20 bg-white p-2.5 text-xs font-mono text-navy outline-none focus:border-purple"
              />
            </div>
            <p className="text-[11px] text-navy/60 font-mono break-all bg-white/70 p-2 rounded-lg border border-purple/10">
              Live link: <span className="text-purple font-bold">{liveReferralUrl}</span>
            </p>
          </div>

          {/* Compensation Rates & Currency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/70 flex items-center gap-1.5">
                <DollarSign size={14} /> Commission &amp; Bonus Parameters
              </h3>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "BDT" | "GBP" | "USD")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-navy outline-none focus:border-purple"
              >
                <option value="BDT">BDT (৳ Taka)</option>
                <option value="GBP">GBP (£ Pound)</option>
                <option value="USD">USD ($ Dollar)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1">
                  Meeting Min ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={meetingBonusMin}
                  onChange={(e) => setMeetingBonusMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1">
                  Meeting Max ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={meetingBonusMax}
                  onChange={(e) => setMeetingBonusMax(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1">
                  Deal Comm % Min
                </label>
                <input
                  type="number"
                  value={dealCommMin}
                  onChange={(e) => setDealCommMin(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1">
                  Deal Comm % Max
                </label>
                <input
                  type="number"
                  value={dealCommMax}
                  onChange={(e) => setDealCommMax(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                />
              </div>
            </div>
          </div>

          {/* Onboarding Welcome Email Dispatch */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="h-4 w-4 rounded text-purple border-slate-300 focus:ring-purple"
              />
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Mail size={14} className="text-purple" /> Send Official Welcome &amp; Onboarding Email to Candidate
              </span>
            </label>

            {sendWelcomeEmail && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-navy/60">
                  Email will include their unique outreach link, compensation structure, and kickoff instructions.
                </p>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Optional custom message or kickoff note to include in the welcome email..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-navy/70 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating Employee Profile…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Complete Hire &amp; Onboard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
