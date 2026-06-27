export type Lang = 'en' | 'th'

// Coverage codes match the Scraper worker (Scraper/src/types.ts).
export type CoverageType = 'type_1' | 'type_2_plus' | 'type_2' | 'type_3_plus' | 'type_3'
export type VehicleAgeBand = 'new' | 'mid' | 'old' | 'unsure'
export type RepairType = 'garage' | 'dealer'

// How well a price is grounded in the pricing data.
//   exact   -> precise band match (vehicle + province known)
//   partial -> relaxed match (province not yet set); medium confidence
//   segment -> vehicle not in data, used a segment default; rough
//   none    -> no groundable band; show no price, route to an advisor
export type MatchQuality = 'exact' | 'partial' | 'segment' | 'none'
export type Confidence = 'high' | 'medium' | 'low'

// No-Claim Bonus / claim-free years (project memory 27.3, 27.6).
export type NcbLevel = 'none' | '1' | '2' | '3' | '4plus' | 'unsure'

// Named-driver plan: who the policy lets drive. Restricting lowers the price but
// is a coverage tradeoff, not a free discount (project memory 30.2).
export type NamedDriver = 'named' | 'any30' | 'any25' | 'any'
// Annual mileage tier, replacing the old low-mileage boolean (30.4).
export type MileageTier = 'u5' | '5_10' | '10_15' | 'o15' | 'unsure'
// Insured value: a BOUNDED choice around market value, never a free slider (30.5).
export type SumInsured = 'lower' | 'balanced' | 'higher'
// Vehicle use: an eligibility gate, not a price knob. Commercial/delivery routes
// to an advisor and withdraws the confident private-use number (30.5, §11).
export type UsageType = 'private' | 'commercial'
// Recent at-fault claims (accuracy lever / eligibility).
export type AtFault = 'none' | '1' | '2plus'

// The 3-tap core intake (27.1). Province / NCB / repair / dashcam etc. are NOT
// here — they are tuned in the live price rail after the first estimate.
export interface Answers {
  carBrand?: string
  carModel?: string
  vehicleGroup?: string // resolved slug when picked from the catalog
  isEv?: boolean
  carYear?: VehicleAgeBand
  coverageStyle?: 'best' | 'value' | 'cheap' | 'unsure'
  driverAge?: '18-24' | '25-35' | '36-50' | '50+'
}

// Post-estimate controls in the price rail, split into two groups (memory §30.2):
//   "Lower my price"  -> savings levers, monotonic-down (ncb..mileage)
//   "Sharpen estimate" -> accuracy levers, can move the price either way and can
//                         branch to an advisor (province, sumInsured, usage, atFault)
// Accuracy levers are OPTIONAL: `undefined` means "assumed default", which both
// prices at the neutral value AND lowers confidence (compositional confidence).
export interface PriceControls {
  // Lower my price (savings)
  ncb: NcbLevel
  namedDriver: NamedDriver
  repairPref: RepairType
  dashcam: boolean
  higherExcess: boolean
  mileage: MileageTier
  // Sharpen this estimate (accuracy) — undefined = assumed / not yet answered
  province?: string // bangkok | central | north | northeast | south
  sumInsured?: SumInsured // undefined -> assumed balanced
  usage?: UsageType // undefined -> assumed private
  atFault?: AtFault // undefined -> not set
}

export const defaultControls: PriceControls = {
  ncb: 'none',
  namedDriver: 'any',
  repairPref: 'garage',
  dashcam: false,
  higherExcess: false,
  mileage: 'unsure',
  province: undefined,
  sumInsured: undefined,
  usage: undefined,
  atFault: undefined,
}

// Compositional confidence (memory §30.3): the badge is a weighted roll-up of
// band-match quality AND how many accuracy assumptions are still unresolved.
export type ConfidenceLevel = 'high' | 'medium' | 'rough'
export type FlagStatus = 'confirmed' | 'assumed' | 'open'
export interface ConfidenceFlag {
  key: string
  labelKey: string
  status: FlagStatus
  valueLabel?: string
}
export interface ConfidenceAssessment {
  level: ConfidenceLevel
  flags: ConfidenceFlag[]
  // labelKeys of the still-assumed accuracy flags, for the reason sentence.
  openLabelKeys: string[]
  commercial: boolean // usage = commercial -> withdraw confident number, route to advisor
}

// One line in the "Why this price?" breakdown.
export type ModifierKind = 'base' | 'discount' | 'loading' | 'info'
export interface Modifier {
  key: string
  labelKey: string
  kind: ModifierKind
  factor: number // multiplicative; 1 = no change
  deltaPct: number // signed percent for display (e.g. -40, +18)
  valueLabel?: string // for info rows (e.g. a province name)
}

// A deterministic indicative price. Never invented by an LLM — computed from
// the pricing bands plus the explicit modifier layers (project memory 4, 10).
export interface Quote {
  coverage: CoverageType
  repair: RepairType
  priced: boolean
  base: { min: number; max: number; median: number }
  modifiers: Modifier[]
  min: number
  max: number
  median: number
  // Best achievable range if every available discount were applied — drives the
  // "Lower my price -> ฿X" projection in the savings console.
  floorMin: number
  floorMax: number
  confidence: Confidence
  quality: MatchQuality
}

export type PlanId = 'budget' | 'value' | 'strongest'

export interface PlanRecommendation extends Quote {
  id: PlanId
  benefitKeys: string[]
  gapKeys: string[] // what this tier does NOT cover (coverage-gap educator, §25)
  installments: boolean
  whyKeys: string[]
  recommended: boolean
}

// One row of "Indara's read" — the thin deterministic advisor layer that
// interprets the quote (best next saving / biggest assumption / coverage warning).
// Rule-based, no LLM (project memory §4, §14). Targets point at existing controls.
export type AdvisorTarget = 'ncb' | 'named' | 'repair' | 'dashcam' | 'mileage' | 'excess' | 'sharpen' | 'plans'
export interface AdvisorReadItem {
  kind: 'saving' | 'assumption' | 'warning'
  icon: string
  labelKey: string
  bodyKey: string
  bodyParams?: Record<string, string>
  shortKey?: string // terse form for the collapsed mobile summary
  actionKey?: string
  target?: AdvisorTarget
  severity?: 'info' | 'warning'
}

export type Sender = 'advisor' | 'user'

export interface ChatMessage {
  id: number
  sender: Sender
  text: string
}

// intake -> tune (live rail) -> recommendations -> lead -> confirmed.
export type Stage = 'intake' | 'tune' | 'recommendations' | 'lead' | 'confirmed'

export interface Lead {
  name: string
  phone: string
  lineId: string
  callback: string
  renewal: string
  consent: boolean
  quoteContext?: {
    answers: Answers
    controls: PriceControls
    confidence: ConfidenceAssessment
    commercial: boolean
  }
}
