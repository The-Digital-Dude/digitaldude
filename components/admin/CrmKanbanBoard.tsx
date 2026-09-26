"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building,
  User,
  Calendar,
  Clock,
  Video,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Flame,
  Zap,
  Snowflake,
  Edit3,
  Trash2,
  ExternalLink,
  Plus,
  FileText,
  Sparkles,
  MessageSquare,
  Check,
  Mail,
} from "lucide-react";
import { BookingLead, CRM_STAGES, CrmStage, LeadScore, formatGbp } from "@/lib/crm";
import { EmailComposerModal, EmailComposerRecipient } from "@/components/admin/EmailComposerModal";

export function CrmKanbanBoard({
  leads,
  onUpdateLead,
  onDeleteLead,
  loading,
}: {
  leads: BookingLead[];
  onUpdateLead: (id: string, updates: Partial<BookingLead>) => Promise<void>;
  onDeleteLead: (id: string, name: string) => Promise<void>;
  loading: boolean;
}) {
  const [selectedLead, setSelectedLead] = useState<BookingLead | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<EmailComposerRecipient | null>(null);
  const [editDealValue, setEditDealValue] = useState<number>(8500);
  const [editLeadScore, setEditLeadScore] = useState<LeadScore>("warm");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editStage, setEditStage] = useState<CrmStage>("new_booking");
  const [savingEdit, setSavingEdit] = useState(false);

  const stageOrder: CrmStage[] = CRM_STAGES.map((s) => s.id);

  const handleOpenEdit = (lead: BookingLead) => {
    setSelectedLead(lead);
    setEditDealValue(lead.deal_value || 8500);
    setEditLeadScore(lead.lead_score || "warm");
    setEditNotes(lead.lead_notes || "");
    setEditStage(lead.stage || "new_booking");
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingEdit(true);

    try {
      await onUpdateLead(selectedLead.id, {
        deal_value: Number(editDealValue),
        lead_score: editLeadScore,
        lead_notes: editNotes,
        stage: editStage,
      });
      setSelectedLead(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdvanceStage = async (lead: BookingLead, direction: "next" | "prev") => {
    const currentIndex = stageOrder.indexOf(lead.stage);
    if (currentIndex === -1) return;

    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= stageOrder.length) return;

    const nextStage = stageOrder[newIndex];
    await onUpdateLead(lead.id, { stage: nextStage });
  };

  const getScoreBadge = (score: LeadScore) => {
    switch (score) {
      case "hot":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
            <Flame size={11} className="text-rose-500 fill-rose-500" /> Hot
          </span>
        );
      case "cold":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
            <Snowflake size={11} className="text-sky-500" /> Cold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <Zap size={11} className="text-amber-500 fill-amber-500" /> Warm
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 6-Column Kanban Horizontal Flex Container */}
      <div className="w-full overflow-x-auto pb-6 pt-1">
        <div className="flex gap-4 min-w-max">
          {CRM_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => (l.stage || "new_booking") === stage.id);
            const stageTotalValue = stageLeads.reduce(
              (acc, curr) => acc + (Number(curr.deal_value) || 0),
              0
            );

            return (
              <div
                key={stage.id}
                className="flex w-[290px] min-w-[290px] flex-col rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-2xs"
              >
                {/* Stage Header */}
                <div className="mb-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-bold text-navy truncate" title={stage.name}>
                      {stage.name}
                    </h2>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-[10px] font-bold text-navy">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-navy/60">
                    <span>Subtotal:</span>
                    <strong className="font-semibold text-navy">{formatGbp(stageTotalValue)}</strong>
                  </div>
                </div>

                {/* Stage Cards Container */}
                <div className="flex-1 space-y-3 min-h-[350px]">
                  {stageLeads.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-[11px] text-navy/40">
                      No active deals
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const currentStage = lead.stage || "new_booking";
                      const currentIndex = stageOrder.indexOf(currentStage);
                      const canPrev = currentIndex > 0;
                      const canNext = currentIndex < stageOrder.length - 1;

                    return (
                      <div
                        key={lead.id}
                        className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:shadow-xs transition space-y-2.5"
                      >
                        {/* Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-xs font-bold text-navy leading-tight line-clamp-1" title={lead.company_name}>
                              {lead.company_name}
                            </h3>
                            <p className="text-[11px] text-navy/60 mt-0.5">{lead.name}</p>
                          </div>
                          {getScoreBadge(lead.lead_score || "warm")}
                        </div>

                        {/* Deal Value Pill */}
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs">
                          <span className="text-[10px] uppercase font-bold text-navy/50">Deal Est:</span>
                          <span className="font-bold text-navy text-xs">
                            {formatGbp(lead.deal_value || 8500)}
                          </span>
                        </div>

                        {/* Meeting Slot */}
                        <div className="flex items-center gap-1.5 text-[11px] text-navy/70">
                          <Calendar size={12} className="text-purple shrink-0" />
                          <span className="truncate">
                            {new Date(lead.slot_start).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })} · {new Date(lead.slot_start).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Google Meet Link (if available) */}
                        {lead.meet_url && (
                          <div className="pt-1">
                            <a
                              href={lead.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple hover:underline"
                            >
                              <Video size={12} /> Video Room
                            </a>
                          </div>
                        )}

                        {/* Internal Note snippet */}
                        {lead.lead_notes && (
                          <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-2 text-[10px] text-amber-900 line-clamp-2">
                            {lead.lead_notes}
                          </div>
                        )}

                        {/* Actions & Stage Shifters */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(lead)}
                              title="Edit Deal & Notes"
                              className="rounded-md p-1 text-navy/50 hover:bg-slate-100 hover:text-navy transition"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={() =>
                                setEmailRecipient({
                                  name: lead.name,
                                  email: lead.work_email,
                                  companyName: lead.company_name,
                                  bookingId: lead.id,
                                  defaultTemplateId: "discovery_followup",
                                })
                              }
                              title="Email Lead via Brevo"
                              className="rounded-md p-1 text-purple hover:bg-purple/10 transition"
                            >
                              <Mail size={13} />
                            </button>

                            <Link
                              href={`/admin/proposals/new`}
                              title="Draft Proposal for this Lead"
                              className="rounded-md p-1 text-navy/50 hover:bg-purple/10 hover:text-purple transition"
                            >
                              <FileText size={13} />
                            </Link>

                            <button
                              onClick={() => onDeleteLead(lead.id, lead.company_name)}
                              title="Delete Lead"
                              className="rounded-md p-1 text-navy/50 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={!canPrev}
                              onClick={() => handleAdvanceStage(lead, "prev")}
                              title="Move to Previous Stage"
                              className="rounded-md p-1 text-navy/50 hover:bg-slate-100 hover:text-navy disabled:opacity-20 transition"
                            >
                              <ChevronLeft size={14} />
                            </button>

                            <button
                              disabled={!canNext}
                              onClick={() => handleAdvanceStage(lead, "next")}
                              title="Move to Next Stage"
                              className="rounded-md p-1 text-navy/50 hover:bg-slate-100 hover:text-navy disabled:opacity-20 transition"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Edit Deal Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple">
                  CRM Deal Manager
                </span>
                <h3 className="text-base font-bold text-navy mt-1">
                  {selectedLead.company_name}
                </h3>
                <p className="text-xs text-navy/60">
                  Contact: {selectedLead.name} ({selectedLead.work_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1 text-navy/40 hover:bg-slate-100 hover:text-navy"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as CrmStage)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                >
                  {CRM_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Deal Value (£)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={editDealValue}
                    onChange={(e) => setEditDealValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Lead Score
                  </label>
                  <select
                    value={editLeadScore}
                    onChange={(e) => setEditLeadScore(e.target.value as LeadScore)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                  >
                    <option value="hot">🔥 Hot Lead</option>
                    <option value="warm">⚡ Warm Lead</option>
                    <option value="cold">❄️ Cold Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Internal Team Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Discussed Phase 1 timeline on call, client ready to sign proposal."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 disabled:opacity-50"
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={!!emailRecipient}
        recipient={emailRecipient}
        onClose={() => setEmailRecipient(null)}
        onSent={() => {
          if (emailRecipient?.bookingId) {
            onUpdateLead(emailRecipient.bookingId, { stage: "proposal_sent" });
          }
        }}
      />
    </div>
  );
}
