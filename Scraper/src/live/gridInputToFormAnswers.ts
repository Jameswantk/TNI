import type { GridInput, YesNoUnknown } from "../types.js";

export interface FormAnswers {
  dob: { day: string; month: string; year: string };
  postcode: string;
  dashcam: YesNoUnknown;
  mileageValue: string;
  mileageLabel: string;
  carUse: "personal" | "commercial" | "unknown";
  commuteUse: "never" | "sometimes" | "daily" | "unknown";
  claimsPast12Months: string;
  financing: YesNoUnknown;
  noClaimBonus: string;
  driverGenderMaritalStatus: string;
  licenseTenure: string;
  policyStart: string;
  alcoholFree: YesNoUnknown;
}

const PROVINCE_POSTCODES: Record<string, string> = {
  bangkok: "10230",
  central: "10230",
  chiang_mai: "50000",
  north: "50000",
  phuket: "83000",
  south: "83000",
  chonburi: "20000",
  east: "20000",
  khon_kaen: "40000",
  northeast: "40000",
  thailand: "10230",
};

export function formAnswersFromGridInput(input: GridInput): FormAnswers {
  const ageMidpoint = midpointFromBand(input.driverAgeBand) ?? 30;
  const birthYear = new Date().getFullYear() - ageMidpoint;
  const mileage = input.mileageBand ?? "25000";

  return {
    dob: { day: "01", month: "01", year: String(birthYear) },
    postcode: postcodeForRegion(input.provinceRegion),
    dashcam: input.dashcam ?? "no",
    mileageValue: mileage,
    mileageLabel: mileageLabel(mileage),
    carUse: input.carUse ?? "personal",
    commuteUse: input.commuteUse ?? "never",
    claimsPast12Months: input.claimsPast12Months ?? "0",
    financing: input.financing ?? "no",
    noClaimBonus: input.noClaimBonus ?? "unknown",
    driverGenderMaritalStatus: input.driverGenderMaritalStatus ?? "Male-Single",
    licenseTenure: input.licenseTenure ?? "6",
    policyStart: input.policyStart ?? "Today",
    alcoholFree: input.alcoholFree ?? "no",
  };
}

export function actualDefaultsFromAnswers(answers: FormAnswers): Record<string, string | number | boolean> {
  return {
    driver_dob: `${answers.dob.day}/${answers.dob.month}/${answers.dob.year}`,
    postcode: answers.postcode,
    dashcam: answers.dashcam,
    mileage_value: answers.mileageValue,
    car_use: answers.carUse,
    commute_use: answers.commuteUse,
    claims_past_12_months: answers.claimsPast12Months,
    financing: answers.financing,
    no_claim_bonus: answers.noClaimBonus,
    gender_marital_status: answers.driverGenderMaritalStatus,
    license_tenure_years: answers.licenseTenure,
    policy_start: answers.policyStart,
    alcohol_free: answers.alcoholFree,
  };
}

function postcodeForRegion(region: string): string {
  return PROVINCE_POSTCODES[region.toLowerCase()] ?? PROVINCE_POSTCODES.bangkok;
}

function midpointFromBand(band: string): number | undefined {
  const match = band.match(/(\d+)\D+(\d+)/);
  if (!match) return undefined;
  return Math.round((Number(match[1]) + Number(match[2])) / 2);
}

function mileageLabel(value: string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return `Up to ${number.toLocaleString("en-US")} km`;
}
