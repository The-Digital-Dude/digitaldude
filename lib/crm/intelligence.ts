/**
 * Lead Research Intelligence utilities:
 * Formats, parses, and generates executive pitches from competitive tech stack audits,
 * pain points, and proposed solutions.
 */

export interface LeadIntelligence {
  website?: string;
  linkedinUrl?: string;
  location?: string;
  industry?: string;
  techStack: string[];
  painPoints?: string;
  solution?: string;
  qcBy?: string;
  priority?: string;
  fitScore?: number;
  generalNotes?: string;
  hasIntelligence: boolean;
}

const SECTION_HEADERS = {
  header: "--- LEAD RESEARCH INTELLIGENCE ---",
  painPoints: "[PAIN POINTS / TRIGGERS]",
  solution: "[PROPOSED SOLUTION]",
  notes: "[NOTES]",
};

/** Formats extracted CSV intelligence fields into a clean, delimited note string. */
export function formatLeadIntelligenceNotes(fields: {
  website?: string | null;
  linkedinUrl?: string | null;
  location?: string | null;
  industry?: string | null;
  techStack?: string | null;
  painPoints?: string | null;
  solution?: string | null;
  qcBy?: string | null;
  priority?: string | null;
  fitScore?: number | string | null;
  notes?: string | null;
}): string {
  const parts: string[] = [];
  const meta: string[] = [];

  if (fields.website?.trim()) meta.push(`Website: ${fields.website.trim()}`);
  if (fields.linkedinUrl?.trim()) meta.push(`LinkedIn: ${fields.linkedinUrl.trim()}`);
  if (fields.location?.trim()) meta.push(`Location: ${fields.location.trim()}`);
  if (fields.industry?.trim()) meta.push(`Industry: ${fields.industry.trim()}`);
  if (fields.techStack?.trim()) meta.push(`Tech Stack: ${fields.techStack.trim()}`);
  if (fields.qcBy?.trim()) meta.push(`QC By: ${fields.qcBy.trim()}`);
  if (fields.priority?.trim()) meta.push(`Priority: ${fields.priority.trim()}`);
  if (fields.fitScore != null && String(fields.fitScore).trim()) meta.push(`Research Fit Score: ${String(fields.fitScore).trim()}/100`);

  const hasIntel = meta.length > 0 || Boolean(fields.painPoints?.trim()) || Boolean(fields.solution?.trim());

  if (hasIntel) {
    parts.push(SECTION_HEADERS.header);
    if (meta.length > 0) parts.push(meta.join("\n"));
    if (fields.painPoints?.trim()) {
      parts.push(`${SECTION_HEADERS.painPoints}\n${fields.painPoints.trim()}`);
    }
    if (fields.solution?.trim()) {
      parts.push(`${SECTION_HEADERS.solution}\n${fields.solution.trim()}`);
    }
  }

  if (fields.notes?.trim()) {
    if (hasIntel) {
      parts.push(`${SECTION_HEADERS.notes}\n${fields.notes.trim()}`);
    } else {
      parts.push(fields.notes.trim());
    }
  }

  return parts.join("\n\n").trim();
}

/** Parses notes into a structured LeadIntelligence object. */
export function parseLeadIntelligence(notesText: string | null | undefined): LeadIntelligence {
  if (!notesText || typeof notesText !== "string" || !notesText.trim()) {
    return { techStack: [], hasIntelligence: false };
  }

  const text = notesText.trim();
  const isStructured = text.includes(SECTION_HEADERS.header);

  let website: string | undefined;
  let linkedinUrl: string | undefined;
  let location: string | undefined;
  let industry: string | undefined;
  const techStack: string[] = [];
  let painPoints: string | undefined;
  let solution: string | undefined;
  let qcBy: string | undefined;
  let priority: string | undefined;
  let fitScore: number | undefined;
  let generalNotes: string | undefined;

  if (isStructured) {
    // Extract metadata lines
    const websiteMatch = text.match(/Website:\s*([^\r\n]+)/i);
    if (websiteMatch) website = websiteMatch[1].trim();

    const linkedinMatch = text.match(/LinkedIn:\s*([^\r\n]+)/i);
    if (linkedinMatch) linkedinUrl = linkedinMatch[1].trim();

    const locationMatch = text.match(/Location:\s*([^\r\n]+)/i);
    if (locationMatch) location = locationMatch[1].trim();

    const industryMatch = text.match(/Industry:\s*([^\r\n]+)/i);
    if (industryMatch) industry = industryMatch[1].trim();

    const qcMatch = text.match(/QC By:\s*([^\r\n]+)/i);
    if (qcMatch) qcBy = qcMatch[1].trim();

    const prioMatch = text.match(/Priority:\s*([^\r\n]+)/i);
    if (prioMatch) priority = prioMatch[1].trim();

    const fitMatch = text.match(/Research Fit Score:\s*(\d+)/i);
    if (fitMatch) fitScore = parseInt(fitMatch[1], 10);

    const techMatch = text.match(/Tech Stack:\s*([^\r\n]+)/i);
    if (techMatch) {
      techMatch[1]
        .split(/[,|;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((t) => techStack.push(t));
    }

    // Extract block sections
    const painIdx = text.indexOf(SECTION_HEADERS.painPoints);
    const solIdx = text.indexOf(SECTION_HEADERS.solution);
    const notesIdx = text.indexOf(SECTION_HEADERS.notes);

    if (painIdx !== -1) {
      const start = painIdx + SECTION_HEADERS.painPoints.length;
      const end = solIdx !== -1 && solIdx > painIdx ? solIdx : notesIdx !== -1 && notesIdx > painIdx ? notesIdx : text.length;
      painPoints = text.slice(start, end).trim();
    }

    if (solIdx !== -1) {
      const start = solIdx + SECTION_HEADERS.solution.length;
      const end = notesIdx !== -1 && notesIdx > solIdx ? notesIdx : text.length;
      solution = text.slice(start, end).trim();
    }

    if (notesIdx !== -1) {
      generalNotes = text.slice(notesIdx + SECTION_HEADERS.notes.length).trim();
    }
  } else {
    // Unstructured note fallback
    generalNotes = text;
  }

  const hasIntelligence = Boolean(
    website || linkedinUrl || techStack.length > 0 || painPoints || solution || qcBy
  );

  return {
    website,
    linkedinUrl,
    location,
    industry,
    techStack,
    painPoints,
    solution,
    qcBy,
    priority,
    fitScore,
    generalNotes,
    hasIntelligence,
  };
}

/** New CRM leads need enough research to support a useful, honest pitch. */
export function hasRequiredLeadIntelligence(notesText: string | null | undefined): boolean {
  const intelligence = parseLeadIntelligence(notesText);
  return Boolean(intelligence.painPoints?.trim() && intelligence.solution?.trim());
}

/** Generates an executive, problem-solving outreach email pitch based on the lead's research. */
export function generateExecutivePitch(params: {
  fullName: string;
  companyName?: string | null;
  jobTitle?: string | null;
  intel: LeadIntelligence;
  repName?: string | null;
}): { subject: string; body: string } {
  const firstName = params.fullName.trim().split(/\s+/)[0] || "there";
  const company = params.companyName?.trim() || "your company";
  const tech = params.intel.techStack.slice(0, 3).join(", ");
  const rep = params.repName?.trim() || "The Digital Dude Team";

  const subject = tech
    ? `Streamlining ${company}'s tech stack & operations`
    : `Bespoke digital architecture & workflow automation for ${company}`;

  let body = `Hi ${firstName},\n\n`;

  if (tech) {
    body += `I noticed ${company} is currently running on ${tech}. In our experience working with growing teams in your space, relying on third-party subscriptions and generic CMS setups often creates operational bottlenecks and escalating recurring costs.\n\n`;
  } else {
    body += `I came across ${company} and wanted to reach out regarding your current digital platforms and operational workflows.\n\n`;
  }

  if (params.intel.painPoints) {
    const firstPain = params.intel.painPoints.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").trim();
    if (firstPain) {
      body += `Specifically around ${firstPain.toLowerCase()}—we help partners eliminate this friction.\n\n`;
    }
  }

  if (params.intel.solution) {
    const firstSol = params.intel.solution.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").trim();
    if (firstSol) {
      body += `Our team can ${firstSol.charAt(0).toLowerCase() + firstSol.slice(1)}, delivering a modern, scalable web platform that you own with zero vendor lock-in.\n\n`;
    }
  }

  body += `Would you be open to a brief 10-minute discovery call next Tuesday or Thursday to explore if this could deliver high ROI for ${company}?\n\nBest regards,\n${rep}\nThe Digital Dude`;

  return { subject, body };
}

/** Generates a concise message for direct outreach (e.g. LinkedIn or WhatsApp). */
export function generateDirectMessagePitch(params: {
  fullName: string;
  companyName?: string | null;
  intel: LeadIntelligence;
}): string {
  const firstName = params.fullName.trim().split(/\s+/)[0] || "there";
  const company = params.companyName?.trim() || "your team";
  const tech = params.intel.techStack.slice(0, 2).join(" & ");

  let msg = `Hi ${firstName}, loved following ${company}'s work! `;
  if (tech) {
    msg += `I was looking at your stack (${tech}) and had a few actionable ideas on how to replace costly third-party subscriptions with an automated booking and client portal you own. `;
  } else {
    msg += `Had a few quick ideas on streamlining client bookings and reducing operational software overhead for ${company}. `;
  }
  msg += `Would love to share a 2-minute overview if you're open to connecting!`;
  return msg;
}
