"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Link as LinkIcon,
  Copy,
  Check,
  Calendar,
  DollarSign,
  TrendingUp,
  Send,
  Mail,
  User,
  Building,
  CheckCircle2,
  Circle,
  FileText,
  LogOut,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  CreditCard,
  BookOpen,
  Award,
  Clock,
  Layers,
  HelpCircle,
  ChevronRight,
  Plus,
  Filter,
  Users,
  Menu,
  X,
  Phone,
  Briefcase,
  ArrowUpRight,
  Flame,
  CheckSquare,
  Square,
  RefreshCw,
  FolderGit2,
  Inbox,
  LayoutDashboard,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";
import { RepAnalyticsOverview } from "@/components/rep/RepAnalyticsOverview";
import { RepPoolPanel } from "@/components/rep/PoolPanel";
import { LeadsCrm } from "@/components/rep/crm/LeadsCrm";
import type { CrmLead, Forecast } from "@/components/rep/crm/shared";
import { NotificationBell } from "@/components/rep/NotificationBell";
import { repTemplates } from "@/lib/industryTemplates";
import { DESIGNS, DESIGN_LABELS, defaultDesignFor, type DesignId } from "@/lib/emailDesign";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

interface SourcedBooking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  slot_start: string;
  status: string;
  stage?: string;
  deal_value?: number;
  meeting_bonus_payout_status?: string;
  deal_commission_payout_status?: string;
  payout_notes?: string;
  created_at: string;
}

interface RepProfile {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  photo_url?: string | null;
  employment_type: string;
  currency: string;
  referral_code?: string;
  assigned_outreach_email?: string;
  outreach_display_name?: string;
  meeting_bonus_min: number | null;
  meeting_bonus_max: number | null;
  deal_commission_percent_min: number | null;
  deal_commission_percent_max: number | null;
  status: string;
  onboarding_completed?: boolean;
  onboarding_checklist: ChecklistItem[];
  payout_details?: Record<string, string>;
  daily_outreach_limit?: number;
}

interface CommissionSummary {
  currency: string;
  totalBookingsCount: number;
  qualifiedMeetings: number;
  meetingBonusRangeTotal: [number, number];
  meetingBonusPaidCount: number;
  wonDealsCount: number;
  wonDealValue: number;
  dealCommissionRangeTotal: [number, number];
  dealCommissionPaidCount: number;
  outreachSentCount: number;
}

interface OutreachLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  company_name: string | null;
  subject: string;
  body_content: string;
  template_used: string | null;
  sent_at: string;
}

type RepLead = CrmLead;

interface CustomTemplate {
  id: string;
  template_name: string;
  subject: string;
  body_content: string;
  is_default?: boolean;
}

export interface CampaignStep {
  id: string;
  step_number: number;
  delay_days: number;
  subject: string;
  body: string;
}

export interface CampaignEnrollment {
  id: string;
  lead_id: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  last_dispatched_at: string | null;
  rep_leads?: {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    status: string;
  };
}

export interface CampaignItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  rep_campaign_steps?: CampaignStep[];
  rep_campaign_enrollments?: CampaignEnrollment[];
}

export interface CampaignQueueItem {
  id: string;
  scheduled_for: string;
  status: string;
  step_number: number;
  dispatched_at: string | null;
  error_message: string | null;
  rep_leads?: {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
  };
  rep_campaigns?: {
    id: string;
    title: string;
  };
  rep_campaign_steps?: {
    id: string;
    subject: string;
  };
}

const BUILTIN_TEMPLATES = [
  {
    id: "custom_crm",
    name: "Custom CRM & Systems Architecture",
    subject: "Modernizing digital platforms & internal workflows for {{company}}",
    body: "Hi {{name}},\n\nI noticed {{company}} is rapidly scaling and likely managing complex operations across disparate software tools.\n\nAt The Digital Dude, we engineer bespoke web systems, internal operations platforms, and automated pipelines tailored specifically to your exact business model.\n\nIs that something you're dealing with? If it is, you can book a 30-minute call with the button below.",
  },
  {
    id: "mvp_saas",
    name: "MVP & SaaS Full-Stack Development",
    subject: "Engineering {{company}}'s high-performance SaaS roadmap",
    body: "Hi {{name}},\n\nReaching out from The Digital Dude. We specialize in rapid end-to-end architecture and full-stack development of high-performance web applications, MVP platforms, and SaaS products.\n\nIf you're currently scoping or accelerating technical development, we'd love to share some recent architecture case studies and discuss how we can expedite your launch.\n\nIf that's useful, you can book a 30-minute call with the button below.",
  },
  {
    id: "follow_up",
    name: "Value Follow-Up & Case Study",
    subject: "Quick follow-up regarding {{company}} digital platform",
    body: "Hi {{name}},\n\nFollowing up on my previous note regarding custom software systems for {{company}}.\n\nYou can review some of our live client transformations and technical architectures here: {{referral_link}}\n\nIf it helps, you can book a 30-minute call with the button below.",
  },
];

export default function RepDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "pool" | "campaigns" | "outreach" | "onboarding" | "payouts">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RepProfile | null>(null);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [bookings, setBookings] = useState<SourcedBooking[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [leads, setLeads] = useState<RepLead[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  // UI States
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<RepLead | null>(null);

  // New Lead Form
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadJobTitle, setNewLeadJobTitle] = useState("");
  const [newLeadStage, setNewLeadStage] = useState<RepLead["stage"]>("new");
  const [newLeadValue, setNewLeadValue] = useState<number>(0);
  const [newLeadNotes, setNewLeadNotes] = useState("");
  const [savingLead, setSavingLead] = useState(false);

  // Outreach Composer State
  const [selectedTemplateId, setSelectedTemplateId] = useState("custom_crm");
  // A reply suggestion filled into the composer: kept until the rep picks a template, so the template effect does not overwrite it.
  const replyDraft = useRef<{ subject: string; message: string } | null>(null);
  // "Write with AI": the AI drafts from the contact's verified research; this holds what it used, so the rep can see the evidence.
  // Stage: a first cold email (booking button on) or a follow-up (plain note, button off by default).
  const [outreachStage, setOutreachStage] = useState<"cold" | "follow_up">("cold");
  const [includeButton, setIncludeButton] = useState(true);
  // Email design: "auto" = the stage's default (cold: minimal personal, follow-up: plain text). The preview uses the same builder as sending.
  const [outreachDesign, setOutreachDesign] = useState<"auto" | DesignId>("auto");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<{ error?: string; general?: boolean; usedFacts?: { n: number; claim: string; sourceUrl: string }[]; blocked?: string | null } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachStatus, setOutreachStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [riskyWarning, setRiskyWarning] = useState<string | null>(null);

  // Template Manager Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Campaigns & Drips State
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignQueue, setCampaignQueue] = useState<CampaignQueueItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [dispatchingQueue, setDispatchingQueue] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  // Bulk Lead Selection for Campaigns
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTargetCampaignId, setEnrollTargetCampaignId] = useState<string>("");
  const [enrollingLeads, setEnrollingLeads] = useState(false);
  const [enrollResult, setEnrollResult] = useState<string | null>(null);

  // Create Campaign Modal
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Payout Details Form
  const [payoutMethod, setPayoutMethod] = useState("bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Onboarding Checklist
  const [onboardingChecklist, setOnboardingChecklist] = useState<ChecklistItem[]>([]);
  const [togglingOnboarding, setTogglingOnboarding] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/rep/dashboard");
        if (res.status === 401) {
          router.push("/rep/login");
          return;
        }

        const data = await res.json();
        const repData = data.employee || data.rep;
        if (data.ok && repData) {
          setProfile(repData);
          setCommissionSummary(data.commissionSummary);
          setBookings(data.bookings || data.sourcedBookings || []);
          setOutreachLogs(data.outreachLogs || []);
          setOnboardingChecklist(repData.onboarding_checklist || []);

          if (repData.payout_details) {
            setPayoutMethod(repData.payout_details.method || "bkash");
            setAccountNumber(repData.payout_details.account_number || "");
            setBankName(repData.payout_details.bank_name || "");
            setBranchName(repData.payout_details.branch_name || "");
            setRoutingNumber(repData.payout_details.routing_number || "");
            setPayoutNotes(repData.payout_details.notes || "");
          }

          if (!repData.onboarding_completed) {
            setActiveTab("onboarding");
          }
        } else {
          router.push("/rep/login");
        }
      } catch {
        router.push("/rep/login");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    fetchLeads();
    fetchCustomTemplates();
    fetchCampaigns();
    fetchCampaignQueue();
  }, [router]);

  /**
   * Quietly re-reads the profile, earnings, bookings and outreach log. Unlike the first load it never touches the payout
   * form fields or the active tab, so it is safe to run while the rep is typing.
   */
  const refreshDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/rep/dashboard");
      if (res.status === 401) {
        router.push("/rep/login");
        return;
      }
      const data = await res.json();
      const repData = data.employee || data.rep;
      if (data.ok && repData) {
        setProfile(repData);
        setCommissionSummary(data.commissionSummary);
        setBookings(data.bookings || data.sourcedBookings || []);
        setOutreachLogs(data.outreachLogs || []);
      }
    } catch {}
  }, [router]);

  async function fetchCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/rep/campaigns");
      const data = await res.json();
      if (data.ok) {
        setCampaigns(data.campaigns || []);
        if (data.campaigns?.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      }
    } catch {} finally {
      setLoadingCampaigns(false);
    }
  }

  async function fetchCampaignQueue() {
    try {
      const res = await fetch("/api/rep/campaigns/queue");
      const data = await res.json();
      if (data.ok) {
        setCampaignQueue(data.queue || []);
      }
    } catch {}
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaignTitle.trim()) return;
    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/rep/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCampaignTitle.trim(),
          description: newCampaignDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowCreateCampaignModal(false);
        setNewCampaignTitle("");
        setNewCampaignDesc("");
        fetchCampaigns();
      }
    } catch {} finally {
      setCreatingCampaign(false);
    }
  }

  async function handleBulkEnroll() {
    if (!enrollTargetCampaignId || selectedLeadIds.length === 0) return;
    setEnrollingLeads(true);
    setEnrollResult(null);
    try {
      const res = await fetch(`/api/rep/campaigns/${enrollTargetCampaignId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: selectedLeadIds }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnrollResult(`Successfully enrolled ${data.enrolled} lead(s) into campaign!`);
        setTimeout(() => {
          setShowEnrollModal(false);
          setSelectedLeadIds([]);
          setEnrollResult(null);
          fetchCampaigns();
          fetchCampaignQueue();
        }, 1500);
      } else {
        setEnrollResult(data.error || "Failed to enroll leads");
      }
    } catch (err) {
      setEnrollResult((err as Error).message);
    } finally {
      setEnrollingLeads(false);
    }
  }

  async function handleTriggerDispatch() {
    setDispatchingQueue(true);
    setDispatchResult(null);
    try {
      const res = await fetch("/api/cron/process-outreach", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setDispatchResult(`Processed ${data.processed} due email(s) successfully!`);
        fetchCampaignQueue();
        fetchCampaigns();
      } else {
        setDispatchResult(data.error || "Dispatch execution failed");
      }
    } catch (err) {
      setDispatchResult((err as Error).message);
    } finally {
      setDispatchingQueue(false);
      setTimeout(() => setDispatchResult(null), 4000);
    }
  }

  async function handleCancelQueueItem(queueId: string) {
    try {
      await fetch("/api/rep/campaigns/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_id: queueId, action: "cancel" }),
      });
      fetchCampaignQueue();
    } catch {}
  }

  async function fetchLeads() {
    try {
      const res = await fetch("/api/rep/leads");
      const data = await res.json();
      if (data.ok) {
        setLeads(data.leads || []);
      }
    } catch {}
  }

  async function fetchCustomTemplates() {
    try {
      const res = await fetch("/api/rep/templates");
      const data = await res.json();
      if (data.ok) {
        setCustomTemplates(data.templates || []);
      }
    } catch {}
  }

  // Template selection & variable replacement
  useEffect(() => {
    const allTemplates = [
      ...BUILTIN_TEMPLATES,
      ...repTemplates(),
      ...customTemplates.map((t) => ({
        id: t.id,
        name: t.template_name,
        subject: t.subject,
        body: t.body_content,
      })),
    ];

    if (replyDraft.current) {
      setEmailSubject(replyDraft.current.subject);
      setEmailMessage(replyDraft.current.message);
      return;
    }
    const found = allTemplates.find((t) => t.id === selectedTemplateId) || BUILTIN_TEMPLATES[0];
    if (found) {
      const refLink = `${SITE_URL}/contact?ref=${profile?.referral_code || "rep"}`;
      const nameVal = recipientName.trim() ? recipientName.trim().split(/\s+/)[0] : "there";
      const compVal = companyName.trim() || "your team";

      const replacedSubject = found.subject
        .replace(/\{\{name\}\}/gi, nameVal)
        .replace(/\{\{company\}\}/gi, compVal);

      const replacedBody = found.body
        .replace(/\{\{name\}\}/gi, nameVal)
        .replace(/\{\{company\}\}/gi, compVal)
        .replace(/\{\{rep_name\}\}/gi, (profile?.outreach_display_name || "").trim() || "The Digital Dude Partnerships")
        .replace(/\{\{referral_link\}\}/gi, refLink);

      setEmailSubject(replacedSubject);
      setEmailMessage(replacedBody);
    }
  }, [selectedTemplateId, recipientName, companyName, profile?.referral_code, profile?.outreach_display_name, customTemplates]);

  // ---- Freshness -------------------------------------------------------------------------------------------------
  // Data is loaded once at start, but it changes elsewhere (the Lead Pool, the drip cron, replies, bookings). So every tab
  // re-reads what it shows when it is opened, when the browser tab regains focus, and once a minute while it is visible.
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const refreshTab = useCallback(
    (tab: string) => {
      switch (tab) {
        case "overview":
          void refreshDashboard();
          void fetchLeads();
          break;
        case "leads":
          void fetchLeads();
          break;
        case "campaigns":
          void fetchLeads();
          void fetchCampaigns();
          void fetchCampaignQueue();
          break;
        case "outreach":
          void refreshDashboard();
          void fetchLeads();
          break;
        case "payouts":
          void refreshDashboard();
          break;
        default:
          break; // the Lead Pool panel loads its own data
      }
    },
    // The fetchers only set state, so they are stable in effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshDashboard]
  );

  useEffect(() => {
    if (!profile) return; // not loaded yet: the first load covers it
    refreshTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refreshTab(activeTabRef.current);
    };
    const timer = setInterval(refreshIfVisible, 60_000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [refreshTab]);

  function handleCopyReferralLink() {
    const link = `${SITE_URL}/contact?ref=${profile?.referral_code || ""}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function handleLogout() {
    try {
      await fetch("/api/rep/auth/logout", { method: "POST" });
      router.push("/rep/login");
    } catch {
      router.push("/rep/login");
    }
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeadName || !newLeadEmail) return;

    setSavingLead(true);
    try {
      const url = editingLead ? `/api/rep/leads/${editingLead.id}` : "/api/rep/leads";
      const method = editingLead ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newLeadName,
          email: newLeadEmail,
          phone: newLeadPhone,
          company_name: newLeadCompany,
          job_title: newLeadJobTitle,
          stage: newLeadStage,
          estimated_deal_value: newLeadValue,
          notes: newLeadNotes,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        // Reload so the scores, next steps and quiet-lead flags are the computed ones, not the bare row.
        await fetchLeads();
        setShowAddLeadModal(false);
        resetLeadForm();
        if (data.emailCheck?.status === "risky") alert(`Lead saved, but check the email address: ${data.emailCheck.reason}`);
      } else {
        alert(data.error || "Failed to save lead.");
      }
    } catch {
      alert("Network error saving lead.");
    } finally {
      setSavingLead(false);
    }
  }

  function resetLeadForm() {
    setEditingLead(null);
    setNewLeadName("");
    setNewLeadEmail("");
    setNewLeadPhone("");
    setNewLeadCompany("");
    setNewLeadJobTitle("");
    setNewLeadStage("new");
    setNewLeadValue(0);
    setNewLeadNotes("");
  }

  async function handleDeleteLead(leadId: string) {
    if (!confirm("Are you sure you want to delete this prospect?")) return;
    try {
      const res = await fetch(`/api/rep/leads/${leadId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
      }
    } catch {}
  }

  async function handlePreviewEmail() {
    setPreviewBusy(true);
    try {
      const res = await fetch("/api/rep/outreach/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: outreachDesign === "auto" ? undefined : outreachDesign, stage: outreachStage, subject: emailSubject, message: emailMessage, includeButton, recipientEmail }),
      });
      const data = await res.json();
      setPreviewHtml(data.ok ? String(data.html) : null);
      if (!data.ok) setOutreachStatus({ type: "error", message: data.error || "Could not build the preview." });
    } catch {
      setOutreachStatus({ type: "error", message: "Network error building the preview." });
    } finally {
      setPreviewBusy(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/rep/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) setProfile((p) => (p ? { ...p, photo_url: data.photoUrl } : p));
      else setPhotoError(data.error || "Could not upload the photo.");
    } catch {
      setPhotoError("Network error uploading the photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handlePhotoRemove() {
    setPhotoBusy(true);
    try {
      const res = await fetch("/api/rep/photo", { method: "DELETE" });
      if ((await res.json()).ok) setProfile((p) => (p ? { ...p, photo_url: null } : p));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleWriteWithAI(emailArg?: string) {
    const email = (emailArg ?? recipientEmail).trim();
    if (!email) {
      setAiResult({ error: "Enter the prospect's email first." });
      return;
    }
    setAiBusy(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/rep/pool/compose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, stage: outreachStage }) });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAiResult({ error: data.error || "The AI could not write this email." });
        return;
      }
      replyDraft.current = { subject: data.subject, message: data.body }; // keep it: the template effect must not overwrite it
      setEmailSubject(data.subject);
      setEmailMessage(data.body);
      if (data.name && !recipientName.trim()) setRecipientName(data.name);
      if (data.company && !companyName.trim()) setCompanyName(data.company);
      setAiResult({ general: data.general, usedFacts: data.usedFacts, blocked: data.sendBlocked });
    } catch {
      setAiResult({ error: "Network error. Please try again." });
    } finally {
      setAiBusy(false);
    }
  }

  function handleEmailLeadShortcut(lead: RepLead) {
    setRecipientName(lead.full_name);
    setRecipientEmail(lead.email);
    setCompanyName(lead.company_name || "");
    setActiveTab("outreach");
  }

  async function handleUpdateLeadStage(leadId: string, nextStage: RepLead["stage"]) {
    try {
      const res = await fetch(`/api/rep/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
        );
      }
    } catch {}
  }

  async function handleSaveCustomTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateName || !newTemplateSubject || !newTemplateBody) return;

    setSavingTemplate(true);
    try {
      const res = await fetch("/api/rep/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_name: newTemplateName,
          subject: newTemplateSubject,
          body_content: newTemplateBody,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setCustomTemplates((prev) => [data.template, ...prev]);
        setShowTemplateModal(false);
        setNewTemplateName("");
        setNewTemplateSubject("");
        setNewTemplateBody("");
        setSelectedTemplateId(data.template.id);
      } else {
        alert(data.error || "Failed to save template.");
      }
    } catch {
      alert("Network error saving template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSendOutreach(e: React.FormEvent, forceSend = false, confirmRisky = false) {
    if (e) e.preventDefault();
    setSendingOutreach(true);
    setOutreachStatus(null);
    setDuplicateWarning(null);
    setRiskyWarning(null);

    try {
      const res = await fetch("/api/rep/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          companyName,
          subject: emailSubject,
          message: emailMessage,
          templateUsed: selectedTemplateId,
          stage: outreachStage,
          design: outreachDesign === "auto" ? undefined : outreachDesign,
          includeButton,
          forceSend,
          confirmRisky,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.riskyWarning) {
        setRiskyWarning(data.error);
        setSendingOutreach(false);
        return;
      }

      if (res.status === 409 && (data.isDuplicate || data.duplicateWarning)) {
        setDuplicateWarning(data.error);
        setSendingOutreach(false);
        return;
      }

      if (data.ok) {
        setOutreachStatus({ type: "success", message: data.message || "Outreach email sent successfully!" });
        setDuplicateWarning(null);
        setRecipientEmail("");
        setRecipientName("");
        setCompanyName("");

        if (data.log) {
          setOutreachLogs((prev) => [data.log, ...prev]);
        }
      } else {
        setOutreachStatus({ type: "error", message: data.error || "Failed to send outreach email." });
      }
    } catch {
      setOutreachStatus({ type: "error", message: "Network error sending email." });
    } finally {
      setSendingOutreach(false);
    }
  }

  async function handleSavePayoutDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayout(true);
    setPayoutSuccess(false);

    try {
      const res = await fetch("/api/rep/payout-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout_details: {
            method: payoutMethod,
            account_number: accountNumber,
            bank_name: bankName,
            branch_name: branchName,
            routing_number: routingNumber,
            notes: payoutNotes,
          },
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPayoutSuccess(true);
        setTimeout(() => setPayoutSuccess(false), 3000);
      }
    } catch {} finally {
      setSavingPayout(false);
    }
  }

  async function handleCompleteOnboarding() {
    setTogglingOnboarding(true);
    try {
      const res = await fetch("/api/rep/onboarding/complete", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        if (profile) {
          setProfile({ ...profile, onboarding_completed: true });
        }
        setActiveTab("overview");
      }
    } catch {} finally {
      setTogglingOnboarding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading Sales CRM Workspace…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full rounded-3xl bg-[#131B2E] border border-white/10 p-8 space-y-4 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/20 text-purple-400">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-lg font-bold text-white">Sales Rep Session Required</h2>
          <p className="text-xs text-slate-400">
            Please log in with your authorized corporate email to access your personal CRM dashboard.
          </p>
          <button
            onClick={() => router.push("/rep/login")}
            className="w-full rounded-xl bg-gradient-to-r from-purple to-[#7C3AED] py-3 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-purple/20 transition"
          >
            Go to Sales Rep Login &rarr;
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = profile.currency === "BDT" ? "৳" : profile.currency === "GBP" ? "£" : "$";
  const repSenderEmail = (profile.assigned_outreach_email || "").trim() || "outreach@digitaldude.co.uk";
  const repDisplayName = (profile.outreach_display_name || "").trim() || "The Digital Dude Partnerships";
  const referralLink = `${SITE_URL}/contact?ref=${profile.referral_code || "rep"}`;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-purple selection:text-white">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-purple/10 blur-[140px]" />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE TOP BAR */}
      {/* ========================================================================= */}
      <div className="md:hidden flex items-center justify-between bg-[#0D1322]/95 border-b border-white/[0.08] px-5 py-3.5 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-full-color.png"
            alt="The Digital Dude"
            width={120}
            height={24}
            className="h-6 w-auto brightness-0 invert"
          />
          <span className="rounded bg-purple/20 border border-purple/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-300">
            Sales
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED SLEEK CRM SIDEBAR */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0D1322] border-r border-white/[0.08] flex flex-col justify-between p-4 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] px-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo-full-color.png"
                alt="The Digital Dude"
                width={130}
                height={26}
                className="h-6 w-auto brightness-0 invert"
              />
              <span className="rounded bg-purple/20 border border-purple/40 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-300">
                CRM
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview & Metrics", icon: LayoutDashboard },
              { id: "leads", label: "Leads CRM", icon: Users, badge: leads.length },
              ...(profile.onboarding_completed ? [{ id: "pool", label: "Lead Pool", icon: Layers }] : []),
              { id: "campaigns", label: "Campaigns & Drips", icon: Layers, badge: campaigns.length },
              { id: "outreach", label: "Cold Outreach", icon: Send, badge: outreachLogs.length },
              { id: "onboarding", label: "Pitch Deck & Guide", icon: BookOpen, tag: !profile.onboarding_completed ? "START" : undefined },
              { id: "payouts", label: "Earnings & Payouts", icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-purple/30 to-purple/10 border border-purple/40 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? "text-purple-400" : "text-slate-400"} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.tag && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/40">
                      {tab.tag}
                    </span>
                  )}
                  {typeof tab.badge === "number" && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? "bg-purple text-white" : "bg-white/10 text-slate-400"}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rep Profile Mini Card & Logout */}
        <div className="space-y-3 pt-4 border-t border-white/[0.08]">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple/20 border border-purple/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                {profile.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{repDisplayName}</p>
                <p className="text-[10px] font-mono text-purple-400 truncate">{repSenderEmail}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* TOP BAR / QUICK STATS HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-widest">
              <span>Sales Partner Engine</span>
              <span>&bull;</span>
              <span className="text-slate-400 font-mono">{profile.role_title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Welcome back, {profile.full_name.split(" ")[0]}
            </h1>
          </div>

          {/* Quick Referral Tag Copy */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial flex items-center justify-between gap-2 rounded-xl bg-[#131B2E] border border-white/[0.08] px-3 py-2 text-xs">
              <span className="text-slate-400 text-[11px]">Referral Tag:</span>
              <span className="font-mono text-purple-300 font-semibold">{profile.referral_code || "rep"}</span>
              <button
                onClick={handleCopyReferralLink}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Copy booking link"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            {profile.onboarding_completed && <NotificationBell onOpenItem={(kind) => setActiveTab(kind === "assignment" ? "pool" : "leads")} />}

            <button
              onClick={() => {
                resetLeadForm();
                setShowAddLeadModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple to-[#7C3AED] px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-purple/20 transition active:scale-95 whitespace-nowrap"
            >
              <Plus size={14} /> New Lead
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* VIEW 1: OVERVIEW & METRICS */}
        {/* ===================================================================== */}
        {activeTab === "overview" && (
          <RepAnalyticsOverview
            profile={profile}
            commissionSummary={commissionSummary}
            bookings={bookings}
            outreachLogs={outreachLogs}
            leads={leads}
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
          />
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: LEADS PIPELINE CRM */}
        {/* ===================================================================== */}
        {activeTab === "leads" && (
          <LeadsCrm
            leads={leads}
            forecast={forecast}
            selectedIds={selectedLeadIds}
            setSelectedIds={setSelectedLeadIds}
            onRefresh={() => void fetchLeads()}
            onAdd={() => {
              resetLeadForm();
              setShowAddLeadModal(true);
            }}
            onEdit={(lead) => {
              setEditingLead(lead);
              setNewLeadName(lead.full_name);
              setNewLeadEmail(lead.email);
              setNewLeadPhone(lead.phone || "");
              setNewLeadCompany(lead.company_name || "");
              setNewLeadJobTitle(lead.job_title || "");
              setNewLeadStage(lead.stage);
              setNewLeadValue(lead.estimated_deal_value || 0);
              setNewLeadNotes(lead.notes || "");
              setShowAddLeadModal(true);
            }}
            onDelete={(id) => void handleDeleteLead(id)}
            onEmail={(lead) => handleEmailLeadShortcut(lead)}
            onEnroll={() => {
              if (campaigns.length > 0) {
                setEnrollTargetCampaignId(campaigns[0].id);
              }
              setShowEnrollModal(true);
            }}
          />
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: CAMPAIGNS & DRIP SEQUENCES */}
        {/* ===================================================================== */}
        {activeTab === "pool" && profile.onboarding_completed && (
          <RepPoolPanel
            onLeadsChanged={() => void fetchLeads()}
            onWriteEmail={(c) => {
              replyDraft.current = null;
              setRecipientName(c.name);
              setRecipientEmail(c.email);
              setCompanyName(c.company);
              setActiveTab("outreach");
              void handleWriteWithAI(c.email);
            }}
            onUseReply={(r) => {
              replyDraft.current = { subject: "Re: your reply", message: r.message };
              setRecipientName(r.name);
              setRecipientEmail(r.email);
              setCompanyName(r.company);
              setEmailSubject(replyDraft.current.subject);
              setEmailMessage(r.message);
              setActiveTab("outreach");
            }}
          />
        )}

        {activeTab === "campaigns" && (
          <div className="space-y-6">
            {/* Header & Quick Dispatch */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Automated Outreach Cadences</h2>
                <p className="text-xs text-slate-400">
                  Multi-touch email campaigns sent from your verified corporate alias.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerDispatch}
                  disabled={dispatchingQueue}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#131B2E] px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                  title="Check and dispatch any due queue emails"
                >
                  {dispatchingQueue ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                  <span>{dispatchingQueue ? "Dispatching..." : "Process Queue Now"}</span>
                </button>

                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition"
                >
                  <Plus size={14} /> New Sequence
                </button>
              </div>
            </div>

            {dispatchResult && (
              <div className="rounded-xl border border-purple/30 bg-purple/10 p-3 text-xs text-purple-200 flex items-center gap-2">
                <Sparkles size={15} className="text-purple-400 shrink-0" />
                <span>{dispatchResult}</span>
              </div>
            )}

            {/* Campaign Selector Tabs */}
            {campaigns.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/[0.08] scrollbar-none">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCampaignId === c.id
                        ? "bg-purple text-white shadow-md shadow-purple/20"
                        : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.05]"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}

            {/* Active Sequence Visualizer */}
            {(() => {
              const currentCamp = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
              if (!currentCamp) {
                return (
                  <div className="text-center py-12 rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-8 space-y-3">
                    <Layers size={32} className="mx-auto text-slate-500" />
                    <h3 className="text-sm font-bold text-white">No Sequences Created Yet</h3>
                    <p className="text-xs text-slate-400">Click &ldquo;New Sequence&rdquo; above to generate your first automated cadence.</p>
                  </div>
                );
              }

              const steps = currentCamp.rep_campaign_steps || [];
              const enrollments = currentCamp.rep_campaign_enrollments || [];

              return (
                <div className="space-y-6">
                  {/* Visual Steps Grid */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Cadence Touchpoints</span>
                        <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                          {steps.length} Steps
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">{currentCamp.description || "Automated drip sequence"}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0D1322] p-4 space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple text-white text-[10px]">
                                  {step.step_number}
                                </span>
                                Step {step.step_number}
                              </span>
                              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                                {step.delay_days === 0 ? "Day 0 (Immediate)" : `+${step.delay_days}d Delay`}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-white truncate" title={step.subject}>
                              {step.subject}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-4 leading-relaxed font-sans whitespace-pre-line">
                              {step.body}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/[0.05] text-[10px] text-slate-500 flex items-center justify-between">
                            <span>From: {repSenderEmail}</span>
                            <span className="text-emerald-400 font-semibold">Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enrolled Leads in Sequence */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Prospects in this Sequence</h3>
                        <p className="text-xs text-slate-400">Automated progression through touchpoint steps</p>
                      </div>
                      <span className="text-xs font-bold text-purple-400">{enrollments.length} Enrolled</span>
                    </div>

                    {enrollments.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No prospects currently enrolled in this cadence. Use the Leads CRM table to select and enroll leads.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2.5 px-3">Prospect</th>
                              <th className="py-2.5 px-3">Progress</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Enrolled Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {enrollments.map((e) => (
                              <tr key={e.id} className="hover:bg-white/[0.02]">
                                <td className="py-3 px-3">
                                  <span className="font-bold text-white block">{e.rep_leads?.full_name || "Prospect"}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">{e.rep_leads?.email}</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-flex items-center gap-1 rounded bg-purple/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                    Step {e.current_step} of {steps.length}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                                    {e.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                                  {new Date(e.enrolled_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 4: DIRECT COLD OUTREACH */}
        {/* ===================================================================== */}
        {activeTab === "outreach" && (
          <div className="space-y-6">
            {/* Outreach Sender Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Direct Cold Email Composer</h2>
                <p className="text-xs text-slate-400">Send personalized single emails via your corporate alias.</p>
              </div>

              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#131B2E] px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Plus size={14} /> Create Custom Template
              </button>
            </div>

            {/* Sender Identity Notice (Locked & Verified by Admin) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl bg-[#131B2E]/90 border border-purple/20 p-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sender Email Alias</span>
                <span className="font-mono text-purple-300 font-semibold">{repSenderEmail}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sender Display Name</span>
                <span className="font-semibold text-white">{repDisplayName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reply-To Routing</span>
                <span className="font-mono text-emerald-400 font-semibold">info@digitaldude.co.uk</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Brevo Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 text-[11px]">
                  <CheckCircle2 size={13} /> Domain Verified
                </span>
              </div>
            </div>

            {/* Feedback Alerts */}
            {outreachStatus && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  outreachStatus.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                }`}
              >
                {outreachStatus.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{outreachStatus.message}</span>
              </div>
            )}

            {riskyWarning && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 space-y-2">
                <p>{riskyWarning}</p>
                <button
                  type="button"
                  onClick={(e) => handleSendOutreach(e, false, true)}
                  className="rounded-lg bg-amber-500 px-3 py-1 font-bold text-black hover:bg-amber-400"
                >
                  Send Anyway
                </button>
              </div>
            )}

            {duplicateWarning && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 space-y-2">
                <p>{duplicateWarning}</p>
                <button
                  type="button"
                  onClick={(e) => handleSendOutreach(e, true)}
                  className="rounded-lg bg-amber-500 px-3 py-1 font-bold text-black hover:bg-amber-400"
                >
                  Send Anyway
                </button>
              </div>
            )}

            {/* Composer Form */}
            <form onSubmit={(e) => handleSendOutreach(e, false)} className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-6 space-y-4">
              {/* Stage: cold outreach or follow-up */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Stage</label>
                <div className="flex flex-wrap items-center gap-2">
                  {([["cold", "Cold outreach"], ["follow_up", "Follow-up"]] as const).map(([id, name]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setOutreachStage(id);
                        setIncludeButton(id === "cold"); // cold: booking button on. follow-up: plain note unless the rep turns it on.
                        replyDraft.current = null;
                        setAiResult(null);
                        setSelectedTemplateId(id === "follow_up" ? "follow_up" : "custom_crm");
                      }}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${outreachStage === id ? "bg-purple text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                    >
                      {name}
                    </button>
                  ))}
                  <label className="ml-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <input type="checkbox" checked={includeButton} onChange={(e) => setIncludeButton(e.target.checked)} />
                    Add the &ldquo;Book a 30-minute call&rdquo; button (uses your referral link)
                  </label>
                </div>
              </div>

              {/* Design, preview and signature photo */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0D1322]/60 p-3 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[14rem] flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email design</label>
                    <select
                      value={outreachDesign}
                      onChange={(e) => { setOutreachDesign(e.target.value as "auto" | DesignId); setPreviewHtml(null); }}
                      className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                    >
                      <option value="auto">Automatic: {DESIGN_LABELS[defaultDesignFor(outreachStage)].name} ({outreachStage === "cold" ? "first email" : "follow-up"})</option>
                      {DESIGNS.map((d) => <option key={d} value={d}>{DESIGN_LABELS[d].name}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => void handlePreviewEmail()} disabled={previewBusy} className="rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50 transition">
                    {previewBusy ? "Building…" : "Preview email"}
                  </button>
                  <div className="flex items-center gap-2">
                    {profile.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.photo_url} alt="Your signature photo" className="h-9 w-9 rounded-full object-cover border border-white/10" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple/30 text-xs font-bold text-white">{(profile.outreach_display_name || profile.full_name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                    )}
                    <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 transition">
                      {photoBusy ? "Saving…" : profile.photo_url ? "Change photo" : "Add your photo"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={photoBusy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f); e.target.value = ""; }} />
                    </label>
                    {profile.photo_url && <button type="button" onClick={() => void handlePhotoRemove()} disabled={photoBusy} className="text-[11px] text-slate-400 hover:text-white underline">Remove</button>}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{DESIGN_LABELS[outreachDesign === "auto" ? defaultDesignFor(outreachStage) : outreachDesign].hint} Your photo (JPEG, PNG or WebP, up to 2 MB) shows in your signature on the designs that have one.</p>
                {photoError && <p className="rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300" role="alert">{photoError}</p>}
                {previewHtml && (
                  <div>
                    <iframe title="Email preview" sandbox="" srcDoc={previewHtml} className="h-[460px] w-full rounded-xl border border-white/10 bg-white" />
                    <button type="button" onClick={() => setPreviewHtml(null)} className="mt-1 text-[11px] text-slate-400 hover:text-white underline">Close preview</button>
                  </div>
                )}
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Email Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => { replyDraft.current = null; setSelectedTemplateId(e.target.value); }}
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                >
                  {BUILTIN_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Built-in)
                    </option>
                  ))}
                  {repTemplates().map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  {customTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.template_name} (Custom)
                    </option>
                  ))}
                </select>
              </div>

              {/* Write with AI: drafts from this contact's verified research. The rep reads and edits before sending. */}
              <div className="rounded-xl border border-purple/30 bg-purple/5 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" disabled={aiBusy} onClick={() => void handleWriteWithAI()} className="rounded-xl bg-purple px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition">
                    {aiBusy ? "Writing from the research…" : outreachStage === "follow_up" ? "Write follow-up with AI" : "Write first email with AI"}
                  </button>
                  <span className="text-[11px] text-slate-400">Uses only verified facts about this company from your Lead Pool. You can edit everything before sending.</span>
                </div>
                {aiResult?.error && <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300" role="alert">{aiResult.error}</p>}
                {aiResult && !aiResult.error && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    {aiResult.general ? (
                      <p className="text-amber-300">No verified facts about this company yet, so the AI wrote a general note and claimed nothing about them.</p>
                    ) : (
                      <div className="text-emerald-300">
                        Based on:
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-300">
                          {(aiResult.usedFacts ?? []).map((f) => (
                            <li key={f.n}>{f.claim} <a className="text-purple-300 underline" href={f.sourceUrl} target="_blank" rel="noopener noreferrer">source</a></li>
                          ))}
                          {(aiResult.usedFacts ?? []).length === 0 && <li>No specific fact was used.</li>}
                        </ul>
                      </div>
                    )}
                    {aiResult.blocked && <p className="text-amber-300">Note: you can&apos;t send this yet ({aiResult.blocked.replace(/_/g, " ")}). Fix that first, then send.</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Prospect Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="prospect@company.com"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-3 text-xs text-slate-200 outline-none focus:border-purple leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <span className="text-[11px] text-slate-500">
                  Automatically appends your signature and technical discovery booking link.
                </span>
                <button
                  type="submit"
                  disabled={sendingOutreach}
                  className="flex items-center gap-1.5 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-purple/20 transition disabled:opacity-50"
                >
                  {sendingOutreach ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send Cold Email</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 5: PITCH DECK & ONBOARDING GUIDE */}
        {/* ===================================================================== */}
        {activeTab === "onboarding" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-purple/30 bg-gradient-to-r from-purple/20 via-[#131B2E] to-[#131B2E] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-full bg-purple/30 text-purple-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    Partner Success Onboarding
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">Sales Rep Master Guide &amp; Pitch Deck</h2>
                  <p className="text-xs text-slate-400">
                    Review our service architecture, commission milestones, and high-converting objection handlers.
                  </p>
                </div>
                {!profile.onboarding_completed && (
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={togglingOnboarding}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Mark Onboarding Complete
                  </button>
                )}
              </div>
            </div>

            {/* 3 Core Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/20 text-purple-400 font-bold text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-white">Ideal Customer Profile (ICP)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Target SaaS founders, e-commerce brands, real estate firms, and growing agencies looking for custom software systems, Next.js web applications, or CRM automations.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-white">Discovery Call Goal</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Do not sell code on the email. Sell the <strong>15-minute technical roadmap call</strong> with our lead solutions architect. When they book through your link, it is credited to you.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-white">Commission Milestones</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Earn qualified meeting bonuses for each held call, plus 10%–20% deal closing commissions on executed software contracts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 6: EARNINGS & PAYOUT SETTINGS */}
        {/* ===================================================================== */}
        {activeTab === "payouts" && (
          <div className="max-w-2xl space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-base font-bold text-white">Earnings &amp; Payout Settings</h2>
              <p className="text-xs text-slate-400">Configure your withdrawal details for milestone disbursements.</p>
            </div>

            {payoutSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Payout details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSavePayoutDetails} className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["bkash", "nagad", "bank", "paypal"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayoutMethod(m)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition ${
                        payoutMethod === m
                          ? "bg-purple border-purple text-white shadow-md shadow-purple/20"
                          : "bg-[#0D1322] border-white/[0.08] text-slate-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Account / Phone / IBAN Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 01700000000 or Account No"
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              {payoutMethod === "bank" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. City Bank, HSBC"
                      className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Branch name"
                      className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Withdrawal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={savingPayout}
                  className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
                >
                  {savingPayout ? "Saving Details..." : "Save Payout Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT LEAD */}
      {/* ========================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#131B2E] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingLead ? "Edit Prospect Details" : "Add New Prospect"}
              </h3>
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  resetLeadForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="sarah@brand.com"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={newLeadJobTitle}
                    onChange={(e) => setNewLeadJobTitle(e.target.value)}
                    placeholder="Founder / CTO"
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={newLeadStage}
                    onChange={(e) => setNewLeadStage(e.target.value as any)}
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="meeting_booked">Meeting Booked</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Closed Won</option>
                    {/* Closing a deal as lost needs a reason: use the stage menu in the lead list or board. */}
                    {editingLead?.stage === "lost" && <option value="lost">Closed Lost</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Est. Deal Value ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Notes / Pain Points
                </label>
                <textarea
                  rows={2}
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="Context on current tech stack or budget..."
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLeadModal(false);
                    resetLeadForm();
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
                >
                  {savingLead ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK ENROLL IN DRIP CAMPAIGN */}
      {/* ========================================================================= */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#131B2E] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Enroll in Drip Sequence</h3>
                <p className="text-[11px] text-slate-400">{selectedLeadIds.length} lead(s) selected</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {enrollResult && (
              <div className="p-3 rounded-xl bg-purple/10 border border-purple/30 text-xs text-purple-200">
                {enrollResult}
              </div>
            )}

            {campaigns.length === 0 ? (
              <p className="text-xs text-amber-400">
                No active campaign sequences found. Please create a sequence first.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Sequence
                </label>
                <select
                  value={enrollTargetCampaignId}
                  onChange={(e) => setEnrollTargetCampaignId(e.target.value)}
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.rep_campaign_steps?.length || 0} Steps)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rounded-xl bg-[#0D1322] border border-white/[0.05] p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-white">Automation rules:</p>
              <p>&bull; Step 1 is scheduled immediately for dispatch.</p>
              <p>&bull; Automated follow-ups advance based on cadence delays.</p>
              <p>&bull; If a prospect replies or books a call, all remaining steps auto-cancel.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={enrollingLeads || campaigns.length === 0}
                onClick={handleBulkEnroll}
                className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
              >
                {enrollingLeads ? "Enrolling..." : "Start Cadence"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CAMPAIGN */}
      {/* ========================================================================= */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#131B2E] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Create New Outreach Sequence</h3>
              <button onClick={() => setShowCreateCampaignModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  placeholder="e.g. SaaS Founders 3-Step Tech Pitch"
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Strategy / Target Segment
                </label>
                <textarea
                  rows={2}
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Target criteria, proposition..."
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div className="rounded-xl bg-purple/10 border border-purple/30 p-3 text-[11px] text-purple-200">
                ✨ Auto-provisions the standard 3-step cadence (Day 0 Pitch, Day 3 Value Bump, Day 7 Breakup).
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
                >
                  {creatingCampaign ? "Creating..." : "Create Sequence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CUSTOM TEMPLATE */}
      {/* ========================================================================= */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#131B2E] border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Create Custom Email Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. E-Commerce Automation Pitch"
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="Accelerating digital growth for {{company}}"
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Body Content *
                </label>
                <p className="text-[10px] text-slate-500 mb-1">
                  Merge tags: <code className="text-purple-300">{"{{name}}"}</code>, <code className="text-purple-300">{"{{company}}"}</code>, <code className="text-purple-300">{"{{rep_name}}"}</code>, <code className="text-purple-300">{"{{referral_link}}"}</code>
                </p>
                <textarea
                  required
                  rows={5}
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  className="w-full rounded-xl bg-[#0D1322] border border-white/[0.08] p-2.5 text-xs text-slate-200 outline-none focus:border-purple leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition disabled:opacity-50"
                >
                  {savingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
