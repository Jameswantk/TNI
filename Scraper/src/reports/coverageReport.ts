import type { CoverageType, PricingBand } from "../types.js";

const REQUIRED_COVERAGE_TYPES: CoverageType[] = ["type_1", "type_2_plus", "type_3_plus", "type_3"];

export interface CoverageReportRow {
  vehicleGroup: string;
  present: CoverageType[];
  missing: CoverageType[];
}

export function buildCoverageReport(bands: PricingBand[], requiredCoverageTypes = REQUIRED_COVERAGE_TYPES): CoverageReportRow[] {
  const byVehicle = new Map<string, Set<CoverageType>>();
  for (const band of bands) {
    const set = byVehicle.get(band.vehicleGroup) ?? new Set<CoverageType>();
    set.add(band.coverageType);
    byVehicle.set(band.vehicleGroup, set);
  }

  return Array.from(byVehicle.entries()).map(([vehicleGroup, coverages]) => ({
    vehicleGroup,
    present: requiredCoverageTypes.filter((coverage) => coverages.has(coverage)),
    missing: requiredCoverageTypes.filter((coverage) => !coverages.has(coverage)),
  })).sort((a, b) => a.vehicleGroup.localeCompare(b.vehicleGroup));
}
