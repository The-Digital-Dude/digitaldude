"use client";

import { useState, useEffect } from "react";
import { CrmStage, LeadScore, CRM_STAGES, BookingLead } from "@/lib/crm";
import {
  Sparkles,
  Send,
  X,
  ShieldAlert,
  Mail,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStage?: CrmStage;
  onCreated: (lead?: BookingLead) => void;
}

const EMAIL_TEMPLATE_OPTIONS = [
  {
    id: "inbound_welcome",
    name: "✨ New Inbound Lead Welcome & Intro",
    defaultSubject: (name: string, company: string) =>
      `Thanks for reaching out, ${name ? name.split(" ")[0] : "there"} — Next steps for ${company || "your team"}`,
    defaultBody: (name: string, company: string, notes: string) =>
      `Thank you for reaching out to The Digital Dude regarding software architecture and digital systems for ${company || "your organization"}.\n\n` +
      `Our engineering team has received your project inquiry and is reviewing your requirements.\n\n` +
      (notes ? `Key notes:\n${notes}\n\n` : "") +
      `What Happens Next:\n` +
      `- Initial Architecture Review: We evaluate your scope, database models, and target integrations.\n` +
      `- Discovery Call: A 30-minute scoping session to map milestones, tech stack, and deliverable timeline.\n` +
      `- Milestone Specification: We draft a comprehensive technical specification and fixed-cost proposal.\n\n` +
      `If you have an RFP, wireframe deck, or workflow document ready, please reply directly to this email with your files attached.`,
  },
  {
    id: "cold_outreach",
    name: "🚀 Cold Outreach & B2B Introduction",
    defaultSubject: (name: string, company: string) =>
      `Streamlining operations & custom software architecture for ${company || "your team"}`,
    defaultBody: (name: string, company: string, notes: string) =>
      `Hi ${name ? name.split(" ")[0] : "there"},\n\n` +
      `I came across ${company || "your organization"} and wanted to reach out directly.\n\n` +
      `At The Digital Dude, we partner with growing businesses to replace disconnected spreadsheets and legacy tools with high-performance, bespoke web applications and automated workflows.\n\n` +
      (notes ? `Context:\n${notes}\n\n` : "") +
      `Key Advantages:\n` +
      `- Bespoke Web Systems: Engineered specifically for your operational workflows.\n` +
      `- Process Automation: Eliminate manual data entry, fragmented apps, and admin overhead.\n` +
      `- 100% IP Ownership: Zero recurring seat licensing; complete ownership of your codebase.\n\n` +
      `Would you be open to a brief 30-minute discovery call next week to explore where custom software could accelerate your operations?`,
  },
  {
    id: "discovery_followup",
    name: "📞 Discovery Follow-up & Next Steps",
    defaultSubject: (name: string, company: string) =>
      `Great speaking today, ${name ? name.split(" ")[0] : "there"} — Next steps for ${company || "your team"}`,
    defaultBody: (name: string, company: string, notes: string) =>
      `Thank you for taking the time to walk us through the operational challenges and growth vision for ${company || "your business"}.\n\n` +
      (notes ? `Key discussion notes:\n${notes}\n\n` : "") +
      `Our Next Steps:\n` +
      `- Our architecture team is finalizing the module deliverable matrix and database schema.\n` +
      `- We will deliver your bespoke Technical Specification & Milestone Proposal within 24–48 hours.\n` +
      `- We will schedule a quick 15-minute alignment call to review wireframe concepts before kickoff.\n\n` +
      `If you have any extra documentation, spreadsheet samples, or workflow diagrams to share in the meantime, simply reply directly to this email.`,
  },
  {
    id: "proposal_delivery",
    name: "📄 Proposal & Architecture Spec Delivery",
    defaultSubject: (name: string, company: string) =>
      `Technical Architecture Specification & Project Scope — ${company || "Your Project"} × The Digital Dude`,
    defaultBody: (name: string, company: string) =>
      `Following our discussion, our technical architecture team has drafted a comprehensive, bespoke technical specification and milestone roadmap for ${company || "your organization"}.\n\n` +
      `Key Scope Highlights:\n` +
      `- Milestone 1: Core Database Architecture, Authentication & Role-Based Access Control.\n` +
      `- Milestone 2: Automated Workflows, Real-Time API Integrations & Admin Control Room.\n` +
      `- Milestone 3: Security Hardening, QA Testing & Production Deployment.\n\n` +
      `You can review and download the interactive specification (PDF) from your private client link. Please let us know if any milestone adjustments are required before we lock in the sprint schedule.`,
  },
  {
    id: "proposal_checkin",
    name: "⏱️ Proposal Review & Scheduling Check-in",
    defaultSubject: (name: string, company: string) =>
      `Checking in on your architecture specification — ${company || "your team"}`,
    defaultBody: (name: string, company: string) =>
      `I wanted to check in and see if you and the team at ${company || "your company"} had a chance to review the architecture specification we prepared for you.\n\n` +
      `We are currently booking engineering sprint slots for the upcoming month. If you'd like to discuss any scope refinements, milestone adjustments, or payment structuring, please let me know!`,
  },
  {
    id: "custom",
    name: "✉️ Custom Direct Message",
    defaultSubject: (name: string, company: string) =>
      `Update regarding your software project — ${company || "your team"}`,
    defaultBody: (name: string, company: string) =>
      `Hello ${name ? name.split(" ")[0] : "there"},\n\n` +
      `Thank you for reaching out to The Digital Dude. We are excited about the opportunity to partner with ${company || "your team"}.\n\n` +
      `Please let us know if you have any questions or when you are available for a brief sync.`,
  },
];

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

  // Email Customization State
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("discovery_followup");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSubjectCustomized, setIsSubjectCustomized] = useState(false);
  const [isBodyCustomized, setIsBodyCustomized] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Keep stage in sync with defaultStage prop
  useEffect(() => {
    if (defaultStage) {
      setStage(defaultStage);
    }
  }, [defaultStage]);

  // Recalculate default subject and body when template, name, company, or notes change
  useEffect(() => {
    const currentTpl =
      EMAIL_TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplateId) ||
      EMAIL_TEMPLATE_OPTIONS[0];

    if (!isSubjectCustomized) {
      setEmailSubject(currentTpl.defaultSubject(name, companyName));
    }
    if (!isBodyCustomized) {
      setEmailBody(currentTpl.defaultBody(name, companyName, leadNotes || message));
    }
  }, [selectedTemplateId, name, companyName, leadNotes, message, isSubjectCustomized, isBodyCustomized]);

  if (!isOpen) return null;

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const newTpl =
      EMAIL_TEMPLATE_OPTIONS.find((t) => t.id === tplId) ||
      EMAIL_TEMPLATE_OPTIONS[0];
    setEmailSubject(newTpl.defaultSubject(name, companyName));
    setEmailBody(newTpl.defaultBody(name, companyName, leadNotes || message));
    setIsSubjectCustomized(false);
    setIsBodyCustomized(false);
  };

  const handleResetEmail = () => {
    const currentTpl =
      EMAIL_TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplateId) ||
      EMAIL_TEMPLATE_OPTIONS[0];
    setEmailSubject(currentTpl.defaultSubject(name, companyName));
    setEmailBody(currentTpl.defaultBody(name, companyName, leadNotes || message));
    setIsSubjectCustomized(false);
    setIsBodyCustomized(false);
  };

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
          custom_email_subject: sendWelcomeEmail ? emailSubject.trim() : undefined,
          custom_email_body: sendWelcomeEmail ? emailBody.trim() : undefined,
          email_template_id: sendWelcomeEmail ? selectedTemplateId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create lead.");
      }

      onCreated(data.booking);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving lead.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
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
            Manually insert an inbound booking, referred enterprise lead, or offline deal directly into the pipeline with custom email dispatch.
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
                rows={2}
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
                rows={2}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="e.g. Budget approved for Q4. Met at London Tech Summit."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Email Dispatch & Live Customizer Box */}
          <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Send size={13} className="text-purple" /> Send Client Email via Brevo
                </span>
                <p className="text-[11px] text-navy/60">
                  Deliver an introductory follow-up, specification delivery, or custom message to {workEmail || "client"}.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWelcomeEmail}
                  onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple"></div>
              </label>
            </div>

            {/* Expandable Email Customizer when toggle is ON */}
            {sendWelcomeEmail && (
              <div className="pt-3 border-t border-purple/15 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple flex items-center gap-1">
                    <Mail size={12} /> Email Template & Content Editor
                  </span>
                  <button
                    type="button"
                    onClick={handleResetEmail}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple/80 hover:text-purple self-start sm:self-auto"
                  >
                    <RotateCcw size={10} /> Reset to template default
                  </button>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Choose Email Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EMAIL_TEMPLATE_OPTIONS.map((tpl) => (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => handleTemplateChange(tpl.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition ${
                          selectedTemplateId === tpl.id
                            ? "bg-white border-purple text-purple shadow-xs ring-1 ring-purple/20"
                            : "bg-white/60 border-slate-200 text-navy/70 hover:bg-white hover:text-navy"
                        }`}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Subject */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Email Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={sendWelcomeEmail}
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setIsSubjectCustomized(true);
                    }}
                    placeholder="Enter email subject line..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy font-semibold outline-none focus:border-purple shadow-xs"
                  />
                </div>

                {/* Editable Email Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70">
                      Email Message Content
                    </label>
                    <span className="text-[10px] text-navy/50">
                      Supports bullet lines (- item)
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    required={sendWelcomeEmail}
                    value={emailBody}
                    onChange={(e) => {
                      setEmailBody(e.target.value);
                      setIsBodyCustomized(true);
                    }}
                    placeholder="Type or customize your email message here..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-navy font-mono leading-relaxed outline-none focus:border-purple shadow-xs"
                  />
                </div>

                {/* Delivery details badge */}
                <div className="rounded-xl bg-purple/10 p-2.5 flex items-center justify-between text-[11px] text-purple">
                  <span className="font-semibold">
                    Sender: info@digitaldude.co.uk (The Digital Dude)
                  </span>
                  <span className="font-bold text-[10px] uppercase tracking-wider">
                    Brevo Transactional API
                  </span>
                </div>
              </div>
            )}
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
