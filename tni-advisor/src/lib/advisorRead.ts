import type { AdvisorReadItem, Answers, PriceControls, Quote } from '../types'
import { assessConfidence, headlineQuote } from './pricing'

// ============================================================================
// "TNI'S READ" — thin deterministic advisor layer (project memory §4, §14)
// ----------------------------------------------------------------------------
// Interprets the existing quote/controls/confidence into up to three advisor
// rows: the best next saving, the biggest open assumption, and the most relevant
// coverage tradeoff to watch. Rule-based, no LLM. Each row points an action at an
// existing control — it never adds new questions or flows.
// ============================================================================

const baht = (n: number) => '฿' + n.toLocaleString()

// THB the headline price would drop if `patch` were applied at its best setting.
function savingDelta(a: Answers, c: PriceControls, quote: Quote, patch: Partial<PriceControls>): number {
  if (!quote.priced) return 0
  const alt = headlineQuote(a, { ...c, ...patch })
  return Math.max(0, quote.median - alt.median)
}

// 1. Best next saving — the highest-impact savings lever still at its default,
//    quantified with the real THB it could remove. Ranked by actual delta so the
//    suggestion is truly highest-impact, not just first in a fixed priority list.
function bestSaving(a: Answers, c: PriceControls, quote: Quote): AdvisorReadItem | null {
  if (!quote.priced) return null

  type Candidate = { item: AdvisorReadItem; delta: number }

  const makeCandidate = (
    target: AdvisorReadItem['target'],
    bodyKey: string,
    shortKey: string,
    patch: Partial<PriceControls>,
    actionKey = 'read.action.adjust',
  ): Candidate => {
    const delta = savingDelta(a, c, quote, patch)
    return {
      delta,
      item: { kind: 'saving', icon: 'coin', labelKey: 'read.label.saving', bodyKey, bodyParams: { amount: baht(delta) }, shortKey, actionKey, target },
    }
  }

  const candidates: Candidate[] = []

  if (c.ncb === 'none' || c.ncb === 'unsure')
    candidates.push(makeCandidate('ncb', 'read.save.ncb', 'read.short.ncb', { ncb: '4plus' }, 'read.action.confirm'))
  if (c.namedDriver === 'any')
    candidates.push(makeCandidate('named', 'read.save.named', 'read.short.named', { namedDriver: 'named' }))
  if (c.repairPref === 'dealer')
    candidates.push(makeCandidate('repair', 'read.save.repair', 'read.short.repair', { repairPref: 'garage' }))
  if (!c.dashcam)
    candidates.push(makeCandidate('dashcam', 'read.save.dashcam', 'read.short.dashcam', { dashcam: true }))
  // Only suggest mileage when it's unanswered — never coach a user who explicitly
  // chose a high tier toward a lower one they didn't pick (§14 honest framing).
  if (c.mileage === 'unsure')
    candidates.push(makeCandidate('mileage', 'read.save.mileage', 'read.short.mileage', { mileage: 'u5' }))
  if (!c.higherExcess)
    candidates.push(makeCandidate('excess', 'read.save.excess', 'read.short.excess', { higherExcess: true }))

  if (candidates.length === 0)
    return { kind: 'saving', icon: 'circle-check', labelKey: 'read.label.saving', bodyKey: 'read.save.none', shortKey: 'read.short.none' }

  candidates.sort((x, y) => y.delta - x.delta)
  return candidates[0].item
}

// 2. Biggest assumption — the top still-open accuracy flag from the existing
//    compositional confidence (summarizes "Sharpen this estimate").
//    Vehicle quality takes priority: a segment match means the price is derived
//    from similar vehicles — that is a bigger unknown than province or usage.
function biggestAssumption(a: Answers, c: PriceControls, quote: Quote): AdvisorReadItem | null {
  if (quote.quality === 'segment') {
    return {
      kind: 'assumption',
      icon: 'help-circle',
      labelKey: 'read.label.assumption',
      bodyKey: 'read.assume.vehicle',
      shortKey: 'read.short.assume',
    }
  }

  const conf = assessConfidence(a, c, quote)
  const top = conf.openLabelKeys[0]
  if (!top) return null // everything confirmed -> no assumption row
  const bodyKey =
    top === 'flag.area' ? 'read.assume.area' : top === 'flag.usage' ? 'read.assume.usage' : top === 'flag.insured' ? 'read.assume.insured' : 'read.assume.generic'
  return {
    kind: 'assumption',
    icon: 'help-circle',
    labelKey: 'read.label.assumption',
    bodyKey,
    shortKey: 'read.short.assume',
    actionKey: 'read.action.sharpen',
    target: 'sharpen',
  }
}

// 3. Watch out — the most likely regret point. Active user tradeoffs (lower
//    insured, named-driver) rank above generic coverage-tier gaps.
function coverageWarning(_a: Answers, c: PriceControls, quote: Quote): AdvisorReadItem | null {
  const warn = (bodyKey: string, target: AdvisorReadItem['target'], actionKey: string): AdvisorReadItem => ({
    kind: 'warning',
    icon: 'alert-triangle',
    labelKey: 'read.label.warning',
    bodyKey,
    actionKey,
    target,
    severity: 'warning',
  })

  if (c.sumInsured === 'lower') return warn('read.warn.lowerInsured', 'sharpen', 'read.action.sharpen')
  if (c.namedDriver !== 'any') {
    const warnKey = c.namedDriver === 'any30' ? 'read.warn.any30' : c.namedDriver === 'any25' ? 'read.warn.any25' : 'read.warn.named'
    return warn(warnKey, 'named', 'read.action.adjust')
  }
  if (quote.coverage === 'type_3_plus') return warn('read.warn.type3plus', 'plans', 'read.action.seePlans')
  if (quote.coverage === 'type_2_plus') return warn('read.warn.type2plus', 'plans', 'read.action.seePlans')
  if (c.repairPref === 'garage') return warn('read.warn.garage', 'plans', 'read.action.seePlans')
  return null
}

export function buildAdvisorRead(a: Answers, c: PriceControls, quote: Quote): AdvisorReadItem[] {
  // Commercial / delivery: don't optimize price — pivot to advisor-confirm (§30.5).
  if (assessConfidence(a, c, quote).commercial) {
    return [
      {
        kind: 'warning',
        icon: 'user-shield',
        labelKey: 'read.label.warning',
        bodyKey: 'read.warn.commercial',
        shortKey: 'read.short.commercial',
        actionKey: 'read.action.seePlans',
        target: 'plans',
        severity: 'warning',
      },
    ]
  }

  return [bestSaving(a, c, quote), biggestAssumption(a, c, quote), coverageWarning(a, c, quote)].filter(
    (x): x is AdvisorReadItem => x !== null,
  )
}
