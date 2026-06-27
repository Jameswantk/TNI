import type { LiveQuoteScenario } from "../types.js";
import { smokeGridConfig, type GridConfig } from "./gridConfig.js";

export function generateLiveQuoteScenarios(config: GridConfig = smokeGridConfig): LiveQuoteScenario[] {
  const scenarios: LiveQuoteScenario[] = [];

  for (const vehicle of config.vehicles) {
    for (const requestedCoverageType of config.coverageTypes) {
      for (const provinceRegion of config.provinceRegions) {
        for (const driverAgeBand of config.driverAgeBands) {
          for (const repairPref of config.repairPrefs) {
            for (const dashcam of config.dashcams) {
              for (const mileageBand of config.mileageBands) {
                scenarios.push({
                  brand: vehicle.brand,
                  model: vehicle.model,
                  year: vehicle.year,
                  subModel: vehicle.subModel,
                  targetCoverageType: requestedCoverageType,
                  input: {
                    vehicleGroup: vehicle.vehicleGroup,
                    yearBand: vehicle.yearBand,
                    provinceRegion,
                    requestedCoverageType,
                    driverAgeBand,
                    repairPref,
                    dashcam,
                    mileageBand,
                    carUse: "personal",
                    commuteUse: "never",
                    claimsPast12Months: "0",
                    financing: "no",
                    noClaimBonus: "unknown",
                    driverGenderMaritalStatus: "Male-Single",
                    licenseTenure: "6",
                    policyStart: "Today",
                    alcoholFree: "no",
                    defaultsUsed: {
                      source: "grid_generator",
                      grid: "smoke",
                    },
                  },
                  notes: "Config-driven live quote-form scenario for authorized smoke runs.",
                });
              }
            }
          }
        }
      }
    }
  }

  if (scenarios.length > config.maxCombinations) {
    throw new Error(`Grid generated ${scenarios.length} combinations, above cap ${config.maxCombinations}. Narrow the config or raise the cap intentionally.`);
  }

  return scenarios;
}
