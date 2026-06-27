import type { CoverageType, PlanId, RepairType } from '../types'

// ============================================================================
// PLAN CONTENT (placeholder)
// ----------------------------------------------------------------------------
// The three recommended plan archetypes: their coverage tier, repair channel,
// benefits, and — for the coverage-gap educator (project memory §25) — what each
// tier does NOT cover. In production this is admin-approved content. Pricing is
// NOT here; it comes from the pricing bands via lib/pricing.ts.
// ============================================================================

export interface PlanTemplate {
  id: PlanId
  coverage: CoverageType
  repair: RepairType
  benefitKeys: string[]
  gapKeys: string[]
  installments: boolean
}

export const planTemplates: PlanTemplate[] = [
  {
    id: 'budget',
    coverage: 'type_3_plus',
    repair: 'garage',
    benefitKeys: ['thirdParty', 'collisionKnown'],
    gapKeys: ['gapTheftFire', 'gapFlood', 'gapSolo'],
    installments: true,
  },
  {
    id: 'value',
    coverage: 'type_2_plus',
    repair: 'garage',
    benefitKeys: ['theftFire', 'thirdParty', 'collisionKnown'],
    gapKeys: ['gapSolo', 'gapFlood'],
    installments: true,
  },
  {
    id: 'strongest',
    coverage: 'type_1',
    repair: 'dealer',
    benefitKeys: ['ownDamage', 'theftFire', 'thirdParty', 'flood', 'roadside'],
    gapKeys: [],
    installments: true,
  },
]

// Generates a human-facing lead reference like IND-24891. Placeholder until the
// backend issues real, persisted reference numbers.
export function makeReference(): string {
  return 'IND-' + Math.floor(20000 + Math.random() * 9999)
}
