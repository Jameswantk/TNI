import type { CoverageType, GridInput, RepairPreference, YesNoUnknown } from "../types.js";

export interface VehicleTarget {
  brand: string;
  model: string;
  vehicleGroup: string;
  year: string;
  yearBand: string;
  subModel?: string;
}

export interface GridConfig {
  vehicles: VehicleTarget[];
  coverageTypes: CoverageType[];
  provinceRegions: string[];
  driverAgeBands: string[];
  repairPrefs: RepairPreference[];
  dashcams: YesNoUnknown[];
  mileageBands: string[];
  maxCombinations: number;
}

export const smokeGridConfig: GridConfig = {
  vehicles: [
    { brand: "Toyota", model: "Vios", vehicleGroup: "toyota_vios", year: "2021", yearBand: "2020_2024" },
    { brand: "Toyota", model: "Yaris", vehicleGroup: "toyota_yaris", year: "2021", yearBand: "2020_2024" },
    { brand: "Honda", model: "City", vehicleGroup: "honda_city", year: "2021", yearBand: "2020_2024" },
    { brand: "Honda", model: "Civic", vehicleGroup: "honda_civic", year: "2021", yearBand: "2020_2024" },
    { brand: "BMW", model: "320i", vehicleGroup: "bmw_320i", year: "2017", yearBand: "2015_2019" },
    { brand: "BMW", model: "X1", vehicleGroup: "bmw_x1", year: "2021", yearBand: "2020_2024" },
    { brand: "Mercedes-Benz", model: "C200", vehicleGroup: "mercedes_benz_c200", year: "2021", yearBand: "2020_2024" },
    { brand: "Mercedes-Benz", model: "E220", vehicleGroup: "mercedes_benz_e220", year: "2021", yearBand: "2020_2024" },
  ],
  coverageTypes: ["type_1"],
  provinceRegions: ["bangkok"],
  driverAgeBands: ["25_35"],
  repairPrefs: ["garage"],
  dashcams: ["no"],
  mileageBands: ["25000"],
  maxCombinations: 50,
};

export function cloneGridInput(input: GridInput): GridInput {
  return { ...input, defaultsUsed: { ...input.defaultsUsed } };
}
