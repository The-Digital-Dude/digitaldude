// Shared pagination param parsing for admin list API routes. Keeps the
// page/pageSize -> Supabase .range(from, to) conversion identical everywhere.

export interface PageParams {
  page: number;
  pageSize: number;
  from: number;
  to: number;
}

// PostgREST returns an error (surfaced as HTTP 500 by this app's routes)
// when a requested .range() starts beyond the last matching row — e.g. the
// admin was on page 3 and a new search narrowed the result set to 1 row.
// Routes should detect this and gracefully report an empty page instead of
// failing outright.
export function isRangeNotSatisfiableError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "PGRST103" || /range not satisfiable/i.test(error.message || "");
}

export function parsePageParams(
  searchParams: URLSearchParams,
  opts?: { defaultPageSize?: number; maxPageSize?: number }
): PageParams {
  const defaultPageSize = opts?.defaultPageSize ?? 25;
  const maxPageSize = opts?.maxPageSize ?? 100;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(Math.max(1, Number(searchParams.get("pageSize")) || defaultPageSize), maxPageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}
