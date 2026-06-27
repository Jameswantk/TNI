import type { ExtractedPremium } from "./browserQuoteTools.js";
import type { LiveQuoteScenario, RawQuote } from "../types.js";
import { createQuoteId } from "../utils/ids.js";

export function toLiveRawQuotes(args: {
  site: string;
  runId: string;
  scenario: LiveQuoteScenario;
  scrapedAt: string;
  finalUrl: string;
  steps: string[];
  text: string;
  premiums: ExtractedPremium[];
  notes: string;
  diagnosticsPaths?: string[];
}): RawQuote[] {
  if (args.premiums.length === 0) {
    return [
      {
        id: createQuoteId(args.site),
        runId: args.runId,
        site: args.site,
        sourceMethod: "public_quote_flow",
        scrapedAt: args.scrapedAt,
        input: args.scenario.input,
        premiumThb: null,
        premiumBasis: "unknown",
        requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
        rawPayload: {
          finalUrl: args.finalUrl,
          steps: args.steps,
          diagnosticsPaths: args.diagnosticsPaths ?? [],
          requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
          visibleText: args.text.slice(0, 2500),
        },
        parseOk: false,
        notes: args.notes,
      },
    ];
  }

  return args.premiums.map((premium) => ({
    id: createQuoteId(args.site),
    runId: args.runId,
    site: args.site,
    sourceMethod: "public_quote_flow",
    scrapedAt: args.scrapedAt,
    input: args.scenario.input,
    premiumThb: premium.premiumThb,
    premiumBasis: premium.premiumBasis,
    coverageType: premium.coverageType,
    requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
    extractionMethod: premium.extractionMethod,
    rawPayload: {
      finalUrl: args.finalUrl,
      steps: args.steps,
      diagnosticsPaths: args.diagnosticsPaths ?? [],
      matchedText: premium.matchedText,
      rawCoverageLabel: premium.rawCoverageLabel,
      observedCoverageType: premium.coverageType,
      requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
      extractionMethod: premium.extractionMethod,
      visibleText: args.text.slice(0, 2500),
    },
    parseOk: premium.premiumBasis === "annual" && premium.coverageType !== undefined,
    notes: premium.coverageType ? args.notes : "Premium found, but coverage type was not observed; excluded from banding.",
  }));
}

export function toLiveFailureQuote(args: {
  site: string;
  runId: string;
  scenario: LiveQuoteScenario;
  error: string;
  finalUrl: string;
  diagnosticsPaths?: string[];
}): RawQuote {
  return {
    id: createQuoteId(args.site),
    runId: args.runId,
    site: args.site,
    sourceMethod: "public_quote_flow",
    scrapedAt: new Date().toISOString(),
    input: args.scenario.input,
    premiumThb: null,
    premiumBasis: "unknown",
    requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
    rawPayload: {
      finalUrl: args.finalUrl,
      error: args.error,
      diagnosticsPaths: args.diagnosticsPaths ?? [],
      requestedCoverageType: args.scenario.targetCoverageType ?? args.scenario.input.requestedCoverageType,
    },
    parseOk: false,
    notes: "Live quote flow failed safely.",
  };
}
