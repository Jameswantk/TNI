import type { ExtractionMethod, PricingBand, RawQuote } from "./types.js";
import { makeBandKey } from "./utils/normalize.js";

const STALE_AFTER_DAYS = Number(process.env.PRICING_BAND_STALE_AFTER_DAYS ?? "30");

export function buildPricingBands(quotes: RawQuote[], existingBands: PricingBand[] = []): PricingBand[] {
  const manualOverrides = new Map(
    existingBands.filter((band) => band.manualOverride).map((band) => [band.bandKey, band]),
  );

  const groups = new Map<string, RawQuote[]>();

  for (const quote of quotes) {
    if (!isBandableQuote(quote)) continue;
    const key = makeBandKey({
      vehicleGroup: quote.input.vehicleGroup,
      yearBand: quote.input.yearBand,
      provinceRegion: quote.input.provinceRegion,
      coverageType: quote.coverageType,
      driverAgeBand: quote.input.driverAgeBand,
      repairPref: quote.input.repairPref,
    });
    const group = groups.get(key) ?? [];
    group.push(quote);
    groups.set(key, group);
  }

  const generated: PricingBand[] = [];

  for (const [bandKey, group] of groups) {
    if (manualOverrides.has(bandKey)) continue;
    const first = group[0];
    const premiums = group
      .map((quote) => quote.premiumThb)
      .filter((premium): premium is number => premium !== null)
      .sort((a, b) => a - b);
    const trimmed = trimRange(premiums);
    const sourceSites = Array.from(new Set(group.map((quote) => quote.site))).sort();
    const extractionMethods = Array.from(new Set(group.map((quote) => quote.extractionMethod).filter(Boolean))) as ExtractionMethod[];
    const lastScrapedAt = group.map((quote) => quote.scrapedAt).sort().at(-1)!;
    const stale = isStale(lastScrapedAt);
    const confidence = getConfidence({ group, sourceSites, extractionMethods, stale, premiums: trimmed });

    generated.push({
      bandKey,
      vehicleGroup: first.input.vehicleGroup,
      yearBand: first.input.yearBand,
      provinceRegion: first.input.provinceRegion,
      coverageType: first.coverageType!,
      driverAgeBand: first.input.driverAgeBand,
      repairPref: first.input.repairPref,
      premiumMin: Math.round(trimmed[0]),
      premiumMax: Math.round(trimmed[trimmed.length - 1]),
      premiumMedian: Math.round(median(trimmed)),
      sampleCount: group.length,
      sourceSites,
      confidence,
      confidenceReason: confidenceReason({ confidence, group, sourceSites, extractionMethods, stale, premiums: trimmed }),
      stale,
      extractionMethods,
      lastScrapedAt,
      manualOverride: false,
    });
  }

  return [...manualOverrides.values(), ...generated].sort((a, b) => a.bandKey.localeCompare(b.bandKey));
}

export function isBandableQuote(quote: RawQuote): quote is RawQuote & { premiumThb: number; coverageType: NonNullable<RawQuote["coverageType"]> } {
  return quote.parseOk && quote.premiumThb !== null && quote.premiumBasis === "annual" && quote.coverageType !== undefined;
}

function trimRange(values: number[]): number[] {
  if (values.length <= 4) return values;
  const lowerIndex = Math.floor(values.length * 0.1);
  const upperIndex = Math.ceil(values.length * 0.9);
  return values.slice(lowerIndex, Math.max(lowerIndex + 1, upperIndex));
}

function median(values: number[]): number {
  const midpoint = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[midpoint];
  return (values[midpoint - 1] + values[midpoint]) / 2;
}

function getConfidence(args: {
  group: RawQuote[];
  sourceSites: string[];
  extractionMethods: ExtractionMethod[];
  stale: boolean;
  premiums: number[];
}): PricingBand["confidence"] {
  if (args.stale) return "low";
  if (args.extractionMethods.includes("body_text_annual")) return args.group.length >= 3 ? "medium" : "low";
  if (args.sourceSites.length >= 2 && spreadRatio(args.premiums) <= 0.15) return "high";
  if (args.extractionMethods.includes("dom_plan_card") && args.group.length >= 1) return "medium";
  return args.group.length >= 3 ? "medium" : "low";
}

function confidenceReason(args: {
  confidence: PricingBand["confidence"];
  group: RawQuote[];
  sourceSites: string[];
  extractionMethods: ExtractionMethod[];
  stale: boolean;
  premiums: number[];
}): string {
  if (args.stale) return `Low confidence: latest usable sample is older than ${STALE_AFTER_DAYS} day(s).`;
  if (args.sourceSites.length >= 2 && spreadRatio(args.premiums) <= 0.15) {
    return `${capitalize(args.confidence)} confidence from ${args.group.length} annual sample(s), ${args.sourceSites.length} source(s), and tight source spread.`;
  }
  if (args.extractionMethods.includes("dom_plan_card")) {
    return `${capitalize(args.confidence)} confidence from observed annual DOM-scoped premium(s).`;
  }
  if (args.extractionMethods.includes("body_text_annual")) {
    return `${capitalize(args.confidence)} confidence: annual premium found by body-text fallback; review diagnostics before production use.`;
  }
  return `Low confidence: only ${args.group.length} usable annual sample(s). Show wider range or hand off to advisor.`;
}

function isStale(isoDate: string): boolean {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return true;
  return Date.now() - timestamp > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function spreadRatio(values: number[]): number {
  if (values.length <= 1) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const med = median([...values].sort((a, b) => a - b));
  return med === 0 ? 1 : (max - min) / med;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
