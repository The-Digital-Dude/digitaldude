"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CrmStage, LeadScore, CRM_STAGES } from "@/lib/crm";
import {
  ArrowLeft,
  Sparkles,
  Send,
  ShieldAlert,
  CheckCircle2,
  Mail,
  RotateCcw,
} from "lucide-react";

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
      `Would you be open to a brief 15-minute introductory call next week to explore where custom software could accelerate your operations?`,
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

  // Email Customization State
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("discovery_followup");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSubjectCustomized, setIsSubjectCustomized] = useState(false);
  const [isBodyCustomized, setIsBodyCustomized] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

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
          custom_email_subject: sendWelcomeEmail ? emailSubject.trim() : undefined,
          custom_email_body: sendWelcomeEmail ? emailBody.trim() : undefined,
          email_template_id: sendWelcomeEmail ? selectedTemplateId : undefined,
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
            Create an offline prospect, referred enterprise client, or manual booking. This lead will immediately reflect in your CRM Kanban board with valuation analytics and dispatch customizable emails.
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
                    rows={3}
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
                    rows={3}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Notes for the team, technical stack requirements, key stakeholders."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Brevo Automated Email Dispatch Box with Full Editor */}
            <div className="rounded-2xl border border-purple/20 bg-purple/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Send size={14} className="text-purple" /> Send Client Email via Brevo
                  </span>
                  <p className="text-xs text-navy/60">
                    Automatically delivers a tailored introductory follow-up, architecture brief, or custom direct email to {workEmail || "client"}.
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

              {/* Expandable Email Customizer when toggle is ON */}
              {sendWelcomeEmail && (
                <div className="pt-4 border-t border-purple/15 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
                      <Mail size={13} /> Email Template & Message Content Editor
                    </span>
                    <button
                      type="button"
                      onClick={handleResetEmail}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple/80 hover:text-purple self-start sm:self-auto"
                    >
                      <RotateCcw size={11} /> Reset to template default
                    </button>
                  </div>

                  {/* Template Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
                      Choose Email Template
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {EMAIL_TEMPLATE_OPTIONS.map((tpl) => (
                        <button
                          type="button"
                          key={tpl.id}
                          onClick={() => handleTemplateChange(tpl.id)}
                          className={`text-left p-3 rounded-xl border text-xs font-semibold transition ${
                            selectedTemplateId === tpl.id
                              ? "bg-white border-purple text-purple shadow-xs ring-2 ring-purple/20"
                              : "bg-white/70 border-slate-200 text-navy/70 hover:bg-white hover:text-navy"
                          }`}
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editable Subject */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
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
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-navy font-semibold outline-none focus:border-purple shadow-xs"
                    />
                  </div>

                  {/* Editable Email Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                        Email Message Content (Full Body)
                      </label>
                      <span className="text-[11px] text-navy/50">
                        Supports bullet points (- item)
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      required={sendWelcomeEmail}
                      value={emailBody}
                      onChange={(e) => {
                        setEmailBody(e.target.value);
                        setIsBodyCustomized(true);
                      }}
                      placeholder="Type or customize your email message here..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-navy font-mono leading-relaxed outline-none focus:border-purple shadow-xs"
                    />
                  </div>

                  {/* Delivery details badge */}
                  <div className="rounded-xl bg-purple/10 p-3 flex items-center justify-between text-xs text-purple">
                    <span className="font-semibold">
                      Sender: info@digitaldude.co.uk (The Digital Dude)
                    </span>
                    <span className="font-bold text-[11px] uppercase tracking-wider">
                      Brevo Transactional Delivery
                    </span>
                  </div>
                </div>
              )}
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
