import type { CoverageType, RepairPreference } from "../types.js";

export function normalizeCoverageType(value: string): CoverageType | undefined {
  const cleaned = value.toLowerCase().replace(/\s+/g, "");
  if (cleaned === "1" || cleaned === "type1") return "type_1";
  if (cleaned === "2+" || cleaned === "type2+") return "type_2_plus";
  if (cleaned === "2" || cleaned === "type2") return "type_2";
  if (cleaned === "3+" || cleaned === "type3+") return "type_3_plus";
  if (cleaned === "3" || cleaned === "type3") return "type_3";
  return undefined;
}

export function makeBandKey(parts: {
  vehicleGroup: string;
  yearBand: string;
  provinceRegion: string;
  coverageType: CoverageType;
  driverAgeBand: string;
  repairPref: RepairPreference;
}): string {
  return [
    parts.vehicleGroup,
    parts.yearBand,
    parts.provinceRegion,
    parts.coverageType,
    parts.driverAgeBand,
    parts.repairPref,
  ].join("|");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

