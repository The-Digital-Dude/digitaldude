"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { EMAIL_TEMPLATES } from "@/lib/emailBrevo";

export interface EmailComposerRecipient {
  name: string;
  email: string;
  companyName: string;
  proposalSlug?: string;
  proposalId?: string;
  bookingId?: string;
  projectTitle?: string;
  scopeSummary?: string;
  budgetRange?: string;
  targetTimeline?: string;
  defaultTemplateId?: string;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  recipient,
  onSent,
}: {
  isOpen: boolean;
  onClose: () => void;
  recipient: EmailComposerRecipient | null;
  onSent?: (subject: string) => void;
}) {
  const [templateId, setTemplateId] = useState<string>("proposal_delivery");
  const [subject, setSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [isSubjectCustomized, setIsSubjectCustomized] = useState(false);
  const [isBodyCustomized, setIsBodyCustomized] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (recipient) {
      const initialTemplate =
        recipient.defaultTemplateId ||
        (recipient.proposalSlug ? "proposal_delivery" : "discovery_followup");
      setTemplateId(initialTemplate);

      const tpl =
        EMAIL_TEMPLATES.find((item) => item.id === initialTemplate) ||
        EMAIL_TEMPLATES[0];

      const firstName = (recipient.name || "there").split(" ")[0];
      const company = recipient.companyName || "your team";

      const initSubject = (tpl.defaultSubject || "")
        .replace(/{{company_name}}/g, company)
        .replace(/{{client_name}}/g, recipient.name || "Client")
        .replace(/{{first_name}}/g, firstName);

      const initBody = (tpl.defaultBody || "")
        .replace(/{{company_name}}/g, company)
        .replace(/{{client_name}}/g, recipient.name || "Client")
        .replace(/{{first_name}}/g, firstName);

      setSubject(initSubject);
      setEmailBody(initBody);
      setIsSubjectCustomized(false);
      setIsBodyCustomized(false);
      setError("");
      setSuccess(false);
    }
  }, [recipient]);

  const handleTemplateChange = (newId: string) => {
    setTemplateId(newId);
    if (!recipient) return;

    const tpl =
      EMAIL_TEMPLATES.find((item) => item.id === newId) || EMAIL_TEMPLATES[0];

    const firstName = (recipient.name || "there").split(" ")[0];
    const company = recipient.companyName || "your team";

    const newSubject = (tpl.defaultSubject || "")
      .replace(/{{company_name}}/g, company)
      .replace(/{{client_name}}/g, recipient.name || "Client")
      .replace(/{{first_name}}/g, firstName);

    const newBody = (tpl.defaultBody || "")
      .replace(/{{company_name}}/g, company)
      .replace(/{{client_name}}/g, recipient.name || "Client")
      .replace(/{{first_name}}/g, firstName);

    setSubject(newSubject);
    setEmailBody(newBody);
    setIsSubjectCustomized(false);
    setIsBodyCustomized(false);
  };

  const handleResetToDefault = () => {
    if (!recipient) return;
    const tpl =
      EMAIL_TEMPLATES.find((item) => item.id === templateId) ||
      EMAIL_TEMPLATES[0];

    const firstName = (recipient.name || "there").split(" ")[0];
    const company = recipient.companyName || "your team";

    setSubject(
      (tpl.defaultSubject || "")
        .replace(/{{company_name}}/g, company)
        .replace(/{{client_name}}/g, recipient.name || "Client")
        .replace(/{{first_name}}/g, firstName)
    );
    setEmailBody(
      (tpl.defaultBody || "")
        .replace(/{{company_name}}/g, company)
        .replace(/{{client_name}}/g, recipient.name || "Client")
        .replace(/{{first_name}}/g, firstName)
    );
    setIsSubjectCustomized(false);
    setIsBodyCustomized(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipient.email,
          toName: recipient.name,
          companyName: recipient.companyName,
          templateId,
          customSubject: subject,
          customBody: emailBody,
          customMessage: emailBody,
          proposalSlug: recipient.proposalSlug,
          proposalId: recipient.proposalId,
          bookingId: recipient.bookingId,
          projectTitle: recipient.projectTitle,
          scopeSummary: recipient.scopeSummary,
          budgetRange: recipient.budgetRange,
          targetTimeline: recipient.targetTimeline,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to send email.");
        return;
      }

      setSuccess(true);
      if (onSent) onSent(subject);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1800);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !recipient) return null;

  const hasProposalAction = Boolean(recipient.proposalSlug || recipient.proposalId);
  const isBookingAction = templateId === "inbound_welcome" || templateId === "cold_outreach";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/10 text-purple">
              <Mail size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-navy">Direct Email via Brevo</h3>
              <p className="text-xs text-navy/60">
                To: <strong className="text-navy">{recipient.name}</strong> &lt;{recipient.email}&gt; ({recipient.companyName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy/40 hover:bg-slate-100 hover:text-navy"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 flex items-center gap-2 shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-2 my-auto">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={26} />
            </span>
            <h4 className="text-base font-bold text-emerald-900">Email Dispatched Successfully!</h4>
            <p className="text-xs text-emerald-700">
              Sent via Brevo to {recipient.email}. CRM pipeline stage updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col flex-1 min-h-0 space-y-3.5 overflow-y-auto pr-1">
            {/* Template Selector & Reset Action */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy/70 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple" /> Select Email Template
                </label>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple/80 hover:text-purple transition cursor-pointer"
                >
                  <RotateCcw size={11} /> Reset to template default
                </button>
              </div>
              <select
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
              >
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Email Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setIsSubjectCustomized(true);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            {/* Message Body Editor */}
            <div className="flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-navy/70">
                  Email Message Content
                </label>
                <span className="text-[10px] text-navy/50 font-medium">Supports bullet points (- item)</span>
              </div>
              <textarea
                required
                value={emailBody}
                onChange={(e) => {
                  setEmailBody(e.target.value);
                  setIsBodyCustomized(true);
                }}
                rows={7}
                placeholder="Type your bespoke email message to the client..."
                className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy font-mono outline-none focus:border-purple focus:bg-white leading-relaxed resize-y"
              />
            </div>

            {/* Contextual Automatic Attachment Badge */}
            {hasProposalAction ? (
              <div className="rounded-xl border border-purple/20 bg-purple/5 px-3 py-2 text-[11px] text-purple font-medium flex items-center gap-2 shrink-0">
                <ExternalLink size={13} className="shrink-0" />
                <span>
                  Interactive specification link & PDF review button will be attached automatically below your message.
                </span>
              </div>
            ) : isBookingAction ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 font-medium flex items-center gap-2 shrink-0">
                <Calendar size={13} className="shrink-0" />
                <span>
                  Direct 30-minute discovery call booking button will be attached automatically below your message.
                </span>
              </div>
            ) : null}

            {/* Sender / Brevo Badge */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-navy/60 flex items-center justify-between shrink-0">
              <span>Sender: <strong className="text-navy">The Digital Dude &lt;info@digitaldude.co.uk&gt;</strong></span>
              <span className="text-[10px] font-bold text-purple uppercase tracking-wider">Brevo SMTP</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 shadow-xs disabled:opacity-50"
              >
                <Send size={13} />
                {sending ? "Sending via Brevo…" : "Send Email"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
