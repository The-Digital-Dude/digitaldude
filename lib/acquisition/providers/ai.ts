/**
 * Provider-independent AI adapter. Speaks the OpenAI-compatible chat-completions
 * protocol, which most hosted and free-tier providers (and local servers) expose.
 * Configure with AI_BASE_URL, AI_API_KEY, AI_MODEL. If unset, `getAiProvider()`
 * returns null and every caller must fall back to the manual workflow — core CRM
 * operations never depend on the model.
 */

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  /** Returns the model's raw text, requested as a single JSON object. */
  completeJson(args: { system: string; user: string }): Promise<string>;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured (set AI_BASE_URL, AI_API_KEY and AI_MODEL) — use the manual research workflow");
    this.name = "AiNotConfiguredError";
  }
}

/** The provider answered with an HTTP error. `detail` is the provider's own message (never contains our key). */
export class AiHttpError extends Error {
  constructor(readonly status: number, readonly detail: string) {
    super(`AI provider returned HTTP ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "AiHttpError";
  }
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = "openai-compatible";
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    readonly model: string,
    private readonly timeoutMs = 45_000
  ) {}

  async completeJson({ system, user }: { system: string; user: string }): Promise<string> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      redirect: "error", // never follow a redirect with the API key attached
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      type ErrBody = { error?: { message?: string } | string; message?: string };
      const raw = (await res.json().catch(() => null)) as ErrBody | ErrBody[] | null;
      const first = Array.isArray(raw) ? raw[0] : raw;
      const msg = typeof first?.error === "string" ? first.error : first?.error?.message ?? first?.message ?? "";
      throw new AiHttpError(res.status, String(msg).slice(0, 200));
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("AI provider returned an empty response");
    return text;
  }
}

/** Environment-only provider. Prefer resolveAiProvider(db), which also honours the key saved in settings. */
export function getAiProvider(): AiProvider | null {
  const base = process.env.AI_BASE_URL;
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!base || !key || !model) return null;
  return new OpenAiCompatibleProvider(base, key, model);
}

/** Parses model output that may be wrapped in ```json fences or prose. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Model output was not valid JSON");
  }
}
