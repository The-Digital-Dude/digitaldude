"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  RefreshCw,
  Search,
  FileText,
  Image as ImageIcon,
  X,
  UserPlus,
  UserCheck,
  Trash2,
  Download,
  Star,
  Mail,
  Calendar,
  Video,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Plus,
  ExternalLink,
  DollarSign,
  Clock,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { AddCandidateModal } from "@/components/admin/AddCandidateModal";
import { HireCandidateModal } from "@/components/admin/HireCandidateModal";
import { ImportCandidatesModal } from "@/components/admin/ImportCandidatesModal";
import { Pagination } from "@/components/admin/Pagination";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export interface Scorecard {
  right_prospects?: number; // 0-5
  real_accurate?: number; // 0-5
  observations?: number; // 0-5
  messages?: number; // 0-5
  following_instructions?: number; // 0-5
  disqualified?: boolean;
  disqualification_reasons?: string[];
  total_score?: number; // 0-25
  // Legacy fields for backward compatibility
  written_test?: number;
  experience?: number;
  communication?: number;
  overall?: number;
}

export interface Application {
  id: string;
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  cv_path: string;
  proof_of_results_path: string | null;
  written_test_response: string;
  status: string;
  internal_notes: string;
  scorecard?: Scorecard;
  task_submission_url?: string;
  task_deadline?: string | null;
  bkash_number?: string;
  bkash_payment_status?: string;
  bkash_payment_amount?: number;
  bkash_transaction_id?: string;
  created_at: string;
  source?: string;
  source_metadata?: Record<string, string>;
  screening_answers?: Record<string, string>;
  job_postings?: { title: string; slug: string };
}

function sourceBadge(source?: string): { label: string; className: string } | null {
  switch (source) {
    case "import":
      return { label: "Imported Lead", className: "bg-sky-50 text-sky-700 border-sky-200" };
    case "manual":
      return { label: "Manually Added", className: "bg-slate-100 text-navy/70 border-slate-200" };
    default:
      return null;
  }
}

const STATUS_OPTIONS = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
];

const DISQUALIFICATION_OPTIONS = [
  { id: "fake_leads", label: "Made-up or unverifiable people / fake links" },
  { id: "ai_copy", label: "AI-written messages (phrases like 'I hope this finds you well' or 'leverage')" },
  { id: "missed_deadline", label: "Missed deadline without prior notice" },
  { id: "wrong_criteria", label: "Ignored target criteria (wrong region/headcount/industry)" },
];

function statusBadgeClass(status: string) {
  switch (status) {
    case "hired":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offered":
      return "bg-purple/10 text-purple border-purple/20";
    case "interview":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "shortlisted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "reviewing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function calculateTotalScore(sc?: Scorecard): number {
  if (!sc) return 0;
  if (
    sc.right_prospects !== undefined ||
    sc.real_accurate !== undefined ||
    sc.observations !== undefined ||
    sc.messages !== undefined ||
    sc.following_instructions !== undefined
  ) {
    return (
      (sc.right_prospects || 0) +
      (sc.real_accurate || 0) +
      (sc.observations || 0) +
      (sc.messages || 0) +
      (sc.following_instructions || 0)
    );
  }
  // Fallback to legacy overall if present
  return sc.overall ? sc.overall * 5 : 0;
}

function formatDeadlineDefault(): string {
  const d = new Date();
  d.setHours(d.getHours() + 48);
  return d.toISOString().slice(0, 16); // format for datetime-local input
}

function getStatusEmailDefaults(
  status: string,
  applicantName: string,
  jobTitle: string,
  deadlineInput?: string
) {
  const first = applicantName.trim().split(/\s+/)[0] || "there";
  const deadlineFormatted = deadlineInput
    ? new Date(deadlineInput).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "within 48 hours of receiving this email";

  switch (status) {
    case "shortlisted":
      return {
        subject: `Shortlisted: Paid Practical Assessment — ${jobTitle} at The Digital Dude`,
        message: `Hi ${first},\n\nCongratulations! We were very impressed with your application for the ${jobTitle} role at The Digital Dude, and we're excited to shortlist you for our practical assessment.\n\n🎯 ASSESSMENT TASK (10 Target Outbound Prospects):\n1. Right Prospects: Identify 10 high-fit decision-maker prospects in AU/UK (companies with 5 to 200 employees) matching our target agency profile.\n2. Real & Accurate: Provide working LinkedIn profile URLs and verified contact/company details.\n3. Specific Observations: Note 1-2 sharp, actionable observations for each lead (e.g. recent hires, tech stacks, or marketing gaps—specific details beat generic praise).\n4. Personalized Messages: Draft a tailored outreach message (<120 words) for each prospect—opening with them, referencing your observation, and asking a soft question (strictly human tone, zero AI clichés like 'leverage' or 'I hope this finds you well').\n5. Clean Format & bKash: Submit your work in a clean, organized Google Sheet (with view/edit permissions enabled) and include your personal bKash number on the sheet.\n\n⏰ DEADLINE:\nPlease submit your completed Google Sheet by: ${deadlineFormatted}.\n\n💰 GUARANTEED ASSESSMENT COMPENSATION:\nWe respect your time. Everyone who submits complete, verifiable work on time will be paid their assessment stipend via bKash, regardless of hiring decision. Candidates scoring 18/25 or higher will be invited to a 30-minute video interview.\n\nPlease reply directly to this email with your Google Sheet link once completed!`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "interview":
      return {
        subject: `Interview Invitation (30-min Video Call) — ${jobTitle} at The Digital Dude`,
        message: `Hi ${first},\n\nWe thoroughly reviewed your practical assessment for the ${jobTitle} role, and your work scored among our top submissions! We would love to invite you to a 30-minute video call with our team.\n\nPlease find your Google Meet link below. Looking forward to our conversation!`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "offered":
      return {
        subject: `Job Offer — ${jobTitle} at The Digital Dude`,
        message: `Dear ${first},\n\nWe were very impressed by your experience, assessment results, and discussion with our team, and we would like to formally extend an offer for the ${jobTitle} position at The Digital Dude!\n\nOur team will follow up directly with the formal agreement, compensation terms, and onboarding materials.`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "rejected":
      return {
        subject: `Update on your application for ${jobTitle}`,
        message: `Dear ${first},\n\nThank you for taking the time to apply for the ${jobTitle} role and for completing our assessment.\n\nWhile your background is noteworthy, we have decided to proceed with other candidates whose current experience more closely matches our immediate operational needs.\n\nIf you submitted a complete practical task on time, your bKash compensation is being processed. We truly appreciate your interest in The Digital Dude and wish you all the best in your career pursuits.`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "reviewing":
      return {
        subject: `Application Status Update — ${jobTitle}`,
        message: `Hi ${first},\n\nYour application for ${jobTitle} is currently undergoing detailed review by our leadership team. We will be in touch shortly with next steps regarding your candidacy.`,
        bookingUrl: "",
        meetingLink: "",
      };
    default:
      return {
        subject: `Update regarding your application for ${jobTitle}`,
        message: `Hi ${first},\n\nWe wanted to share an update regarding your application for ${jobTitle} at The Digital Dude.`,
        bookingUrl: "",
        meetingLink: "",
      };
  }
}

function RubricScoreSelector({
  title,
  subtitle,
  score = 0,
  onChange,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  score?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
        <div>
          <h4 className="text-xs font-bold text-navy">{title}</h4>
          <p className="text-[11px] text-navy/60 leading-relaxed mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-bold text-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {score} / 5 pts
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        {[0, 1, 2, 3, 4, 5].map((pts) => {
          const isSelected = score === pts;
          return (
            <button
              key={pts}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pts)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                isSelected
                  ? "bg-purple text-white ring-2 ring-purple/30 shadow-sm"
                  : "bg-white text-navy/70 border border-slate-200 hover:bg-purple/5 hover:border-purple/30 hover:text-purple"
              }`}
            >
              {pts}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Application | null>(null);
  const [candidateToHire, setCandidateToHire] = useState<Application | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Status Change & Email Modal State (for list view)
  const [pendingStatusModal, setPendingStatusModal] = useState<{
    application: Application;
    newStatus: string;
    sendEmail: boolean;
    subject: string;
    message: string;
    bookingUrl: string;
    interviewDate: string;
    meetingLink: string;
    deadline: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);

  // Inline Stage Transition State (for Candidate Detail Modal)
  const [inlineStage, setInlineStage] = useState<{
    targetStatus: string;
    sendEmail: boolean;
    subject: string;
    message: string;
    bookingUrl: string;
    interviewDate: string;
    meetingLink: string;
    deadline: string;
  } | null>(null);
  const [inlineStageUpdating, setInlineStageUpdating] = useState(false);
  const [inlineMeetGenerating, setInlineMeetGenerating] = useState(false);

  // Scorecard & Evaluation Draft State inside detail modal
  const [draftScorecard, setDraftScorecard] = useState<Scorecard>({
    right_prospects: 0,
    real_accurate: 0,
    observations: 0,
    messages: 0,
    following_instructions: 0,
    disqualified: false,
    disqualification_reasons: [],
    total_score: 0,
  });
  const [draftNotes, setDraftNotes] = useState("");
  const [draftTaskUrl, setDraftTaskUrl] = useState("");
  const [draftTaskDeadline, setDraftTaskDeadline] = useState("");
  const [draftBkashNumber, setDraftBkashNumber] = useState("");
  const [draftBkashStatus, setDraftBkashStatus] = useState("unpaid");
  const [draftBkashAmount, setDraftBkashAmount] = useState(500);
  const [draftBkashTxId, setDraftBkashTxId] = useState("");
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Lock background scroll when any modal is active
  useEffect(() => {
    if (selected || pendingStatusModal || isAddCandidateOpen || candidateToHire || isImportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected, pendingStatusModal, isAddCandidateOpen, candidateToHire, isImportOpen]);

  // Sync draft state whenever a candidate is selected
  useEffect(() => {
    if (selected) {
      const sc = selected.scorecard || {};
      const calculated = calculateTotalScore(sc);
      setDraftScorecard({
        right_prospects: sc.right_prospects ?? 0,
        real_accurate: sc.real_accurate ?? 0,
        observations: sc.observations ?? 0,
        messages: sc.messages ?? 0,
        following_instructions: sc.following_instructions ?? 0,
        disqualified: !!sc.disqualified,
        disqualification_reasons: sc.disqualification_reasons || [],
        total_score: sc.total_score ?? calculated,
      });
      setDraftNotes(selected.internal_notes || "");
      setDraftTaskUrl(selected.task_submission_url || "");
      setDraftTaskDeadline(selected.task_deadline || "");
      setDraftBkashNumber(selected.bkash_number || "");
      setDraftBkashStatus(selected.bkash_payment_status || "unpaid");
      setDraftBkashAmount(selected.bkash_payment_amount ?? 500);
      setDraftBkashTxId(selected.bkash_transaction_id || "");
      setInlineStage(null);
    }
  }, [selected]);

  function buildApplicationsUrl(overrides?: { page?: number; pageSize?: number; forExportAll?: boolean }) {
    const params = new URLSearchParams();
    if (!overrides?.forExportAll) {
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    }
    params.set("page", String(overrides?.page ?? page));
    params.set("pageSize", String(overrides?.pageSize ?? pageSize));
    return `/api/admin/applications?${params.toString()}`;
  }

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch(buildApplicationsUrl());
      const data = await res.json();
      if (data.ok) {
        setApplications(data.applications || []);
        setTotalCount(data.totalCount ?? (data.applications || []).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // Loops through every page of the current (or unfiltered, for "export all")
  // result set — exports need the full matching set, not just the page
  // currently rendered on screen.
  async function fetchAllApplications(opts?: { forExportAll?: boolean }): Promise<Application[]> {
    const all: Application[] = [];
    let currentPage = 1;
    const exportPageSize = 100;
    while (true) {
      const res = await fetch(buildApplicationsUrl({ page: currentPage, pageSize: exportPageSize, forExportAll: opts?.forExportAll }));
      const data = await res.json();
      if (!data.ok) break;
      const batch: Application[] = data.applications || [];
      all.push(...batch);
      if (batch.length < exportPageSize) break;
      currentPage++;
    }
    return all;
  }

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, debouncedSearch]);

  // Reset to page 1 whenever a filter changes (not when the page itself changes).
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  function handleOpenStatusChange(app: Application, targetStatus: string) {
    const defaultDeadline = formatDeadlineDefault();
    const defaults = getStatusEmailDefaults(
      targetStatus,
      app.applicant_name,
      app.job_postings?.title || "the role",
      defaultDeadline
    );
    setPendingStatusModal({
      application: app,
      newStatus: targetStatus,
      sendEmail: true,
      subject: defaults.subject,
      message: defaults.message,
      bookingUrl: defaults.bookingUrl || "",
      interviewDate: "",
      meetingLink: defaults.meetingLink || "",
      deadline: defaultDeadline,
    });
  }

  function handleSelectInlineStage(targetStatus: string) {
    if (!selected) return;
    if (selected.status === targetStatus) {
      setInlineStage(null);
      return;
    }
    const defaultDeadline = formatDeadlineDefault();
    const defaults = getStatusEmailDefaults(
      targetStatus,
      selected.applicant_name,
      selected.job_postings?.title || "the role",
      defaultDeadline
    );
    setInlineStage({
      targetStatus,
      sendEmail: true,
      subject: defaults.subject,
      message: defaults.message,
      bookingUrl: defaults.bookingUrl || "",
      interviewDate: "",
      meetingLink: defaults.meetingLink || "",
      deadline: defaultDeadline,
    });
  }

  async function handleGenerateMeetLink(isInline = false) {
    const modalState = isInline ? inlineStage : pendingStatusModal;
    const app = isInline ? selected : pendingStatusModal?.application;
    if (!modalState || !app) return;

    if (isInline) setInlineMeetGenerating(true);
    else setGeneratingMeet(true);

    try {
      const res = await fetch("/api/admin/interviews/meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          job_title: app.job_postings?.title || "Role",
          scheduled_time: modalState.interviewDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.meetingLink) {
        if (isInline) {
          setInlineStage((prev) =>
            prev ? { ...prev, meetingLink: data.meetingLink } : null
          );
        } else {
          setPendingStatusModal((prev) =>
            prev ? { ...prev, meetingLink: data.meetingLink } : null
          );
        }
      } else {
        alert(data.error || "Could not generate Google Meet link.");
      }
    } catch {
      alert("Network error creating Google Meet link.");
    } finally {
      if (isInline) setInlineMeetGenerating(false);
      else setGeneratingMeet(false);
    }
  }

  async function handleConfirmStatusUpdate() {
    if (!pendingStatusModal) return;
    setUpdatingStatus(true);
    try {
      const payload: Record<string, unknown> = {
        status: pendingStatusModal.newStatus,
        send_email: pendingStatusModal.sendEmail,
        email_subject: pendingStatusModal.subject,
        email_message: pendingStatusModal.message,
        interview_booking_url: pendingStatusModal.bookingUrl || undefined,
        meeting_link: pendingStatusModal.meetingLink || undefined,
      };

      if (pendingStatusModal.newStatus === "shortlisted" && pendingStatusModal.deadline) {
        payload.task_deadline = new Date(pendingStatusModal.deadline).toISOString();
      }

      const res = await fetch(
        `/api/admin/applications/${pendingStatusModal.application.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === pendingStatusModal.application.id ? data.application : a
          )
        );
        if (selected?.id === pendingStatusModal.application.id) {
          setSelected(data.application);
        }
        setPendingStatusModal(null);
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleConfirmInlineStage() {
    if (!selected || !inlineStage) return;
    setInlineStageUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        status: inlineStage.targetStatus,
        send_email: inlineStage.sendEmail,
        email_subject: inlineStage.subject,
        email_message: inlineStage.message,
        interview_booking_url: inlineStage.bookingUrl || undefined,
        meeting_link: inlineStage.meetingLink || undefined,
      };

      if (inlineStage.targetStatus === "shortlisted" && inlineStage.deadline) {
        payload.task_deadline = new Date(inlineStage.deadline).toISOString();
      }

      const res = await fetch(`/api/admin/applications/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === selected.id ? data.application : a))
        );
        setSelected(data.application);
        setInlineStage(null);
      } else {
        alert(data.error || "Failed to update stage.");
      }
    } catch {
      alert("Network error updating stage.");
    } finally {
      setInlineStageUpdating(false);
    }
  }

  async function handleSaveScorecardAndNotes() {
    if (!selected) return;
    setSavingNotes(true);
    setNotesSaveSuccess(false);

    const total = calculateTotalScore(draftScorecard);
    const finalScorecard: Scorecard = {
      ...draftScorecard,
      total_score: total,
      overall: Math.round((total / 25) * 5),
    };

    try {
      const res = await fetch(`/api/admin/applications/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_notes: draftNotes,
          scorecard: finalScorecard,
          task_submission_url: draftTaskUrl,
          task_deadline: draftTaskDeadline ? new Date(draftTaskDeadline).toISOString() : null,
          bkash_number: draftBkashNumber,
          bkash_payment_status: draftBkashStatus,
          bkash_payment_amount: Number(draftBkashAmount) || 0,
          bkash_transaction_id: draftBkashTxId,
          send_email: false,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === selected.id ? data.application : a))
        );
        setSelected(data.application);
        setNotesSaveSuccess(true);
        setTimeout(() => setNotesSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save evaluation.");
      }
    } catch {
      alert("Network error saving evaluation.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete application from "${name}"? This also removes their uploaded files.`
      )
    )
      return;
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      alert(data.error || "Failed to delete application.");
    }
  }

  async function viewDocument(id: string, type: "cv" | "proof") {
    if (type === "cv" && selected?.cv_path.startsWith("url:")) {
      const targetUrl = selected.cv_path.replace(/^url:/, "");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const res = await fetch(`/api/admin/applications/${id}/documents/${type}`);
    const data = await res.json();
    if (data.ok) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else {
      alert(data.error || "Could not open this file.");
    }
  }

  const hasActiveFilters = statusFilter !== "all" || debouncedSearch.trim() !== "";

  // Export handlers — pull every matching row across all pages, not just the
  // page currently rendered on screen.
  async function exportCandidatesCsv(exportAll = false) {
    const targetList = await fetchAllApplications({ forExportAll: exportAll });
    if (targetList.length === 0) {
      alert("No candidate applications to export.");
      return;
    }

    const headers = [
      "Applicant Name",
      "Email",
      "Phone",
      "Role Applied",
      "Status",
      "Total Score (/25)",
      "Score Status",
      "Right Prospects (/5)",
      "Real & Accurate (/5)",
      "Observations (/5)",
      "Personalized Messages (/5)",
      "Following Instructions (/5)",
      "Disqualified",
      "Disqualification Reasons",
      "Task Submission URL",
      "Task Deadline",
      "bKash Number",
      "bKash Status",
      "bKash Amount (BDT)",
      "bKash Transaction ID",
      "Applied Date",
      "Internal Notes",
      "Written Test Response",
    ];

    const sanitize = (text: string | number | boolean | null | undefined) =>
      `"${String(text ?? "")
        .replace(/"/g, '""')
        .replace(/\n/g, " ")}"`;

    const rows = targetList.map((app) => {
      const sc = app.scorecard || {};
      const total = calculateTotalScore(sc);
      const isPassed = total >= 18 && !sc.disqualified;
      const scoreStatus = sc.disqualified
        ? "Disqualified"
        : total > 0
        ? isPassed
          ? "Passed (≥18)"
          : "Below Threshold (<18)"
        : "Unrated";

      return [
        sanitize(app.applicant_name),
        sanitize(app.applicant_email),
        sanitize(app.applicant_phone || ""),
        sanitize(app.job_postings?.title || "General"),
        sanitize(app.status),
        total || "",
        sanitize(scoreStatus),
        sc.right_prospects ?? "",
        sc.real_accurate ?? "",
        sc.observations ?? "",
        sc.messages ?? "",
        sc.following_instructions ?? "",
        sc.disqualified ? "YES" : "NO",
        sanitize((sc.disqualification_reasons || []).join("; ")),
        sanitize(app.task_submission_url || ""),
        sanitize(
          app.task_deadline
            ? new Date(app.task_deadline).toISOString().split("T")[0]
            : ""
        ),
        sanitize(app.bkash_number || ""),
        sanitize(app.bkash_payment_status || "unpaid"),
        app.bkash_payment_amount ?? 500,
        sanitize(app.bkash_transaction_id || ""),
        sanitize(new Date(app.created_at).toISOString().split("T")[0]),
        sanitize(app.internal_notes || ""),
        sanitize(app.written_test_response || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `digitaldude-candidates-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  }

  async function exportBkashBatchCsv(exportAll = false) {
    const fetched = await fetchAllApplications({ forExportAll: exportAll });
    const targetList = fetched.filter((a) => a.bkash_number || a.status === "shortlisted");

    if (targetList.length === 0) {
      alert("No candidates found with bKash numbers or shortlisted status.");
      return;
    }

    const headers = [
      "Recipient Name",
      "bKash Phone Number",
      "Amount (BDT)",
      "Payment Status",
      "Transaction ID / Ref",
      "Candidate Email",
      "Role",
      "Task Submission Link",
    ];

    const sanitize = (text: string | number | null | undefined) =>
      `"${String(text ?? "")
        .replace(/"/g, '""')
        .replace(/\n/g, " ")}"`;

    const rows = targetList.map((app) => [
      sanitize(app.applicant_name),
      sanitize(app.bkash_number || "Pending Submission"),
      app.bkash_payment_amount ?? 500,
      sanitize(app.bkash_payment_status || "unpaid"),
      sanitize(app.bkash_transaction_id || ""),
      sanitize(app.applicant_email),
      sanitize(app.job_postings?.title || ""),
      sanitize(app.task_submission_url || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bkash-assessment-payroll-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  }

  async function exportJson(exportAll = false) {
    const targetList = await fetchAllApplications({ forExportAll: exportAll });
    const jsonStr = JSON.stringify(targetList, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `digitaldude-candidates-${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  }

  // Current scorecard calculation
  const currentTotal = calculateTotalScore(draftScorecard);
  const isCandidatePassing =
    currentTotal >= 18 && !draftScorecard.disqualified;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Applications &amp; Candidates
            </h1>
            <p className="text-sm text-navy/60">
              Shortlist practical tasks, score submissions (25-point rubric), track bKash stipends, and manage interviews.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple/90 transition cursor-pointer"
            >
              <Plus size={14} /> Add Candidate
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-navy/80 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-sky-600" /> Import Leads
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/80 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Download size={14} className="text-navy/60" /> Export ({totalCount})
                <ChevronDown size={13} className="text-navy/40" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40 border-b border-slate-100">
                    {hasActiveFilters ? `Export Filtered (${totalCount})` : `Export All (${totalCount})`}
                  </div>
                  <button
                    type="button"
                    onClick={() => exportCandidatesCsv(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Export Full Candidate CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportBkashBatchCsv(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <DollarSign size={14} className="text-purple" />
                    Export bKash Stipend Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => exportJson(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileText size={14} className="text-blue-500" />
                    Export as JSON
                  </button>

                  {hasActiveFilters && (
                    <>
                      <div className="mt-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40 border-t border-slate-100">
                        Export All Candidates (ignoring filters)
                      </div>
                      <button
                        type="button"
                        onClick={() => exportCandidatesCsv(true)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                      >
                        <FileSpreadsheet size={14} className="text-emerald-600" />
                        Export All Candidates (CSV)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={fetchApplications}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40"
            />
            <input
              type="text"
              placeholder="Search candidates by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-navy/40" />
            <label className="text-xs font-semibold text-navy/60">Stage:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-navy outline-none focus:border-purple"
            >
              <option value="all">All Stages</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading applications…</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Score (/25)</th>
                    <th className="py-3.5 px-4">bKash Stipend</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => {
                    const totalScore = calculateTotalScore(app.scorecard);
                    const isDQ = app.scorecard?.disqualified;
                    const isPassed = totalScore >= 18 && !isDQ;

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                        onClick={() => setSelected(app)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{app.applicant_name}</div>
                          <div className="text-[11px] text-navy/60">{app.applicant_email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-navy/70">
                          {app.job_postings?.title || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {isDQ ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              <AlertCircle size={11} /> Disqualified
                            </span>
                          ) : totalScore > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-extrabold text-xs px-2 py-0.5 rounded-md border ${
                                  isPassed
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-navy/70 border-slate-200"
                                }`}
                              >
                                {totalScore} / 25
                              </span>
                              {isPassed && (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                  Passed
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-navy/40 italic">Unrated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.bkash_payment_status === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Check size={11} /> Paid ৳{app.bkash_payment_amount ?? 500}
                            </span>
                          ) : app.bkash_number ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock size={11} /> Unpaid (৳{app.bkash_payment_amount ?? 500})
                            </span>
                          ) : (
                            <span className="text-[11px] text-navy/40">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status === "reviewing" && (
                              <button
                                onClick={() => handleOpenStatusChange(app, "shortlisted")}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                title="Shortlist & Send Practical Task"
                              >
                                Shortlist
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenStatusChange(app, "interview")}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                              title="Invite to 30-min Video Call"
                            >
                              Interview
                            </button>
                            <button
                              onClick={() => setCandidateToHire(app)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1 transition ${
                                app.status === "hired" || app.status === "offered"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-slate-200 bg-white text-navy/70 hover:bg-slate-50"
                              }`}
                              title="Hire & Convert to Employee"
                            >
                              <UserCheck size={13} />
                              {app.status === "hired" ? "Hired" : "Hire"}
                            </button>
                            <button
                              onClick={() => handleDelete(app.id, app.applicant_name)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                              title="Delete Application"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-navy">{selected.applicant_name}</h2>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                      selected.status
                    )}`}
                  >
                    {selected.status}
                  </span>
                  {sourceBadge(selected.source) && (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sourceBadge(selected.source)!.className}`}
                    >
                      {sourceBadge(selected.source)!.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy/70 mt-0.5">
                  {selected.applicant_email}
                  {selected.applicant_phone ? ` · ${selected.applicant_phone}` : ""}
                </p>
                <p className="text-xs text-navy/50 mt-1">
                  Applied for{" "}
                  <strong className="text-navy">{selected.job_postings?.title || "—"}</strong> on{" "}
                  {new Date(selected.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-navy/40 hover:bg-slate-100 hover:text-navy transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions & Stage Transition Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-navy/60">
                  Pipeline Stage
                </label>
                {inlineStage && (
                  <span className="text-[11px] font-semibold text-purple animate-pulse">
                    Stage transition in progress ↓
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const isCurrent = selected.status === s;
                  const isPendingSelected = inlineStage?.targetStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSelectInlineStage(s)}
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition shadow-2xs ${
                        isCurrent
                          ? `${statusBadgeClass(
                              s
                            )} ring-2 ring-purple/30 font-extrabold cursor-default`
                          : isPendingSelected
                          ? "border-purple bg-purple text-white shadow-sm ring-2 ring-purple/20 cursor-pointer"
                          : "border-slate-200 bg-white text-navy/60 hover:bg-purple/5 hover:border-purple/30 hover:text-purple cursor-pointer active:scale-95"
                      }`}
                    >
                      {isCurrent ? `✓ ${s}` : isPendingSelected ? `● ${s}` : s}
                    </button>
                  );
                })}
              </div>

              {/* Inline Interactive Stage Transition Box */}
              {inlineStage && (
                <div className="rounded-2xl border border-purple/30 bg-purple/[0.03] p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-start justify-between border-b border-purple/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy">
                        Transitioning to:
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                          inlineStage.targetStatus
                        )}`}
                      >
                        {inlineStage.targetStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInlineStage(null)}
                      className="rounded-lg p-1 text-navy/40 hover:bg-slate-100 hover:text-navy"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Send Email Notification Toggle */}
                  <div className="rounded-xl border border-purple/20 bg-white p-3.5 flex items-start gap-3">
                    <Mail size={16} className="text-purple mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-navy cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inlineStage.sendEmail}
                          onChange={(e) =>
                            setInlineStage((prev) =>
                              prev ? { ...prev, sendEmail: e.target.checked } : null
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-purple focus:ring-purple cursor-pointer"
                        />
                        Send notification email to {selected.applicant_email}
                      </label>
                    </div>
                  </div>

                  {inlineStage.sendEmail && (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-purple/10">
                      <div>
                        <label className="block text-xs font-semibold text-navy mb-1">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={inlineStage.subject}
                          onChange={(e) =>
                            setInlineStage((prev) =>
                              prev ? { ...prev, subject: e.target.value } : null
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                        />
                      </div>

                      {inlineStage.targetStatus === "shortlisted" && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                          <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <Clock size={13} className="text-indigo-600" /> Task Turnaround Deadline
                          </label>
                          <input
                            type="datetime-local"
                            value={inlineStage.deadline}
                            onChange={(e) => {
                              const newDeadline = e.target.value;
                              const updatedDefaults = getStatusEmailDefaults(
                                "shortlisted",
                                selected.applicant_name,
                                selected.job_postings?.title || "the role",
                                newDeadline
                              );
                              setInlineStage((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      deadline: newDeadline,
                                      message: updatedDefaults.message,
                                    }
                                  : null
                              );
                            }}
                            className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-purple"
                          />
                        </div>
                      )}

                      {inlineStage.targetStatus === "interview" && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                              <Video size={13} className="text-blue-600" /> Google Meet Video Call
                            </span>
                            <button
                              type="button"
                              onClick={() => handleGenerateMeetLink(true)}
                              disabled={inlineMeetGenerating}
                              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              {inlineMeetGenerating ? "Generating…" : "Generate Meet Link"}
                            </button>
                          </div>
                          {inlineStage.meetingLink && (
                            <p className="text-xs font-mono text-blue-800 bg-white p-2 rounded-lg border border-blue-200">
                              {inlineStage.meetingLink}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-navy mb-1">
                          Email Message Body
                        </label>
                        <textarea
                          rows={8}
                          value={inlineStage.message}
                          onChange={(e) =>
                            setInlineStage((prev) =>
                              prev ? { ...prev, message: e.target.value } : null
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setInlineStage(null)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmInlineStage}
                      disabled={inlineStageUpdating}
                      className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-purple/90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {inlineStageUpdating && <Loader2 size={13} className="animate-spin" />}
                      Confirm Stage Update
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Application Files & Actions */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => viewDocument(selected.id, "cv")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-2xs hover:bg-slate-50 transition"
              >
                <FileText size={15} className="text-purple" /> View CV / Portfolio
              </button>
              {selected.proof_of_results_path && (
                <button
                  onClick={() => viewDocument(selected.id, "proof")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-2xs hover:bg-slate-50 transition"
                >
                  <ImageIcon size={15} className="text-blue-500" /> View Proof of Results
                </button>
              )}
              <button
                onClick={() => {
                  const app = selected;
                  setSelected(null);
                  setCandidateToHire(app);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <UserCheck size={15} /> Convert to Employee / Hire
              </button>
            </div>

            {/* Candidate Written Test Assessment (Initial Screening) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/70">
                Initial Application Written Response
              </h3>
              <p className="whitespace-pre-wrap text-sm text-navy/90 leading-relaxed font-mono text-xs bg-white p-3.5 rounded-xl border border-slate-200/80">
                {selected.written_test_response || "(No written response provided)"}
              </p>
            </div>

            {/* Imported Lead Screening Answers */}
            {selected.screening_answers && Object.keys(selected.screening_answers).length > 0 && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Lead Form Screening Answers
                </h3>
                <div className="space-y-2">
                  {Object.entries(selected.screening_answers).map(([question, answer]) => (
                    <div key={question} className="bg-white p-3 rounded-xl border border-sky-200/70">
                      <p className="text-[11px] font-bold text-navy/70">{question}</p>
                      <p className="text-xs text-navy mt-0.5">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 25-Point Assessment Scorecard Rubric */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Star size={18} className="fill-amber-400 text-amber-400" />
                    Practical Task Evaluation Rubric (25 Points)
                  </h3>
                  <p className="text-xs text-navy/60 mt-0.5">
                    Score submissions out of 25. Candidates scoring 18+ qualify for the 30-minute video call.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy/40 block">
                      Total Score
                    </span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span
                        className={`text-xl font-extrabold px-3 py-0.5 rounded-xl border ${
                          draftScorecard.disqualified
                            ? "bg-red-50 text-red-700 border-red-200"
                            : isCandidatePassing
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-navy border-slate-200"
                        }`}
                      >
                        {draftScorecard.disqualified ? "DQ" : `${currentTotal} / 25`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threshold Status Banner */}
              {draftScorecard.disqualified ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-red-900">
                    <strong className="font-bold block text-sm">Candidate Disqualified (Automatic No)</strong>
                    Work contains unverified leads, AI clichés, or missed deadline. Compensate complete work on time via bKash, then reject.
                  </div>
                </div>
              ) : currentTotal >= 18 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950">
                      <strong className="font-bold block text-sm">
                        Passed Threshold ({currentTotal}/25 pts) — Invite to Video Call!
                      </strong>
                      Candidate demonstrated strong qualification (AU/UK decision-makers, human copy, accurate details).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectInlineStage("interview")}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition shrink-0 cursor-pointer"
                  >
                    Schedule 30-min Video Call →
                  </button>
                </div>
              ) : currentTotal > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-center gap-3 text-xs text-amber-950">
                  <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                  <div>
                    <strong>Score ({currentTotal}/25) is below the 18-point threshold for interview.</strong> Pay for completed work via bKash and update stage to Rejected.
                  </div>
                </div>
              ) : null}

              {/* 5 Evaluation Criteria */}
              <div className="space-y-3">
                <RubricScoreSelector
                  title="1. Right Prospects (0 to 5 points)"
                  subtitle="All 10 match target criteria: decision-maker, AU/UK, 5 to 200 staff, correct industry profile."
                  score={draftScorecard.right_prospects}
                  onChange={(val) =>
                    setDraftScorecard((prev) => ({ ...prev, right_prospects: val }))
                  }
                />

                <RubricScoreSelector
                  title="2. Real and Accurate (0 to 5 points)"
                  subtitle="Spot-check 3 people: LinkedIn links work and contact/company details are verified."
                  score={draftScorecard.real_accurate}
                  onChange={(val) =>
                    setDraftScorecard((prev) => ({ ...prev, real_accurate: val }))
                  }
                />

                <RubricScoreSelector
                  title="3. Specific Observations (0 to 5 points)"
                  subtitle="Specific and useful, not generic. (e.g. 'Hiring a bookings coordinator' beats 'growing company')."
                  score={draftScorecard.observations}
                  onChange={(val) =>
                    setDraftScorecard((prev) => ({ ...prev, observations: val }))
                  }
                />

                <RubricScoreSelector
                  title="4. Tailored Human Messages (0 to 5 points)"
                  subtitle="Under 120 words, opens with the prospect, references a relevant project, soft question, zero AI tone."
                  score={draftScorecard.messages}
                  onChange={(val) =>
                    setDraftScorecard((prev) => ({ ...prev, messages: val }))
                  }
                />

                <RubricScoreSelector
                  title="5. Following Instructions (0 to 5 points)"
                  subtitle="On time, clean Google Sheet format, all fields complete, bKash personal number included."
                  score={draftScorecard.following_instructions}
                  onChange={(val) =>
                    setDraftScorecard((prev) => ({
                      ...prev,
                      following_instructions: val,
                    }))
                  }
                />
              </div>

              {/* Automatic Disqualifications Section */}
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-500" />
                    Automatic Disqualification Flags (Automatic No)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftScorecard.disqualified}
                      onChange={(e) =>
                        setDraftScorecard((prev) => ({
                          ...prev,
                          disqualified: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    Mark as Disqualified
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {DISQUALIFICATION_OPTIONS.map((opt) => {
                    const isChecked = (
                      draftScorecard.disqualification_reasons || []
                    ).includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex items-start gap-2 text-xs text-navy/80 bg-white p-2.5 rounded-xl border border-red-100 cursor-pointer hover:bg-red-50/50 transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = draftScorecard.disqualification_reasons || [];
                            const updated = e.target.checked
                              ? [...cur, opt.id]
                              : cur.filter((id) => id !== opt.id);
                            setDraftScorecard((prev) => ({
                              ...prev,
                              disqualification_reasons: updated,
                              disqualified: updated.length > 0 ? true : prev.disqualified,
                            }));
                          }}
                          className="h-3.5 w-3.5 rounded border-red-300 text-red-600 focus:ring-red-500 mt-0.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Task Submission & bKash Payout Tracking */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <DollarSign size={14} className="text-purple" />
                    Paid Practical Task &amp; bKash Stipend Tracking
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-navy/60">Status:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftBkashStatus((prev) =>
                          prev === "paid" ? "unpaid" : "paid"
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                        draftBkashStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {draftBkashStatus === "paid" ? "✓ Paid" : "● Unpaid"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Task Submission URL (Google Sheet)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={draftTaskUrl}
                        onChange={(e) => setDraftTaskUrl(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple font-mono"
                      />
                      {draftTaskUrl && (
                        <a
                          href={draftTaskUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-slate-200 bg-white p-2.5 text-purple hover:bg-purple/5 transition"
                          title="Open Sheet"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Candidate bKash Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="01XXXXXXXXX"
                      value={draftBkashNumber}
                      onChange={(e) => setDraftBkashNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      Stipend Payout Amount (BDT)
                    </label>
                    <input
                      type="number"
                      value={draftBkashAmount}
                      onChange={(e) => setDraftBkashAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1">
                      bKash Transaction ID / Reference Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TXN987654321 / Paid on Oct 2"
                      value={draftBkashTxId}
                      onChange={(e) => setDraftBkashTxId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                  Internal Review Notes &amp; Feedback
                </label>
                <textarea
                  rows={4}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Notes on candidate observations, outreach quality, interview impressions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {notesSaveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={15} /> Rubric evaluation and notes saved successfully!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleSaveScorecardAndNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-navy/90 disabled:opacity-50 transition cursor-pointer"
                >
                  {savingNotes && <Loader2 size={13} className="animate-spin" />}
                  {savingNotes ? "Saving…" : "Save Rubric Score & Payout Info"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change & Candidate Email Notification Modal (from table action) */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-navy">
                  Update Candidate Stage:{" "}
                  <span className="capitalize text-purple">
                    {pendingStatusModal.newStatus}
                  </span>
                </h2>
                <p className="text-xs text-navy/60 mt-0.5">
                  Applicant: <strong>{pendingStatusModal.application.applicant_name}</strong> (
                  {pendingStatusModal.application.applicant_email})
                </p>
              </div>
              <button
                onClick={() => setPendingStatusModal(null)}
                className="rounded-xl p-1.5 text-navy/40 hover:bg-slate-100 hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            {/* Send Email Toggle */}
            <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 flex items-start gap-3">
              <Mail size={18} className="text-purple mt-0.5" />
              <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-bold text-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingStatusModal.sendEmail}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, sendEmail: e.target.checked } : null
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple focus:ring-purple cursor-pointer"
                  />
                  Send branded notification email to candidate
                </label>
                <p className="text-[11px] text-navy/60 mt-1">
                  Deliver an automated, customized status update to{" "}
                  {pendingStatusModal.application.applicant_email}.
                </p>
              </div>
            </div>

            {pendingStatusModal.sendEmail && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={pendingStatusModal.subject}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, subject: e.target.value } : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>

                {pendingStatusModal.newStatus === "shortlisted" && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2">
                    <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-600" /> Task Turnaround Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={pendingStatusModal.deadline}
                      onChange={(e) => {
                        const newDeadline = e.target.value;
                        const updatedDefaults = getStatusEmailDefaults(
                          "shortlisted",
                          pendingStatusModal.application.applicant_name,
                          pendingStatusModal.application.job_postings?.title || "the role",
                          newDeadline
                        );
                        setPendingStatusModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                deadline: newDeadline,
                                message: updatedDefaults.message,
                              }
                            : null
                        );
                      }}
                      className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-purple"
                    />
                  </div>
                )}

                {pendingStatusModal.newStatus === "interview" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-3">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Video size={13} className="text-blue-600" /> Google Meet Video Call
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={pendingStatusModal.interviewDate}
                        onChange={(e) =>
                          setPendingStatusModal((prev) =>
                            prev ? { ...prev, interviewDate: e.target.value } : null
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-navy outline-none focus:border-purple"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateMeetLink(false)}
                        disabled={generatingMeet}
                        className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
                      >
                        {generatingMeet ? "Generating…" : "Generate Meet Link"}
                      </button>
                    </div>
                    {pendingStatusModal.meetingLink && (
                      <p className="text-xs font-mono text-blue-800 bg-white p-2 rounded-lg border border-blue-200">
                        {pendingStatusModal.meetingLink}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Email Message Body
                  </label>
                  <textarea
                    rows={8}
                    value={pendingStatusModal.message}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, message: e.target.value } : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPendingStatusModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusUpdate}
                disabled={updatingStatus}
                className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-purple/90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {updatingStatus && <Loader2 size={13} className="animate-spin" />}
                Confirm Status Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {isAddCandidateOpen && (
        <AddCandidateModal
          isOpen={isAddCandidateOpen}
          onClose={() => setIsAddCandidateOpen(false)}
          onCreated={(newApp: Application) => {
            setApplications((prev) => [newApp, ...prev]);
            setSelected(newApp);
            setIsAddCandidateOpen(false);
          }}
        />
      )}

      {/* Import Candidates Modal */}
      {isImportOpen && (
        <ImportCandidatesModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImported={fetchApplications}
        />
      )}

      {/* Hire & Convert to Employee Modal */}
      {candidateToHire && (
        <HireCandidateModal
          application={{
            id: candidateToHire.id,
            applicant_name: candidateToHire.applicant_name,
            applicant_email: candidateToHire.applicant_email,
            job_title: candidateToHire.job_postings?.title,
          }}
          onClose={() => setCandidateToHire(null)}
          onSuccess={() => {
            fetchApplications();
            setCandidateToHire(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
