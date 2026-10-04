"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  TrendingUp,
  Target,
  Users,
  Search,
  Phone,
  PhoneCall,
  PhoneMissed,
  FileCheck,
  CheckCircle2,
  X,
  GripVertical,
  Layers,
  Globe,
} from "lucide-react";
import {
  BookingLead,
  CRM_STAGES,
  CrmStage,
  LeadScore,
  formatUsd,
  getWeightedPipelineMetrics,
} from "@/lib/crm";
import { EmailComposerModal, EmailComposerRecipient } from "@/components/admin/EmailComposerModal";
import { CreateLeadModal } from "@/components/admin/CreateLeadModal";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role_title?: string;
  referral_code?: string;
}

export function CrmKanbanBoard({
  leads,
  onUpdateLead,
  onDeleteLead,
  loading,
  onRefresh,
}: {
  leads: BookingLead[];
  onUpdateLead: (id: string, updates: Partial<BookingLead>) => Promise<void>;
  onDeleteLead: (id: string, name: string) => Promise<void>;
  loading: boolean;
  onRefresh?: () => void;
}) {
  const [selectedLead, setSelectedLead] = useState<BookingLead | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<EmailComposerRecipient | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStage, setCreateStage] = useState<CrmStage>("new_booking");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepFilter, setSelectedRepFilter] = useState("all");

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CrmStage | null>(null);

  // Edit Drawer / Modal Form State
  const [editDealValue, setEditDealValue] = useState<number>(8500);
  const [editLeadScore, setEditLeadScore] = useState<LeadScore>("warm");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editStage, setEditStage] = useState<CrmStage>("new_booking");
  const [editRepId, setEditRepId] = useState<string>("");
  const [editMeetUrl, setEditMeetUrl] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Active Team Employees
  const [employees, setEmployees] = useState<Employee[]>([]);

  const stageOrder: CrmStage[] = CRM_STAGES.map((s) => s.id);

  // Fetch employees for rep assignment & filtering
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/admin/employees");
        const data = await res.json();
        if (data.ok && data.employees) {
          setEmployees(data.employees);
        }
      } catch {
        // ignore fetch error in dev
      }
    }
    fetchEmployees();
  }, []);

  // Employee Map for quick lookup
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Rep filter
      if (selectedRepFilter !== "all") {
        if (selectedRepFilter === "unassigned") {
          if (lead.sourced_by_employee_id) return false;
        } else {
          if (lead.sourced_by_employee_id !== selectedRepFilter) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchCompany = lead.company_name?.toLowerCase().includes(q);
        const matchEmail = lead.work_email?.toLowerCase().includes(q);
        const matchNotes = lead.lead_notes?.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchEmail && !matchNotes) return false;
      }

      return true;
    });
  }, [leads, selectedRepFilter, searchQuery]);

  // Pipeline Metrics
  const pipelineMetrics = useMemo(() => {
    return getWeightedPipelineMetrics(filteredLeads);
  }, [filteredLeads]);

  // Open Drawer / Modal
  const handleOpenEdit = (lead: BookingLead) => {
    setSelectedLead(lead);
    setEditDealValue(lead.deal_value || 8500);
    setEditLeadScore(lead.lead_score || "warm");
    setEditNotes(lead.lead_notes || lead.admin_notes || "");
    setEditStage(lead.stage || "new_booking");
    setEditRepId(lead.sourced_by_employee_id || "");
    setEditMeetUrl(lead.meet_url || "");
  };

  // Quick Timestamped Note Append
  const handleAppendActivityNote = (activityType: string) => {
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const prefix = `[${timeStr}] ${activityType}`;
    setEditNotes((prev) => (prev.trim() ? `${prefix}\n${prev}` : prefix));
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingEdit(true);

    try {
      const selectedEmp = editRepId ? employeeMap.get(editRepId) : null;
      await onUpdateLead(selectedLead.id, {
        deal_value: Number(editDealValue),
        lead_score: editLeadScore,
        lead_notes: editNotes,
        admin_notes: editNotes,
        stage: editStage,
        sourced_by_employee_id: editRepId || null,
        assigned_to: selectedEmp ? selectedEmp.full_name : selectedLead.assigned_to,
        meet_url: editMeetUrl || null,
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

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: CrmStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: CrmStage) => {
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: CrmStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    setDraggedLeadId(null);

    if (!leadId) return;
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.stage === targetStage) return;

    await onUpdateLead(leadId, { stage: targetStage });
  };

  const getScoreBadge = (score: LeadScore) => {
    switch (score) {
      case "hot":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 shadow-2xs">
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
      {/* 1. Top Pipeline Forecasting & Attribution Ribbon */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* KPI 1: Active Pipeline */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-navy/50">
              <span>Open Pipeline</span>
              <DollarSign size={15} className="text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-navy font-mono">
              {formatUsd(pipelineMetrics.totalActiveVolume)}
            </div>
            <p className="text-[10px] text-navy/60">
              {filteredLeads.filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost").length} active deals
            </p>
          </div>

          {/* KPI 2: Weighted Forecast */}
          <div className="rounded-2xl border border-purple/10 bg-purple/[0.03] p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple">
              <span>Weighted Forecast</span>
              <TrendingUp size={15} className="text-purple" />
            </div>
            <div className="text-xl font-extrabold text-purple font-mono">
              {formatUsd(Math.round(pipelineMetrics.weightedForecastVolume))}
            </div>
            <p className="text-[10px] text-purple/70">Probability-adjusted revenue</p>
          </div>

          {/* KPI 3: Closed Won */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <span>Closed Won</span>
              <AwardIcon size={15} className="text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              {formatUsd(pipelineMetrics.wonVolume)}
            </div>
            <p className="text-[10px] text-emerald-600">
              {pipelineMetrics.wonCount} won contracts
            </p>
          </div>

          {/* KPI 4: Win Rate & Deals */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-navy/50">
              <span>Win Rate</span>
              <Target size={15} className="text-cyan-600" />
            </div>
            <div className="text-xl font-extrabold text-navy font-mono">
              {pipelineMetrics.winRate}%
            </div>
            <p className="text-[10px] text-navy/60">
              {pipelineMetrics.totalDealsCount} total tracked
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search leads, companies, emails…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Users size={13} className="text-purple shrink-0" />
              <span className="text-[11px] font-bold text-navy/60 hidden sm:inline">Rep:</span>
              <select
                value={selectedRepFilter}
                onChange={(e) => setSelectedRepFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-navy outline-none cursor-pointer"
              >
                <option value="all">All Sales Reps</option>
                <option value="unassigned">Unassigned Only</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} {emp.referral_code ? `(${emp.referral_code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setCreateStage("new_booking");
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-3 py-1.5 text-xs font-bold text-white hover:bg-purple/90 transition shadow-xs shrink-0"
            >
              <Plus size={13} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6-Column Kanban Board with Native HTML5 Drag and Drop */}
      <div className="w-full overflow-x-auto pb-6 pt-1">
        <div className="flex gap-4 min-w-max">
          {CRM_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => (l.stage || "new_booking") === stage.id);
            const stageTotalValue = stageLeads.reduce(
              (acc, curr) => acc + (Number(curr.deal_value) || 0),
              0
            );
            const isDragTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex w-[300px] min-w-[300px] flex-col rounded-3xl border transition-all duration-150 p-4 shadow-2xs ${
                  isDragTarget
                    ? "border-purple bg-purple/[0.06] shadow-md ring-2 ring-purple/20 scale-[1.01]"
                    : "border-slate-200 bg-slate-50/80"
                }`}
              >
                {/* Stage Header */}
                <div className="mb-3 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <h2 className="text-xs font-bold text-navy truncate" title={stage.name}>
                        {stage.name}
                      </h2>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-purple/10 text-purple">
                        {stage.winProbability}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-[10px] font-bold text-navy">
                        {stageLeads.length}
                      </span>
                      <button
                        onClick={() => {
                          setCreateStage(stage.id);
                          setIsCreateOpen(true);
                        }}
                        title={`Add Deal to ${stage.name}`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple/10 text-purple hover:bg-purple hover:text-white transition"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-navy/60">
                    <span>Subtotal:</span>
                    <strong className="font-semibold text-navy">{formatUsd(stageTotalValue)}</strong>
                  </div>
                </div>

                {/* Stage Cards Container */}
                <div className="flex-1 space-y-3 min-h-[360px]">
                  {stageLeads.length === 0 ? (
                    <div
                      className={`flex flex-col h-40 items-center justify-center rounded-2xl border border-dashed transition-all p-4 text-center ${
                        isDragTarget ? "border-purple bg-purple/10 text-purple font-bold" : "border-slate-200 text-navy/40"
                      }`}
                    >
                      {isDragTarget ? (
                        <p className="text-xs text-purple font-bold">Drop deal here</p>
                      ) : (
                        <>
                          <p className="text-[11px] text-navy/40 mb-2">No active deals</p>
                          <button
                            onClick={() => {
                              setCreateStage(stage.id);
                              setIsCreateOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-navy/70 hover:border-purple/40 hover:text-purple transition"
                          >
                            <Plus size={10} /> Add Deal
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const currentStage = lead.stage || "new_booking";
                      const currentIndex = stageOrder.indexOf(currentStage);
                      const canPrev = currentIndex > 0;
                      const canNext = currentIndex < stageOrder.length - 1;
                      const isBeingDragged = draggedLeadId === lead.id;

                      const assignedRep = lead.sourced_by_employee_id
                        ? employeeMap.get(lead.sourced_by_employee_id)
                        : null;

                      return (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={() => setDraggedLeadId(null)}
                          className={`group relative rounded-2xl border bg-white p-3.5 shadow-2xs hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing ${
                            isBeingDragged
                              ? "opacity-40 border-purple ring-2 ring-purple/30 scale-95"
                              : "border-slate-200/80 hover:border-purple/30"
                          }`}
                        >
                          {/* Top Row: Company Name & Score Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <GripVertical size={12} className="text-slate-300 group-hover:text-purple transition shrink-0" />
                                <h3
                                  className="text-xs font-bold text-navy leading-tight truncate hover:text-purple cursor-pointer"
                                  onClick={() => handleOpenEdit(lead)}
                                  title={lead.company_name}
                                >
                                  {lead.company_name}
                                </h3>
                              </div>
                              <p className="text-[11px] text-navy/60 mt-0.5 pl-4 truncate">{lead.name}</p>
                            </div>
                            {getScoreBadge(lead.lead_score || "warm")}
                          </div>

                          {/* Deal Value Pill & Rep Badge */}
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs">
                            <span className="text-[10px] uppercase font-bold text-navy/50">Deal:</span>
                            <span className="font-bold text-navy text-xs font-mono">
                              {formatUsd(lead.deal_value || 8500)}
                            </span>
                          </div>

                          {/* Assigned Rep Attribution Badge */}
                          <div className="flex items-center justify-between text-[11px]">
                            {assignedRep ? (
                              <div
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple/10 text-purple border border-purple/20 text-[10px] font-bold truncate max-w-[180px]"
                                title={`Sourced by: ${assignedRep.full_name} (${assignedRep.email})`}
                              >
                                <User size={10} />
                                <span className="truncate">{assignedRep.full_name}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Unassigned Rep</span>
                            )}

                            {lead.country && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[90px] text-right">
                                {lead.country}
                              </span>
                            )}
                          </div>

                          {/* Source / Referral Tag */}
                          {lead.referral_source && (
                            <div className="flex items-center gap-1 text-[10px]">
                              {lead.referral_source.startsWith("pseo:") ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 truncate max-w-full">
                                  <Globe size={10} className="shrink-0 text-emerald-600" />
                                  <span className="truncate">
                                    {lead.referral_source.replace("pseo:", "pSEO: ")}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 truncate max-w-full">
                                  Ref: {lead.referral_source}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Meeting Slot */}
                          <div className="flex items-center gap-1.5 text-[11px] text-navy/70">
                            <Calendar size={12} className="text-purple shrink-0" />
                            <span className="truncate">
                              {new Date(lead.slot_start).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              ·{" "}
                              {new Date(lead.slot_start).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Google Meet Link (if available) */}
                          {lead.meet_url && (
                            <div className="pt-0.5">
                              <a
                                href={lead.meet_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple hover:underline"
                              >
                                <Video size={12} /> Google Meet Room
                              </a>
                            </div>
                          )}

                          {/* Note Snippet */}
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
                                title="Open Lead Detail Drawer"
                                className="rounded-md p-1.5 text-navy/60 hover:bg-purple/10 hover:text-purple transition"
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
                                className="rounded-md p-1.5 text-purple hover:bg-purple/10 transition"
                              >
                                <Mail size={13} />
                              </button>

                              <Link
                                href={`/admin/proposals/new`}
                                title="Draft Proposal Spec"
                                className="rounded-md p-1.5 text-navy/50 hover:bg-purple/10 hover:text-purple transition"
                              >
                                <FileText size={13} />
                              </Link>

                              <button
                                onClick={() => onDeleteLead(lead.id, lead.company_name)}
                                title="Delete Lead"
                                className="rounded-md p-1.5 text-navy/40 hover:bg-red-50 hover:text-red-600 transition"
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

      {/* 3. Comprehensive Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple bg-purple/10 px-2 py-0.5 rounded-full border border-purple/20">
                  CRM Deal Detail Drawer
                </span>
                <h3 className="text-lg font-bold text-navy mt-1.5 leading-tight">
                  {selectedLead.company_name}
                </h3>
                <p className="text-xs text-navy/60 mt-0.5">
                  Contact: <strong className="text-navy">{selectedLead.name}</strong> ({selectedLead.work_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-xl p-1.5 text-navy/40 hover:bg-slate-100 hover:text-navy transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Quick Action Toolbar */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">
                  Quick Activity Logger (Appends to Notes)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAppendActivityNote("📞 Call Connected & Spoke. Discussed project architecture.")}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy hover:border-purple hover:text-purple transition"
                  >
                    <PhoneCall size={11} className="text-emerald-500" /> Spoke with Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendActivityNote("🎙️ Left Voicemail & follow-up message.")}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy hover:border-purple hover:text-purple transition"
                  >
                    <PhoneMissed size={11} className="text-amber-500" /> Left Voicemail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendActivityNote("📄 Sent Interactive Proposal Spec brief.")}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy hover:border-purple hover:text-purple transition"
                  >
                    <FileText size={11} className="text-blue-500" /> Sent Proposal Spec
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendActivityNote("🤝 Negotiated timeline & milestone split terms.")}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy hover:border-purple hover:text-purple transition"
                  >
                    <HandshakeIcon size={11} className="text-purple" /> Negotiated Terms
                  </button>
                </div>
              </div>

              {/* Stage & Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as CrmStage)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-navy outline-none focus:border-purple"
                  >
                    {CRM_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.winProbability}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Lead Score
                  </label>
                  <select
                    value={editLeadScore}
                    onChange={(e) => setEditLeadScore(e.target.value as LeadScore)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-navy outline-none focus:border-purple"
                  >
                    <option value="hot">🔥 Hot Lead</option>
                    <option value="warm">⚡ Warm Lead</option>
                    <option value="cold">❄️ Cold Lead</option>
                  </select>
                </div>
              </div>

              {/* Deal Value & Rep Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Deal Value ($ USD)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={editDealValue}
                    onChange={(e) => setEditDealValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-navy outline-none focus:border-purple font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Assigned Sales Rep
                  </label>
                  <select
                    value={editRepId}
                    onChange={(e) => setEditRepId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-navy outline-none focus:border-purple"
                  >
                    <option value="">Unassigned Rep</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role_title || "Sales Rep"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Google Meet URL */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Google Meet Video Room
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editMeetUrl}
                    onChange={(e) => setEditMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple"
                  />
                  {editMeetUrl && (
                    <a
                      href={editMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-navy transition flex items-center gap-1"
                    >
                      <Video size={13} /> Launch
                    </a>
                  )}
                </div>
              </div>

              {/* Notes & Activity Log */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Internal Team Notes &amp; Activity Log
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record call summaries, requirements, and next steps…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLead(null);
                      setEmailRecipient({
                        name: selectedLead.name,
                        email: selectedLead.work_email,
                        companyName: selectedLead.company_name,
                        bookingId: selectedLead.id,
                        defaultTemplateId: "discovery_followup",
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-purple/30 bg-purple/10 px-3 py-2 text-xs font-bold text-purple hover:bg-purple hover:text-white transition"
                  >
                    <Mail size={12} /> Email Lead
                  </button>
                  <Link
                    href={`/admin/proposals/new`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50 transition"
                  >
                    <FileText size={12} /> New Spec
                  </Link>
                </div>

                <div className="flex items-center gap-2">
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
                    className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 disabled:opacity-50 transition shadow-xs"
                  >
                    {savingEdit ? "Saving…" : "Save Changes"}
                  </button>
                </div>
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

      {/* Create Custom Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        defaultStage={createStage}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newLead) => {
          if (newLead) {
            onUpdateLead(newLead.id, newLead);
          }
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}

function AwardIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function HandshakeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l1.34.45a2 2 0 0 0 1.42-.25l.47-.28a5.79 5.79 0 0 1 7.06.87L15 18" />
    </svg>
  );
}
