import type { Answers, CoverageType, MatchQuality, RepairType } from '../types'
import { resolveVehicleGroup } from './catalog'
import bands from './pricingBands.json'

// ============================================================================
// PRICING DATA ACCESS
// ----------------------------------------------------------------------------
// Reads pricing bands in the EXACT shape the separate Scraper worker emits
// (Scraper/src/types.ts -> PricingBand, written to pricing_bands.json). For the
// mockup we bundle a seeded `pricingBands.json`; in production this file is
// replaced by the scraper output (or fetched from an endpoint) unchanged.
//
// The customer-facing engine (lib/pricing.ts) reads a *reference-age* base band
// here, then applies driver-age / NCB / dashcam / excess as explicit, visible
// modifier layers (project memory 27.6) so the price is fully explainable.
// ============================================================================

export type RepairPref = 'dealer' | 'garage' | 'any' | 'unknown'
export type Confidence = 'high' | 'medium' | 'low'

// Reference driver-age band. Bands at this age have an age multiplier of 1.0,
// so a band looked up here is "age-neutral" and the age modifier is applied on
// top — letting the breakdown show driver age as its own line.
export const REFERENCE_AGE = '25_35'

export interface PricingBand {
  bandKey: string
  vehicleGroup: string
  yearBand: string
  provinceRegion: string
  coverageType: CoverageType
  driverAgeBand: string
  repairPref: RepairPref
  premiumMin: number
  premiumMax: number
  premiumMedian: number
  sampleCount: number
  sourceSites: string[]
  confidence: Confidence
  confidenceReason: string
  lastScrapedAt: string
  manualOverride: boolean
  overrideNote?: string
}

export const pricingBands = bands as PricingBand[]

// Newest scrape timestamp across the dataset — surfaced as freshness/trust (§25).
export const dataLastUpdated = pricingBands.reduce(
  (latest, b) => (b.lastScrapedAt > latest ? b.lastScrapedAt : latest),
  '',
)

export function vehicleGroupFromAnswers(a: Answers): string {
  return a.vehicleGroup ?? resolveVehicleGroup(a.carBrand, a.carModel)
}

export function yearBandFromAnswers(a: Answers): string {
  switch (a.carYear) {
    case 'old':
      return '2015_2019'
    case 'new':
    case 'mid':
    default:
      return '2020_2024'
  }
}

export function driverAgeBandFromAnswers(a: Answers): string {
  switch (a.driverAge) {
    case '18-24':
      return '18_24'
    case '36-50':
      return '36_50'
    case '50+':
      return '50_99'
    case '25-35':
    default:
      return REFERENCE_AGE
  }
}

export interface BaseBand {
  min: number
  max: number
  median: number
  quality: MatchQuality
  confidence: Confidence
  sampleCount: number
  sourceSites: string[]
  lastScrapedAt: string
}

function aggregate(hits: PricingBand[], quality: MatchQuality, widen: number): BaseBand {
  const min = Math.min(...hits.map((b) => b.premiumMin))
  const max = Math.max(...hits.map((b) => b.premiumMax))
  const median = hits.reduce((s, b) => s + b.premiumMedian, 0) / hits.length
  const confidence: Confidence =
    quality === 'exact' ? hits[0].confidence : quality === 'partial' ? 'medium' : 'low'
  return {
    min: Math.round((min * (1 - widen)) / 100) * 100,
    max: Math.round((max * (1 + widen)) / 100) * 100,
    median: Math.round(median / 100) * 100,
    quality,
    confidence,
    sampleCount: hits.reduce((s, b) => s + b.sampleCount, 0),
    sourceSites: [...new Set(hits.flatMap((b) => b.sourceSites))],
    lastScrapedAt: hits.reduce((l, b) => (b.lastScrapedAt > l ? b.lastScrapedAt : l), ''),
  }
}

// Look up the age-neutral base band, walking a fallback ladder. When province
// is unknown the match is `partial` (range widened, medium confidence); an
// unknown vehicle falls to the `segment` default (rough, low confidence).
export function findBaseBand(
  vehicleGroup: string,
  yearBand: string,
  province: string | undefined,
  coverage: CoverageType,
  repair: RepairType,
): BaseBand | null {
  const repairOk = (b: PricingBand) =>
    coverage === 'type_1' || coverage === 'type_2_plus'
      ? b.repairPref === repair || b.repairPref === 'any'
      : true

  // 1. Exact: province known.
  if (province) {
    const hits = pricingBands.filter(
      (b) =>
        b.vehicleGroup === vehicleGroup &&
        b.yearBand === yearBand &&
        b.provinceRegion === province &&
        b.coverageType === coverage &&
        b.driverAgeBand === REFERENCE_AGE &&
        repairOk(b),
    )
    if (hits.length) return aggregate(hits, 'exact', 0)
  }

  // 2. Relax province (and repair): same vehicle + year + coverage at ref age.
  let hits = pricingBands.filter(
    (b) =>
      b.vehicleGroup === vehicleGroup &&
      b.yearBand === yearBand &&
      b.coverageType === coverage &&
      b.driverAgeBand === REFERENCE_AGE,
  )
  if (hits.length) return aggregate(hits, 'partial', 0.06)

  // 3. Segment default for unknown vehicles.
  hits = pricingBands.filter((b) => b.vehicleGroup === 'default' && b.coverageType === coverage)
  if (hits.length) return aggregate(hits, 'segment', 0.08)

  // 4. Nothing groundable.
  return null
}
