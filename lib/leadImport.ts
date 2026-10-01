// Shared parsing + mapping helpers for importing candidates from an
// external CSV or Facebook Lead Ads "Excel" export into job_applications.

export interface ParsedSheet {
  headers: string[];
  rows: string[][];
}

export type MappingTarget =
  | "applicant_name"
  | "applicant_email"
  | "applicant_phone"
  | "created_at"
  | "screening"
  | "metadata"
  | "ignore";

const KNOWN_FIELD_MAP: Record<string, MappingTarget> = {
  full_name: "applicant_name",
  name: "applicant_name",
  email: "applicant_email",
  phone_number: "applicant_phone",
  phone: "applicant_phone",
  created_time: "created_at",
};

const METADATA_COLUMNS = new Set([
  "id",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "form_name",
  "is_organic",
  "platform",
  "inbox_url",
]);

export function suggestFieldMapping(headers: string[]): Record<string, MappingTarget> {
  const mapping: Record<string, MappingTarget> = {};
  for (const header of headers) {
    const key = header.trim().toLowerCase();
    if (KNOWN_FIELD_MAP[key]) {
      mapping[header] = KNOWN_FIELD_MAP[key];
    } else if (METADATA_COLUMNS.has(key)) {
      mapping[header] = "metadata";
    } else if (key.includes("?") || key.length > 0) {
      // Custom lead-form questions (e.g. Facebook screening questions) are
      // free-text and form-specific, so they default to "screening" rather
      // than being silently dropped.
      mapping[header] = "screening";
    } else {
      mapping[header] = "ignore";
    }
  }
  return mapping;
}

// Minimal quoted-field-aware CSV parser. Facebook/standard CSV exports don't
// need a full RFC-4180 implementation (no embedded newlines inside quoted
// Facebook lead fields in practice), but this still handles quoted commas.
export function parseCsv(text: string): ParsedSheet {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.length > 0);
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => parseLine(line));
  return { headers, rows };
}

export function isFacebookXmlSpreadsheet(text: string): boolean {
  const head = text.slice(0, 2000);
  return head.includes("<?xml") && head.includes("urn:schemas-microsoft-com:office:spreadsheet");
}

// Facebook's "Download" button for Lead Ads exports a SpreadsheetML (XML)
// document with a .xls extension rather than a real binary workbook. Each
// <Row> contains <Cell><Data ...>value</Data></Cell> entries; the first row
// is the header row.
export function parseFacebookXmlSpreadsheet(text: string): ParsedSheet {
  const rowMatches = text.match(/<Row[^>]*>[\s\S]*?<\/Row>/g) || [];
  const parsedRows = rowMatches.map((rowXml) => {
    const dataMatches = rowXml.match(/<Data[^>]*>([\s\S]*?)<\/Data>/g) || [];
    return dataMatches.map((cellXml) => {
      const inner = cellXml.replace(/<Data[^>]*>/, "").replace(/<\/Data>/, "");
      return decodeXmlEntities(inner.trim());
    });
  });

  if (parsedRows.length === 0) return { headers: [], rows: [] };
  const [headers, ...rows] = parsedRows;
  return { headers, rows };
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function detectAndParseSheet(fileName: string, text: string): ParsedSheet {
  if (isFacebookXmlSpreadsheet(text)) {
    return parseFacebookXmlSpreadsheet(text);
  }
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsv(text);
  }
  throw new Error(
    "Unrecognized file format. Only CSV files and Facebook's Lead Ads \"Excel\" export (SpreadsheetML XML, with a .xls extension) are supported. A real binary .xls/.xlsx is not supported — re-export as CSV from Facebook instead."
  );
}
