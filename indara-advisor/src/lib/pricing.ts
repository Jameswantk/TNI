import type {
  Answers,
  AtFault,
  Confidence,
  ConfidenceAssessment,
  ConfidenceFlag,
  ConfidenceLevel,
  CoverageType,
  MileageTier,
  Modifier,
  NamedDriver,
  NcbLevel,
  PlanRecommendation,
  PriceControls,
  Quote,
  RepairType,
  SumInsured,
} from '../types'
import {
  findBaseBand,
  vehicleGroupFromAnswers,
  yearBandFromAnswers,
} from '../data/pricingData'
import { marketValueFor } from '../data/marketValues'
import { planTemplates } from '../data/mockDb'

// ============================================================================
// DETERMINISTIC QUOTE ENGINE (base x stacked modifiers)
// ----------------------------------------------------------------------------
// Prices are read from the pricing bands, never invented (project memory 4, 10).
// We look up an age-neutral base band, then apply driver age, NCB, dashcam,
// voluntary excess and low-mileage as explicit multiplicative modifiers. Each
// becomes a line in the "Why this price?" breakdown and a control in the
// "Lower my price" console (27.4, 27.6).
// ============================================================================

// Stacked discount / loading magnitudes (project memory 27.6). Indicative.
const AGE_FACTOR: Record<NonNullable<Answers['driverAge']>, number> = {
  '18-24': 1.18,
  '25-35': 1.0,
  '36-50': 0.92,
  '50+': 0.97,
}

// No-Claim Bonus ladder: 20/30/40/50% for 1/2/3/4+ claim-free years.
const NCB_FACTOR: Record<NcbLevel, number> = {
  none: 1.0,
  '1': 0.8,
  '2': 0.7,
  '3': 0.6,
  '4plus': 0.5,
  unsure: 1.0,
}
export const NCB_PCT: Record<NcbLevel, number> = {
  none: 0,
  '1': 20,
  '2': 30,
  '3': 40,
  '4plus': 50,
  unsure: 0,
}

const DASHCAM_FACTOR = 0.93 // -7%
const EXCESS_FACTOR = 0.9 // -10% for a voluntary deductible

// Named-driver plan: restricting who can drive lowers the price (project memory
// 30.2). Named-only is the biggest reduction; "any driver" is the neutral base.
const NAMED_DRIVER_FACTOR: Record<NamedDriver, number> = {
  named: 0.85,
  any30: 0.93,
  any25: 0.97,
  any: 1.0,
}
// Mileage tier (30.4) — low mileage discounts, high mileage loads. Honest
// framing only: NOT pay-as-you-drive / telematics (28.3).
const MILEAGE_FACTOR: Record<MileageTier, number> = {
  u5: 0.92,
  '5_10': 0.96,
  '10_15': 1.0,
  o15: 1.05,
  unsure: 1.0,
}
// Insured value: bounded around market value (30.5). Lower reduces premium but
// risks underinsurance; higher buys more protection.
const SUM_INSURED_FACTOR: Record<SumInsured, number> = {
  lower: 0.9,
  balanced: 1.0,
  higher: 1.1,
}
// Recent at-fault claims load the premium (accuracy lever).
const ATFAULT_FACTOR: Record<AtFault, number> = {
  none: 1.0,
  '1': 1.1,
  '2plus': 1.25,
}

const round100 = (n: number) => Math.round(n / 100) * 100
const round10000 = (n: number) => Math.round(n / 10000) * 10000
const pct = (factor: number) => Math.round((factor - 1) * 100)

// Coverage type implied by the headline "what matters most" answer. Mapping
// per project memory §6/§9: cheapest -> Type 3+, balanced value -> Type 2+,
// best protection -> Type 1; "recommend for me" defaults to the balanced tier.
export function headlineCoverage(a: Answers): CoverageType {
  switch (a.coverageStyle) {
    case 'cheap':
      return 'type_3_plus'
    case 'best':
      return 'type_1'
    case 'value':
    case 'unsure':
    default:
      return 'type_2_plus'
  }
}

// Default repair channel implied by the headline answer (user can flip it).
export function headlineRepair(a: Answers): RepairType {
  return a.coverageStyle === 'best' ? 'dealer' : 'garage'
}

export function marketValue(a: Answers): number {
  return round10000(marketValueFor(vehicleGroupFromAnswers(a), yearBandFromAnswers(a)))
}

export function insuredValue(a: Answers, c: PriceControls): number {
  const factor = c.sumInsured ? SUM_INSURED_FACTOR[c.sumInsured] : SUM_INSURED_FACTOR.balanced
  return round10000(marketValue(a) * factor)
}

function buildModifiers(a: Answers, c: PriceControls): Modifier[] {
  const mods: Modifier[] = []

  if (a.driverAge && a.driverAge !== '25-35') {
    const f = AGE_FACTOR[a.driverAge]
    mods.push({
      key: 'age',
      labelKey: 'mod.age',
      kind: f < 1 ? 'discount' : 'loading',
      factor: f,
      deltaPct: pct(f),
    })
  }

  if (c.ncb !== 'none' && c.ncb !== 'unsure') {
    const f = NCB_FACTOR[c.ncb]
    mods.push({ key: 'ncb', labelKey: 'mod.ncb', kind: 'discount', factor: f, deltaPct: pct(f) })
  }

  if (c.namedDriver !== 'any') {
    const f = NAMED_DRIVER_FACTOR[c.namedDriver]
    mods.push({ key: 'named', labelKey: 'mod.named', kind: 'discount', factor: f, deltaPct: pct(f) })
  }

  if (c.dashcam) {
    mods.push({
      key: 'dashcam',
      labelKey: 'mod.dashcam',
      kind: 'discount',
      factor: DASHCAM_FACTOR,
      deltaPct: pct(DASHCAM_FACTOR),
    })
  }

  if (c.higherExcess) {
    mods.push({
      key: 'excess',
      labelKey: 'mod.excess',
      kind: 'discount',
      factor: EXCESS_FACTOR,
      deltaPct: pct(EXCESS_FACTOR),
    })
  }

  if (MILEAGE_FACTOR[c.mileage] !== 1) {
    const f = MILEAGE_FACTOR[c.mileage]
    mods.push({
      key: 'mileage',
      labelKey: 'mod.mileage',
      kind: f < 1 ? 'discount' : 'loading',
      factor: f,
      deltaPct: pct(f),
    })
  }

  // Accuracy levers (only when explicitly set; undefined = assumed neutral).
  if (c.sumInsured && c.sumInsured !== 'balanced') {
    const f = SUM_INSURED_FACTOR[c.sumInsured]
    mods.push({
      key: 'sumInsured',
      labelKey: 'mod.sumInsured',
      kind: f < 1 ? 'discount' : 'loading',
      factor: f,
      deltaPct: pct(f),
    })
  }

  if (c.atFault && c.atFault !== 'none') {
    const f = ATFAULT_FACTOR[c.atFault]
    mods.push({ key: 'atFault', labelKey: 'mod.atFault', kind: 'loading', factor: f, deltaPct: pct(f) })
  }

  return mods
}

// Best achievable factor if every SAVINGS lever were maxed (4+ NCB, named-only,
// dashcam, excess, lowest mileage). Accuracy levers are excluded — lowering the
// insured value is not a "saving" we coach toward.
function floorFactor(a: Answers): number {
  const ageF = a.driverAge ? AGE_FACTOR[a.driverAge] : 1
  return (
    ageF *
    NCB_FACTOR['4plus'] *
    NAMED_DRIVER_FACTOR.named *
    DASHCAM_FACTOR *
    EXCESS_FACTOR *
    MILEAGE_FACTOR.u5
  )
}

export function computeQuote(
  a: Answers,
  c: PriceControls,
  coverage: CoverageType,
  repair: RepairType,
): Quote {
  const base = findBaseBand(
    vehicleGroupFromAnswers(a),
    yearBandFromAnswers(a),
    c.province,
    coverage,
    repair,
  )

  if (!base) {
    return {
      coverage,
      repair,
      priced: false,
      base: { min: 0, max: 0, median: 0 },
      modifiers: [],
      min: 0,
      max: 0,
      median: 0,
      floorMin: 0,
      floorMax: 0,
      confidence: 'low',
      quality: 'none',
    }
  }

  const modifiers = buildModifiers(a, c)
  const factor = modifiers.reduce((f, m) => f * m.factor, 1)
  const ffactor = floorFactor(a)

  return {
    coverage,
    repair,
    priced: true,
    base: { min: base.min, max: base.max, median: base.median },
    modifiers,
    min: round100(base.min * factor),
    max: round100(base.max * factor),
    median: round100(base.median * factor),
    floorMin: round100(base.min * ffactor),
    floorMax: round100(base.max * ffactor),
    confidence: base.confidence as Confidence,
    quality: base.quality,
  }
}

// The headline estimate shown in the live rail during the "tune" stage.
export function headlineQuote(a: Answers, c: PriceControls): Quote {
  return computeQuote(a, c, headlineCoverage(a), c.repairPref)
}

// Compositional confidence (project memory §30.3). The badge is NOT just the
// band-match quality — it is a weighted roll-up of that quality plus how many
// accuracy assumptions are still unresolved. Resolving an assumption (set the
// area, confirm private use, pick an insured value) raises the badge honestly.
export function assessConfidence(_a: Answers, c: PriceControls, quote: Quote): ConfidenceAssessment {
  const flags: ConfidenceFlag[] = []

  // Vehicle match — the heaviest factor, straight from the band lookup.
  const vehicleConfirmed = quote.priced && quote.quality !== 'segment'
  flags.push({ key: 'vehicle', labelKey: 'flag.vehicle', status: vehicleConfirmed ? 'confirmed' : 'assumed' })

  const provinceConfirmed = !!c.province
  flags.push({ key: 'area', labelKey: 'flag.area', status: provinceConfirmed ? 'confirmed' : 'assumed' })

  const usageStatus = c.usage === 'private' ? 'confirmed' : c.usage === 'commercial' ? 'open' : 'assumed'
  flags.push({ key: 'usage', labelKey: 'flag.usage', status: usageStatus })

  const insuredConfirmed = !!c.sumInsured
  flags.push({ key: 'insured', labelKey: 'flag.insured', status: insuredConfirmed ? 'confirmed' : 'assumed' })

  const claimsConfirmed = !!c.atFault
  flags.push({ key: 'claims', labelKey: 'flag.claims', status: claimsConfirmed ? 'confirmed' : 'open' })

  // Weighted score: band quality is the floor, each open assumption deducts.
  // Calibrated so a matched vehicle's first estimate reads "medium" (a known car
  // is a real ballpark), an exact band with use/insured still assumed stays
  // "medium" (§30.3 example), and only an unknown (segment) vehicle is "rough".
  // Recent claims is an accuracy nicety, not a confidence driver — no penalty.
  let score = quote.quality === 'exact' ? 3.0 : quote.quality === 'partial' ? 2.5 : 1.2
  if (!provinceConfirmed) score -= 0.45
  if (usageStatus === 'assumed') score -= 0.3
  if (!insuredConfirmed) score -= 0.3

  const commercial = c.usage === 'commercial'
  let level: ConfidenceLevel = score >= 2.5 ? 'high' : score >= 1.35 ? 'medium' : 'rough'
  if (commercial) level = 'rough' // business/delivery -> advisor confirms (§11)

  // The still-assumed accuracy levers, for the "because … still assumed" line.
  const openLabelKeys = flags
    .filter((f) => f.status === 'assumed' && f.key !== 'vehicle')
    .map((f) => f.labelKey)

  return { level, flags, openLabelKeys, commercial }
}

function buildWhyKeys(a: Answers, coverage: CoverageType, repair: RepairType): string[] {
  const keys: string[] = []
  if (coverage === 'type_1') keys.push('whyType1')
  if (coverage === 'type_2_plus') keys.push('whyType2plus')
  if (coverage === 'type_3_plus') keys.push('whyType3plus')
  if (repair === 'garage') keys.push('whyGarage')
  if (repair === 'dealer') keys.push('whyDealer')
  if (a.coverageStyle === 'value') keys.push('whyValue')
  if (a.coverageStyle === 'cheap') keys.push('whyCheap')
  return keys.slice(0, 4)
}

// The 2-3 recommendation cards. All three reflect the user's current "Lower my
// price" controls (NCB, dashcam…) so the cards stay consistent with the rail.
export function recommendPlans(a: Answers, c: PriceControls): PlanRecommendation[] {
  const highlight = headlinePlanId(a)
  return planTemplates.map((plan) => {
    const q = computeQuote(a, c, plan.coverage, plan.repair)
    return {
      ...q,
      id: plan.id,
      benefitKeys: plan.benefitKeys,
      gapKeys: plan.gapKeys,
      installments: plan.installments,
      whyKeys: buildWhyKeys(a, plan.coverage, plan.repair),
      recommended: plan.id === highlight,
    }
  })
}

export function headlinePlanId(a: Answers) {
  switch (a.coverageStyle) {
    case 'best':
      return 'strongest' as const
    case 'cheap':
      return 'budget' as const
    default:
      return 'value' as const
  }
}

// ----- "Should I claim?" decision calculator (project memory 28.1) -----------
// Educational only — NOT claims handling or financial advice (compliance §14).
export interface ClaimInputs {
  repairCost: number
  annualPremium: number
  ncb: NcbLevel
  excess: number
  // A not-at-fault claim against a known, liable third party does NOT drop NCB.
  atFault: boolean
}
export interface ClaimResult {
  ncbCurrentPct: number
  ncbAfterPct: number
  extraPerYear: number
  ncbLossValue: number
  claimNetCost: number
  outOfPocketCost: number
  shouldClaim: boolean
  saving: number
}

// One at-fault claim drops NCB one tier; we value the lost discount over a
// ~3-year recovery horizon, added to any voluntary excess.
const RECOVERY_YEARS = 3
const NCB_TIERS: NcbLevel[] = ['none', '1', '2', '3', '4plus']

export function evaluateClaim(input: ClaimInputs): ClaimResult {
  const idx = NCB_TIERS.indexOf(input.ncb === 'unsure' ? 'none' : input.ncb)
  const ncbCurrentPct = NCB_PCT[NCB_TIERS[Math.max(0, idx)]]
  // A not-at-fault claim keeps your NCB tier; an at-fault claim drops it one.
  const ncbAfterPct = input.atFault ? NCB_PCT[NCB_TIERS[Math.max(0, idx - 1)]] : ncbCurrentPct

  // Premium reflects the current discount; the "undiscounted" premium is the
  // base from which a lower NCB next year is charged.
  const undiscounted = input.annualPremium / (1 - ncbCurrentPct / 100 || 1)
  const extraPerYear = Math.max(
    0,
    Math.round((undiscounted * (ncbCurrentPct - ncbAfterPct)) / 100),
  )
  const ncbLossValue = extraPerYear * RECOVERY_YEARS
  const claimNetCost = input.excess + ncbLossValue
  const outOfPocketCost = input.repairCost
  const shouldClaim = outOfPocketCost > claimNetCost
  return {
    ncbCurrentPct,
    ncbAfterPct,
    extraPerYear,
    ncbLossValue,
    claimNetCost,
    outOfPocketCost,
    shouldClaim,
    saving: Math.abs(outOfPocketCost - claimNetCost),
  }
}
