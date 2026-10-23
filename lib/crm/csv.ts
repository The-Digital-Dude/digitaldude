import { CURRENCIES, STAGES, leadPatchSchema, currencyFor } from "./model";
import { formatLeadIntelligenceNotes } from "./intelligence";

/** RFC 4180 CSV reading (quoted commas, doubled quotes, line breaks inside quotes, a byte-order mark) and the lead import planner. */

export function parseCsvText(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export const IMPORT_FIELDS = ["full_name", "email", "phone", "company_name", "job_title", "country", "tags", "lead_source", "estimated_deal_value", "notes", "stage"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

const ALIASES: Record<ImportField, string[]> = {
  full_name: ["fullname", "name", "contactname", "contact", "leadname", "person"],
  email: ["email", "emailaddress", "mail", "workemail"],
  phone: ["phone", "phonenumber", "mobile", "telephone", "tel"],
  company_name: ["company", "companyname", "organisation", "organization", "business", "account"],
  job_title: ["jobtitle", "title", "role", "position", "decisionmakertitle", "decisionmaker", "leadtitle"],
  country: ["country", "countrycode"],
  tags: ["tags", "tag", "labels"],
  lead_source: ["leadsource", "source"],
  estimated_deal_value: ["dealvalue", "estimateddealvalue", "value", "amount", "estimateddealsizeusd", "estimateddealsize", "dealsize", "dealsizeusd"],
  notes: ["notes", "note", "comments", "comment"],
  stage: ["stage", "pipelinestage"],
};

export const INTEL_FIELDS = [
  "website",
  "linkedin_url",
  "tech_stack",
  "pain_points",
  "solution",
  "city",
  "industry",
  "sub_industry",
  "qc_by",
  "priority",
  "fit_score",
] as const;
export type IntelField = (typeof INTEL_FIELDS)[number];

const INTEL_ALIASES: Record<IntelField, string[]> = {
  website: ["website", "companywebsite", "domain", "url", "web"],
  linkedin_url: ["linkedinurl", "linkedin", "profileurl", "linkedinlink"],
  tech_stack: ["techstackknown", "techstack", "technologies", "technology", "tech"],
  pain_points: ["painpointstrigger", "painpoints", "painpoint", "triggers", "trigger", "bottlenecks"],
  solution: ["solution", "solutions", "proposedsolution", "offering", "pitch", "recommendedpitch"],
  city: ["city", "town", "metro"],
  industry: ["industry", "sector"],
  sub_industry: ["subindustry", "subsector", "niche"],
  qc_by: ["qcby", "qc", "auditedby", "researcher", "auditor"],
  priority: ["priorityhighmedlow", "priority", "leadpriority"],
  fit_score: ["fitscore0100", "fitscore", "researchfitscore", "score"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Which column holds which field. `first_name` + `last_name` are joined into the full name. Supports optional custom header mappings. */
export function mapHeaders(
  headers: string[],
  customMapping?: Record<string, string>
): {
  fields: Partial<Record<ImportField, number>>;
  intel: Partial<Record<IntelField, number>>;
  first?: number;
  last?: number;
  unmapped: string[];
} {
  const fields: Partial<Record<ImportField, number>> = {};
  const intel: Partial<Record<IntelField, number>> = {};
  let first: number | undefined;
  let last: number | undefined;
  const used = new Set<number>();

  if (customMapping && Object.keys(customMapping).length > 0) {
    headers.forEach((h, i) => {
      const target = customMapping[h] || customMapping[norm(h)];
      if (!target) return;
      if (target === "ignore") { used.add(i); return; }
      if (target === "first_name") { first = i; used.add(i); return; }
      if (target === "last_name") { last = i; used.add(i); return; }
      if ((IMPORT_FIELDS as readonly string[]).includes(target)) {
        fields[target as ImportField] = i;
        used.add(i);
        return;
      }
      if ((INTEL_FIELDS as readonly string[]).includes(target)) {
        intel[target as IntelField] = i;
        used.add(i);
        return;
      }
    });
  }

  headers.forEach((h, i) => {
    if (used.has(i)) return;
    const n = norm(h);
    if ((n === "firstname" || n === "givenname") && first === undefined) { first = i; used.add(i); return; }
    if ((n === "lastname" || n === "surname" || n === "familyname") && last === undefined) { last = i; used.add(i); return; }
    for (const f of IMPORT_FIELDS) {
      if (fields[f] === undefined && ALIASES[f].includes(n)) { fields[f] = i; used.add(i); return; }
    }
    for (const inf of INTEL_FIELDS) {
      if (intel[inf] === undefined && INTEL_ALIASES[inf].includes(n)) { intel[inf] = i; used.add(i); return; }
    }
  });
  return { fields, intel, first, last, unmapped: headers.filter((_, i) => !used.has(i) && headers[i].trim() !== "") };
}

/** Automatically suggests a field mapping dictionary for a given list of CSV headers. */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const m = mapHeaders(headers);
  if (m.fields.email !== undefined) mapping[headers[m.fields.email]] = "email";
  if (m.fields.full_name !== undefined) mapping[headers[m.fields.full_name]] = "full_name";
  if (m.first !== undefined) mapping[headers[m.first]] = "first_name";
  if (m.last !== undefined) mapping[headers[m.last]] = "last_name";
  for (const f of IMPORT_FIELDS) {
    if (m.fields[f] !== undefined && mapping[headers[m.fields[f]!]] === undefined) {
      mapping[headers[m.fields[f]!]] = f;
    }
  }
  for (const inf of INTEL_FIELDS) {
    if (m.intel[inf] !== undefined && mapping[headers[m.intel[inf]!]] === undefined) {
      mapping[headers[m.intel[inf]!]] = inf;
    }
  }
  for (const h of headers) {
    if (!mapping[h]) {
      mapping[h] = "ignore";
    }
  }
  return mapping;
}

export interface PlannedRow {
  line: number;
  ok: boolean;
  reason?: string;
  email?: string;
  lead?: Record<string, unknown>;
}

export const MAX_IMPORT_ROWS = 300;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates every row of a CSV without touching the database. Duplicates inside the file are caught here; the rest is checked against saved leads by the caller. */
export function planImport(
  rows: string[][],
  defaults: { currency?: string } = {},
  customMapping?: Record<string, string>
): { rows: PlannedRow[]; error?: string; unmapped: string[] } {
  if (rows.length < 2) return { rows: [], error: "The file needs a header row and at least one lead.", unmapped: [] };
  const map = mapHeaders(rows[0], customMapping);
  if (map.fields.email === undefined) return { rows: [], error: "No email column found. Add a column called Email.", unmapped: map.unmapped };
  if (map.fields.full_name === undefined && map.first === undefined && map.last === undefined) return { rows: [], error: "No name column found. Add a column called Name (or First name and Last name).", unmapped: map.unmapped };
  const data = rows.slice(1);
  if (data.length > MAX_IMPORT_ROWS) return { rows: [], error: `Import up to ${MAX_IMPORT_ROWS} leads at a time (this file has ${data.length}).`, unmapped: map.unmapped };

  const seen = new Set<string>();
  const get = (r: string[], i: number | undefined) => (i === undefined ? "" : (r[i] ?? "").trim());
  const out: PlannedRow[] = data.map((r, idx) => {
    const line = idx + 2;
    const email = get(r, map.fields.email).toLowerCase();
    const name = map.fields.full_name !== undefined ? get(r, map.fields.full_name) : [get(r, map.first), get(r, map.last)].filter(Boolean).join(" ");
    if (!email) return { line, ok: false, reason: "No email address" };
    if (!EMAIL_SHAPE.test(email)) return { line, ok: false, email, reason: "That is not an email address" };
    if (!name) return { line, ok: false, email, reason: "No name" };
    if (seen.has(email)) return { line, ok: false, email, reason: "Appears twice in this file" };
    seen.add(email);

    const country = get(r, map.fields.country).toUpperCase();
    const stage = get(r, map.fields.stage).toLowerCase().replace(/[\s-]+/g, "_");
    const rawTags = get(r, map.fields.tags).split(/[;|,]/).map((t) => t.trim()).filter(Boolean);
    const tags = [...new Set(
      rawTags
        .map((t) =>
          t
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9 _-]/g, "")
            .trim()
            .slice(0, 30)
        )
        .filter((t) => t.length > 0 && /^[a-z0-9]/.test(t))
    )].slice(0, 12);
    const value = get(r, map.fields.estimated_deal_value).replace(/[^0-9.]/g, "");

    const rawNotes = get(r, map.fields.notes);
    const website = get(r, map.intel?.website);
    const linkedinUrl = get(r, map.intel?.linkedin_url);
    const techStack = get(r, map.intel?.tech_stack);
    const painPoints = get(r, map.intel?.pain_points);
    const solution = get(r, map.intel?.solution);
    const city = get(r, map.intel?.city);
    const industry = get(r, map.intel?.industry);
    const subIndustry = get(r, map.intel?.sub_industry);
    const qcBy = get(r, map.intel?.qc_by);
    const priority = get(r, map.intel?.priority);
    const fitScoreRaw = get(r, map.intel?.fit_score).replace(/[^0-9]/g, "");
    const fitScoreNum = fitScoreRaw ? Math.min(100, Math.max(0, parseInt(fitScoreRaw, 10))) : undefined;

    const notes = formatLeadIntelligenceNotes({
      website,
      linkedinUrl,
      location: city ? (country ? `${city}, ${country}` : city) : undefined,
      industry: subIndustry ? `${industry} (${subIndustry})` : industry,
      techStack,
      painPoints,
      solution,
      qcBy,
      priority,
      fitScore: fitScoreNum,
      notes: rawNotes,
    }) || null;

    const candidate: Record<string, unknown> = {
      full_name: name.slice(0, 200),
      email,
      phone: get(r, map.fields.phone) || null,
      company_name: get(r, map.fields.company_name) || null,
      job_title: get(r, map.fields.job_title) || null,
      notes,
      lead_source: get(r, map.fields.lead_source) || "CSV import",
      tags,
      ...(country ? { country } : {}),
      ...(value ? { estimated_deal_value: Number(value) } : {}),
      // "Lost" needs a reason, so an imported lead can only start in the open stages or as won.
      ...(stage && (STAGES as readonly string[]).includes(stage) && stage !== "lost" ? { stage } : {}),
    };
    const parsed = leadPatchSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { line, ok: false, email, reason: `${issue.path.join(".") || "row"}: ${issue.message}` };
    }
    const lead: Record<string, unknown> = { ...parsed.data };
    if (fitScoreNum !== undefined) lead.fit_score = fitScoreNum;
    lead.currency = defaults.currency && (CURRENCIES as readonly string[]).includes(defaults.currency) && !parsed.data.country ? defaults.currency : currencyFor(parsed.data.country, defaults.currency);
    return { line, ok: true, email, lead };
  });
  return { rows: out, unmapped: map.unmapped };
}

/** One CSV cell. A leading = + - @ would be run as a formula by a spreadsheet, so it is prefixed to stay text. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

/** The columns a rep gets back when they export, and the template they can fill in to import. */
export const EXPORT_HEADERS = ["Name", "Email", "Phone", "Company", "Job title", "Country", "Stage", "Status", "Deal value", "Currency", "Expected close", "Probability", "Tags", "Fit score", "Engagement score", "Last activity", "Created"];
export const IMPORT_TEMPLATE = "Name,Email,Phone,Company,Job title,Country,Tags,Source,Deal value,Notes\nJane Smith,jane@example.com,,Example Pty Ltd,Managing Director,AU,warm;referral,Referral,5000,Met at the expo\n";
