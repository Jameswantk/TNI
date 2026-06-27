import type { PricingBand } from "../types.js";

export interface IncrementalPlanItem {
  bandKey: string;
  reason: string;
  lastScrapedAt: string;
  confidence: PricingBand["confidence"];
}

export function planIncrementalRefresh(bands: PricingBand[], limit: number): IncrementalPlanItem[] {
  return [...bands]
    .sort((a, b) => scoreBand(b) - scoreBand(a) || a.lastScrapedAt.localeCompare(b.lastScrapedAt))
    .slice(0, limit)
    .map((band) => ({
      bandKey: band.bandKey,
      reason: refreshReason(band),
      lastScrapedAt: band.lastScrapedAt,
      confidence: band.confidence,
    }));
}

function scoreBand(band: PricingBand): number {
  let score = 0;
  if (band.stale) score += 100;
  if (band.confidence === "low") score += 50;
  if (band.confidence === "medium") score += 20;
  score += Math.max(0, 30 - ageDays(band.lastScrapedAt));
  return score;
}

function refreshReason(band: PricingBand): string {
  if (band.stale) return "stale";
  if (band.confidence === "low") return "low confidence";
  if (band.confidence === "medium") return "medium confidence";
  return "oldest high-confidence band";
}

function ageDays(isoDate: string): number {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return 9999;
  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}
