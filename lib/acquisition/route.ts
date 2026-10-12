import { getDb, type Db } from "./db";
import { errorResponse, guardAdmin } from "./http";

/** Wraps an admin-only route handler: auth + CSRF guard, DB client, uniform error mapping. */
export function adminRoute<P extends Record<string, string> = Record<string, never>>(
  what: string,
  fn: (request: Request, ctx: { params: P; db: Db }) => Promise<Response>
) {
  return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
    const denied = await guardAdmin(request);
    if (denied) return denied;
    try {
      return await fn(request, { params: await context.params, db: getDb() });
    } catch (e) {
      return errorResponse(e, what);
    }
  };
}
