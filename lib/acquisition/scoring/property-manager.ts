/**
 * Evidence-weighted fit score for property-management businesses.
 * Weights are initial hypotheses from the blueprint, not validated predictors.
 * Only signals whose evidence was verified against the fetched source count.
 */

export const SIGNAL_WEIGHTS = {
  identity: 25, // clearly a property management business
  portfolio: 20, // relevant size / portfolio evidence
  opportunity: 20, // verifiable workflow or technology opportunity
  technology: 15, // evidence of investment in business technology
  decision_maker: 10, // identifiable, relevant decision-maker
} as const;
export const SOURCE_WEIGHT = 10; // source quality and recency

export type SignalCategory = keyof typeof SIGNAL_WEIGHTS;
export const SIGNAL_CATEGORIES = Object.keys(SIGNAL_WEIGHTS) as SignalCategory[];

export type FitBand = "prioritize_review" | "gather_evidence" | "deprioritize";

export interface ScoredSignal {
  category: SignalCategory;
  /** 0..1 — how strongly the verified evidence supports this category. */
  strength: number;
  sourceUrl: string;
}

export interface ScoreResult {
  score: number;
  band: FitBand;
  breakdown: Record<SignalCategory | "source", number>;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function bandFor(score: number): FitBand {
  if (score >= 70) return "prioritize_review";
  if (score >= 50) return "gather_evidence";
  return "deprioritize";
}

export function scoreLead(signals: ScoredSignal[]): ScoreResult {
  const breakdown = { identity: 0, portfolio: 0, opportunity: 0, technology: 0, decision_maker: 0, source: 0 };
  for (const cat of SIGNAL_CATEGORIES) {
    const best = Math.max(0, ...signals.filter((s) => s.category === cat).map((s) => clamp01(s.strength)));
    breakdown[cat] = best * SIGNAL_WEIGHTS[cat];
  }
  // Source quality: corroboration from up to 3 distinct pages earns the full weight.
  const distinctSources = new Set(signals.map((s) => s.sourceUrl)).size;
  breakdown.source = Math.min(1, distinctSources / 3) * SOURCE_WEIGHT;

  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, band: bandFor(score), breakdown };
}
