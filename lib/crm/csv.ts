import { CURRENCIES, STAGES, leadPatchSchema, currencyFor } from "./model";

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
  job_title: ["jobtitle", "title", "role", "position"],
  country: ["country", "countrycode"],
  tags: ["tags", "tag", "labels"],
  lead_source: ["leadsource", "source"],
  estimated_deal_value: ["dealvalue", "estimateddealvalue", "value", "amount"],
  notes: ["notes", "note", "comments", "comment"],
  stage: ["stage", "pipelinestage"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Which column holds which field. `first_name` + `last_name` are joined into the full name. */
export function mapHeaders(headers: string[]): { fields: Partial<Record<ImportField, number>>; first?: number; last?: number; unmapped: string[] } {
  const fields: Partial<Record<ImportField, number>> = {};
  let first: number | undefined;
  let last: number | undefined;
  const used = new Set<number>();
  headers.forEach((h, i) => {
    const n = norm(h);
    if (n === "firstname" || n === "givenname") { first = i; used.add(i); return; }
    if (n === "lastname" || n === "surname" || n === "familyname") { last = i; used.add(i); return; }
    for (const f of IMPORT_FIELDS) {
      if (fields[f] === undefined && ALIASES[f].includes(n)) { fields[f] = i; used.add(i); return; }
    }
  });
  return { fields, first, last, unmapped: headers.filter((_, i) => !used.has(i) && headers[i].trim() !== "") };
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
export function planImport(rows: string[][], defaults: { currency?: string } = {}): { rows: PlannedRow[]; error?: string; unmapped: string[] } {
  if (rows.length < 2) return { rows: [], error: "The file needs a header row and at least one lead.", unmapped: [] };
  const map = mapHeaders(rows[0]);
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
    const tags = get(r, map.fields.tags).split(/[;|,]/).map((t) => t.trim()).filter(Boolean);
    const value = get(r, map.fields.estimated_deal_value).replace(/[^0-9.]/g, "");
    const candidate: Record<string, unknown> = {
      full_name: name.slice(0, 200),
      email,
      phone: get(r, map.fields.phone) || null,
      company_name: get(r, map.fields.company_name) || null,
      job_title: get(r, map.fields.job_title) || null,
      notes: get(r, map.fields.notes) || null,
      lead_source: get(r, map.fields.lead_source) || "CSV import",
      ...(country ? { country } : {}),
      ...(tags.length ? { tags } : {}),
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
