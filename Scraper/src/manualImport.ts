import { readFile } from "node:fs/promises";
import type { PricingBand } from "./types.js";

const REQUIRED_COLUMNS = [
  "band_key",
  "vehicle_group",
  "year_band",
  "province_region",
  "coverage_type",
  "driver_age_band",
  "repair_pref",
  "premium_min",
  "premium_max",
  "premium_median",
  "sample_count",
  "source_sites",
  "confidence",
  "manual_override",
] as const;

export async function importPricingBandsFromCsv(path: string): Promise<PricingBand[]> {
  const content = await readFile(path, "utf8");
  const rows = parseCsv(content);
  if (rows.length === 0) return [];

  const headers = rows[0];
  for (const required of REQUIRED_COLUMNS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required CSV column: ${required}`);
    }
  }

  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => rowToBand(headers, row));
}

function rowToBand(headers: string[], row: string[]): PricingBand {
  const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
  return {
    bandKey: required(record.band_key, "band_key"),
    vehicleGroup: required(record.vehicle_group, "vehicle_group"),
    yearBand: required(record.year_band, "year_band"),
    provinceRegion: required(record.province_region, "province_region"),
    coverageType: required(record.coverage_type, "coverage_type") as PricingBand["coverageType"],
    driverAgeBand: required(record.driver_age_band, "driver_age_band"),
    repairPref: required(record.repair_pref, "repair_pref") as PricingBand["repairPref"],
    premiumMin: numberField(record.premium_min, "premium_min"),
    premiumMax: numberField(record.premium_max, "premium_max"),
    premiumMedian: numberField(record.premium_median, "premium_median"),
    sampleCount: numberField(record.sample_count, "sample_count"),
    sourceSites: required(record.source_sites, "source_sites").split("|").map((value) => value.trim()),
    confidence: required(record.confidence, "confidence") as PricingBand["confidence"],
    confidenceReason: record.confidence_reason || "Manual import.",
    lastScrapedAt: record.last_scraped_at || new Date().toISOString(),
    manualOverride: parseBoolean(record.manual_override),
    overrideNote: record.override_note || undefined,
  };
}

function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(",").map((cell) => cell.trim()));
}

function required(value: string | undefined, field: string): string {
  if (!value) throw new Error(`Missing value for ${field}`);
  return value;
}

function numberField(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number for ${field}: ${value}`);
  return parsed;
}

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

