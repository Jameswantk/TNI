import { buildPricingBands } from "../bander.js";
import type { RawQuote } from "../types.js";

export function runUnitChecks(): void {
  rejectsNonAnnualQuotes();
  usesObservedCoverageForBandKey();
}

function rejectsNonAnnualQuotes(): void {
  const quote = baseQuote({
    premiumThb: 1000,
    premiumBasis: "monthly",
    coverageType: "type_1",
    parseOk: true,
  });
  const bands = buildPricingBands([quote]);
  assert(bands.length === 0, "monthly quote should not produce a band");
}

function usesObservedCoverageForBandKey(): void {
  const quote = baseQuote({
    premiumThb: 12000,
    premiumBasis: "annual",
    coverageType: "type_3_plus",
    requestedCoverageType: "type_1",
    parseOk: true,
  });
  const [band] = buildPricingBands([quote]);
  assert(Boolean(band), "annual observed quote should produce a band");
  assert(band.coverageType === "type_3_plus", "band should use observed coverage type");
  assert(band.bandKey.includes("type_3_plus"), "band key should include observed coverage type");
  assert(!band.bandKey.includes("type_1"), "band key should not include requested coverage type when observed differs");
}

function baseQuote(overrides: Partial<RawQuote>): RawQuote {
  return {
    id: "test_quote",
    runId: "test_run",
    site: "unit",
    sourceMethod: "public_quote_flow",
    scrapedAt: new Date().toISOString(),
    input: {
      vehicleGroup: "toyota_vios",
      yearBand: "2020_2024",
      provinceRegion: "bangkok",
      requestedCoverageType: "type_1",
      driverAgeBand: "25_35",
      repairPref: "garage",
      defaultsUsed: {},
    },
    premiumThb: null,
    premiumBasis: "unknown",
    rawPayload: {},
    parseOk: false,
    ...overrides,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
