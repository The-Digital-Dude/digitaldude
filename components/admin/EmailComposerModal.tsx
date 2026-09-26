"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
  MessageSquare
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
  const [customMessage, setCustomMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (recipient) {
      const initialTemplate = recipient.defaultTemplateId || (recipient.proposalSlug ? "proposal_delivery" : "discovery_followup");
      setTemplateId(initialTemplate);

      const t = EMAIL_TEMPLATES.find((item) => item.id === initialTemplate) || EMAIL_TEMPLATES[0];
      const initialSubject = t.defaultSubject
        .replace(/{{company_name}}/g, recipient.companyName || "Client")
        .replace(/{{client_name}}/g, recipient.name || "Client")
        .replace(/{{first_name}}/g, (recipient.name || "Client").split(" ")[0]);

      setSubject(initialSubject);
      setCustomMessage("");
      setError("");
      setSuccess(false);
    }
  }, [recipient]);

  const handleTemplateChange = (newId: string) => {
    setTemplateId(newId);
    if (!recipient) return;

    const t = EMAIL_TEMPLATES.find((item) => item.id === newId) || EMAIL_TEMPLATES[0];
    const newSubject = t.defaultSubject
      .replace(/{{company_name}}/g, recipient.companyName || "Client")
      .replace(/{{client_name}}/g, recipient.name || "Client")
      .replace(/{{first_name}}/g, (recipient.name || "Client").split(" ")[0]);

    setSubject(newSubject);
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
          customMessage,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between">
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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={22} />
            </span>
            <h4 className="text-sm font-bold text-emerald-900">Email Dispatched Successfully!</h4>
            <p className="text-xs text-emerald-700">
              Sent via Brevo to {recipient.email}. CRM pipeline stage updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple" /> Select Email Template
              </label>
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
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            {/* Contextual / Custom Notes Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                {templateId === "discovery_followup"
                  ? "Discussion Highlights / Client Notes (Included in Email)"
                  : templateId === "custom"
                  ? "Message Body *"
                  : "Additional Message (Optional)"}
              </label>
              <textarea
                rows={templateId === "custom" ? 5 : 3}
                required={templateId === "custom"}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={
                  templateId === "discovery_followup"
                    ? "e.g. Discussed eliminating the 4-step manual spreadsheet dispatch and building a direct driver PWA."
                    : templateId === "proposal_delivery"
                    ? "Add a personal note to accompany the proposal..."
                    : "Type your message to the client..."
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white leading-relaxed"
              />
            </div>

            {/* Sender / Brevo Badge */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-navy/60 flex items-center justify-between">
              <span>Sender: <strong className="text-navy">The Digital Dude &lt;info@digitaldude.co.uk&gt;</strong></span>
              <span className="text-[10px] font-bold text-purple uppercase tracking-wider">Brevo SMTP</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
