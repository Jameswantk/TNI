// Representative market values used to bound the insured-value control.
// These are reference figures for indicative UX only; the advisor/insurer
// verifies the final insured sum before binding.

export type MarketYearBand = '2020_2024' | '2015_2019'

export const marketValues: Record<string, Record<MarketYearBand, number>> = {
  default: { '2020_2024': 750000, '2015_2019': 530000 },
  toyota_vios: { '2020_2024': 560000, '2015_2019': 390000 },
  toyota_yaris: { '2020_2024': 540000, '2015_2019': 380000 },
  toyota_corolla_altis: { '2020_2024': 820000, '2015_2019': 570000 },
  toyota_fortuner: { '2020_2024': 1280000, '2015_2019': 900000 },
  toyota_hilux_revo: { '2020_2024': 920000, '2015_2019': 640000 },
  honda_city: { '2020_2024': 620000, '2015_2019': 430000 },
  honda_civic: { '2020_2024': 980000, '2015_2019': 690000 },
  honda_crv: { '2020_2024': 1320000, '2015_2019': 920000 },
  honda_jazz: { '2020_2024': 560000, '2015_2019': 390000 },
  isuzu_dmax: { '2020_2024': 950000, '2015_2019': 670000 },
  isuzu_mux: { '2020_2024': 1220000, '2015_2019': 850000 },
  mitsubishi_triton: { '2020_2024': 880000, '2015_2019': 620000 },
  mitsubishi_xpander: { '2020_2024': 760000, '2015_2019': 530000 },
  mazda_2: { '2020_2024': 560000, '2015_2019': 390000 },
  nissan_almera: { '2020_2024': 540000, '2015_2019': 380000 },
  ford_ranger: { '2020_2024': 1050000, '2015_2019': 740000 },
  mg_zs: { '2020_2024': 820000, '2015_2019': 570000 },
  byd_atto3: { '2020_2024': 1350000, '2015_2019': 950000 },
}

export function marketValueFor(vehicleGroup: string, yearBand: string): number {
  const years = marketValues[vehicleGroup] ?? marketValues.default
  return years[yearBand as MarketYearBand] ?? marketValues.default[yearBand as MarketYearBand] ?? marketValues.default['2020_2024']
}
