export type CoverageType = "type_1" | "type_2_plus" | "type_2" | "type_3_plus" | "type_3";

export type RepairPreference = "dealer" | "garage" | "any" | "unknown";

export type YesNoUnknown = "yes" | "no" | "unknown";

export type ExtractionMethod = "dom_plan_card" | "body_text_annual" | "manual" | "public_page";

export type SourceMethod =
  | "manual_import"
  | "public_page"
  | "public_quote_flow"
  | "partner_api"
  | "insurer_rate_table";

export type Confidence = "high" | "medium" | "low";

export interface GridInput {
  vehicleGroup: string;
  yearBand: string;
  provinceRegion: string;
  requestedCoverageType?: CoverageType;
  driverAgeBand: string;
  repairPref: RepairPreference;
  dashcam?: YesNoUnknown;
  mileageBand?: string;
  carUse?: "personal" | "commercial" | "unknown";
  commuteUse?: "never" | "sometimes" | "daily" | "unknown";
  claimsPast12Months?: string;
  financing?: YesNoUnknown;
  noClaimBonus?: string;
  driverGenderMaritalStatus?: string;
  licenseTenure?: string;
  policyStart?: string;
  alcoholFree?: YesNoUnknown;
  defaultsUsed: Record<string, string | number | boolean>;
}

export interface RawQuote {
  id: string;
  runId: string;
  site: string;
  sourceMethod: SourceMethod;
  scrapedAt: string;
  input: GridInput;
  premiumThb: number | null;
  premiumBasis: "annual" | "monthly" | "ten_month_installment" | "unknown";
  coverageType?: CoverageType;
  requestedCoverageType?: CoverageType;
  extractionMethod?: ExtractionMethod;
  rawPayload: Record<string, unknown>;
  parseOk: boolean;
  notes?: string;
}

export interface PricingBand {
  bandKey: string;
  vehicleGroup: string;
  yearBand: string;
  provinceRegion: string;
  coverageType: CoverageType;
  driverAgeBand: string;
  repairPref: RepairPreference;
  premiumMin: number;
  premiumMax: number;
  premiumMedian: number;
  sampleCount: number;
  sourceSites: string[];
  confidence: Confidence;
  confidenceReason: string;
  stale?: boolean;
  extractionMethods?: ExtractionMethod[];
  lastScrapedAt: string;
  manualOverride: boolean;
  overrideNote?: string;
}

export interface ScrapeRun {
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: "success" | "partial" | "failed";
  perSiteSuccessCount: Record<string, number>;
  perSiteFailCount: Record<string, number>;
  totalQuotes: number;
  notes?: string;
}

export interface SiteAdapter {
  site: string;
  sourceMethod: SourceMethod;
  collect(runId: string): Promise<RawQuote[]>;
}

export interface LiveQuoteScenario {
  input: GridInput;
  brand: string;
  model: string;
  year: string;
  subModel?: string;
  targetCoverageType?: CoverageType;
  notes?: string;
}

export interface VehicleCatalogEntry {
  site: string;
  brand: string;
  model?: string;
  years?: string[];
  scrapedAt: string;
  source: "live_dropdown" | "manual_seed";
}
