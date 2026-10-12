import type { Db } from "@/lib/acquisition/db";

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { code?: string; message: string } | null };

/** A tiny in-memory stand-in for the Supabase query builder: enough for the filters the automations use. */
export function fakeDb(seed: Record<string, Row[]> = {}, opts: { unique?: Record<string, string>; rpc?: Record<string, (args: Record<string, unknown>) => unknown> } = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  let id = 0;

  class Q implements PromiseLike<Result> {
    private filters: ((r: Row) => boolean)[] = [];
    private op: "select" | "insert" | "update" | "upsert" = "select";
    private payload: Row = {};
    private n = Infinity;
    private sortBy: { k: string; asc: boolean } | null = null;
    constructor(private readonly name: string) {
      tables[name] ??= [];
    }
    select() { return this; }
    insert(p: Row) { this.op = "insert"; this.payload = p; return this; }
    update(p: Row) { this.op = "update"; this.payload = p; return this; }
    upsert(p: Row) { this.op = "upsert"; this.payload = p; return this; }
    eq(k: string, v: unknown) { this.filters.push((r) => r[k] === v); return this; }
    neq(k: string, v: unknown) { this.filters.push((r) => r[k] !== v); return this; }
    is(k: string, v: unknown) { this.filters.push((r) => (v === null ? r[k] == null : r[k] === v)); return this; }
    in(k: string, v: unknown[]) { this.filters.push((r) => v.includes(r[k])); return this; }
    not(k: string, _op: string, v: unknown) { this.filters.push((r) => (v === null ? r[k] != null : r[k] !== v)); return this; }
    gte(k: string, v: string) { this.filters.push((r) => String(r[k]) >= v); return this; }
    lte(k: string, v: string) { this.filters.push((r) => String(r[k]) <= v); return this; }
    order(k: string, o?: { ascending?: boolean }) { this.sortBy = { k, asc: o?.ascending !== false }; return this; }
    limit(n: number) { this.n = n; return this; }
    private rows() {
      let rows = tables[this.name].filter((r) => this.filters.every((f) => f(r)));
      const s = this.sortBy;
      if (s) rows = [...rows].sort((a, b) => (String(a[s.k]) < String(b[s.k]) ? -1 : 1) * (s.asc ? 1 : -1));
      return rows.slice(0, this.n);
    }
    private run(): Result {
      const t = tables[this.name];
      if (this.op === "insert") {
        const uk = opts.unique?.[this.name];
        if (uk && this.payload[uk] != null && t.some((r) => r[uk] === this.payload[uk])) return { data: null, error: { code: "23505", message: "duplicate key" } };
        const row = { id: `id${++id}`, ...this.payload };
        t.push(row);
        return { data: row, error: null };
      }
      if (this.op === "upsert") {
        const key = this.payload.key !== undefined ? "key" : "id";
        const ex = t.find((r) => r[key] === this.payload[key]);
        if (ex) Object.assign(ex, this.payload);
        else t.push({ ...this.payload });
        return { data: null, error: null };
      }
      const rows = this.rows();
      if (this.op === "update") for (const r of rows) Object.assign(r, this.payload);
      return { data: rows, error: null };
    }
    maybeSingle() {
      const r = this.run();
      return Promise.resolve({ data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error });
    }
    single() { return this.maybeSingle(); }
    then<A, B>(ok?: (v: Result) => A | PromiseLike<A>, bad?: (e: unknown) => B | PromiseLike<B>) { return Promise.resolve(this.run()).then(ok, bad); }
  }

  const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
  const db = {
    from: (name: string) => new Q(name),
    rpc: async (name: string, args: Record<string, unknown> = {}) => {
      rpcCalls.push({ name, args });
      const fn = opts.rpc?.[name];
      return fn ? { data: fn(args), error: null } : { data: null, error: { message: `unexpected rpc ${name}` } };
    },
  };
  return { db: db as unknown as Db, tables, rpcCalls };
}
