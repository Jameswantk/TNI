import type {
  Answers,
  ConfidenceAssessment,
  Lead,
  NcbLevel,
  PlanRecommendation,
  PriceControls,
} from '../types'
import { catalog, resolveVehicleGroup, isEvVehicle } from '../data/catalog'

type T = (key: string, params?: Record<string, string>) => string

const baht = (n: number) => '฿' + Math.round(n).toLocaleString()

export interface OneShotDraft {
  answers: Partial<Answers>
  controls: Partial<PriceControls>
  understood: { label: string; value: string; confidence: 'high' | 'medium' | 'low' }[]
  needsConfirmation: string[]
  sourceText: string
}

export interface PlanAiExplanation {
  summary: string
  whyItFits: string[]
  watchOut: string[]
  upgradeNote?: string
}

export interface CoverageAnswer {
  answer: string
  citations: string[]
  escalate?: boolean
}

export interface AdvisorBrief {
  customerContext: string[]
  quoteContext: string[]
  confirmNext: string[]
  suggestedOpening: string
}

function clean(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}+ ]/gu, ' ')
}

function labelForOption(t: T, prefix: string, value?: string) {
  return value ? t(`${prefix}.${value}`) : t('ai.unknown')
}

function findBrand(text: string) {
  const lower = clean(text)
  return catalog.find((b) => lower.includes(b.brand.toLowerCase()))?.brand
}

function findModel(text: string, brand?: string) {
  if (!brand) return undefined
  const lower = clean(text)
  const entry = catalog.find((b) => b.brand.toLowerCase() === brand.toLowerCase())
  return entry?.models.find((m) => lower.includes(m.label.toLowerCase()))?.label
}

function inferYear(text: string): Answers['carYear'] | undefined {
  const lower = clean(text)
  if (/\b(2024|2025|2026|new|ใหม่)\b/.test(lower)) return 'new'
  if (/\b(2021|2022|2023|2 years?|3 years?|4 years?|สองปี|สามปี)\b/.test(lower)) return 'mid'
  if (/\b(2020|2019|2018|5 years?|6 years?|7 years?|8 years?|9 years?|10 years?|older|เก่า)\b/.test(lower)) return 'old'
  if (/\bold\b/.test(lower) && !/\b[1-4] years? old\b/.test(lower)) return 'old'
  return undefined
}

function inferCoverage(text: string): Answers['coverageStyle'] | undefined {
  const lower = clean(text)
  if (/(best|strong|type 1|ชั้น 1|คุ้มครองดีที่สุด)/.test(lower)) return 'best'
  if (/(cheap|budget|lowest|ประหยัด|ถูก)/.test(lower)) return 'cheap'
  if (/(value|balanced|good|คุ้ม|กลาง)/.test(lower)) return 'value'
  return undefined
}

function inferDriverAge(text: string): Answers['driverAge'] | undefined {
  const m = clean(text).match(/\b([1-8][0-9])\b/)
  if (!m) return undefined
  const age = Number(m[1])
  if (age < 25) return '18-24'
  if (age <= 35) return '25-35'
  if (age <= 50) return '36-50'
  return '50+'
}

function inferProvince(text: string): PriceControls['province'] | undefined {
  const lower = clean(text)
  if (/(bangkok|bkk|กรุงเทพ)/.test(lower)) return 'bangkok'
  if (/(chiang mai|north|เหนือ)/.test(lower)) return 'north'
  if (/(phuket|surat|south|ใต้)/.test(lower)) return 'south'
  if (/(khon kaen|ubon|northeast|isan|อีสาน)/.test(lower)) return 'northeast'
  if (/(central|กลาง|chonburi|rayong|ayutthaya)/.test(lower)) return 'central'
  return undefined
}

function inferNcb(text: string): NcbLevel | undefined {
  const lower = clean(text)
  if (/(no claim|no claims|claim free|ไม่เคลม)/.test(lower)) {
    if (/(4|5|four|five|\+|หลาย)/.test(lower)) return '4plus'
    if (/(3|three)/.test(lower)) return '3'
    if (/(2|two)/.test(lower)) return '2'
    if (/(1|one)/.test(lower)) return '1'
    return 'unsure'
  }
  return undefined
}

export function extractOneShotIntake(text: string, t: T): OneShotDraft {
  const brand = findBrand(text)
  const model = findModel(text, brand)
  const year = inferYear(text)
  const coverageStyle = inferCoverage(text)
  const driverAge = inferDriverAge(text)
  const province = inferProvince(text)
  const ncb = inferNcb(text)
  const answers: Partial<Answers> = { carBrand: brand, carModel: model, carYear: year, coverageStyle, driverAge }
  const controls: Partial<PriceControls> = {}
  if (province) controls.province = province
  if (ncb) controls.ncb = ncb
  if (brand && model) {
    answers.vehicleGroup = resolveVehicleGroup(brand, model)
    answers.isEv = isEvVehicle(brand, model)
  }

  const understood = [
    { label: t('ai.field.car'), value: [brand, model].filter(Boolean).join(' ') || t('ai.unknown'), confidence: brand && model ? 'high' : brand ? 'medium' : 'low' },
    { label: t('ai.field.year'), value: labelForOption(t, 'opt.year', year), confidence: year ? 'medium' : 'low' },
    { label: t('ai.field.cover'), value: labelForOption(t, 'opt.cov', coverageStyle), confidence: coverageStyle ? 'medium' : 'low' },
    { label: t('ai.field.driver'), value: labelForOption(t, 'opt.age', driverAge === '18-24' ? '1' : driverAge === '25-35' ? '2' : driverAge === '36-50' ? '3' : driverAge === '50+' ? '4' : undefined), confidence: driverAge ? 'medium' : 'low' },
  ] as OneShotDraft['understood']

  if (province) understood.push({ label: t('ai.field.area'), value: t(`opt.prov.${province}`), confidence: 'medium' })
  if (ncb) understood.push({ label: t('ai.field.ncb'), value: t(`ncb.${ncb}`), confidence: ncb === 'unsure' ? 'low' : 'medium' })

  return {
    answers,
    controls,
    understood,
    sourceText: text,
    needsConfirmation: understood.filter((x) => x.confidence !== 'high').map((x) => x.label),
  }
}

export function buildPlanAiExplanation(
  t: T,
  answers: Answers,
  controls: PriceControls,
  rec: PlanRecommendation,
  upgrade?: { deltaPerYear: number; toPlanKey: string } | null,
): PlanAiExplanation {
  const car = [answers.carBrand, answers.carModel].filter(Boolean).join(' ') || t('ai.thisCar')
  const cover = t(`cov.${rec.coverage}`)
  const repair = t(`repair.${rec.repair}`)
  const range = rec.priced ? `${baht(rec.min)}-${baht(rec.max)}` : t('plan.advisorPrice')
  const gaps = rec.gapKeys.map((g) => t(`gap.${g}`))
  const whyItFits = [
    t('ai.plan.fit.car', { car, cover, range }),
    t('ai.plan.fit.repair', { repair }),
  ]
  if (controls.ncb !== 'none' && controls.ncb !== 'unsure') whyItFits.push(t('ai.plan.fit.ncb', { ncb: t(`ncb.${controls.ncb}`) }))
  if (controls.province) whyItFits.push(t('ai.plan.fit.area', { area: t(`opt.prov.${controls.province}`) }))

  const watchOut = gaps.length
    ? [t('ai.plan.watch.gaps', { gaps: gaps.slice(0, 3).join(', ') })]
    : [t('ai.plan.watch.strongest')]

  return {
    summary: t('ai.plan.summary', { plan: t(`plan.${rec.id}`), car, cover }),
    whyItFits,
    watchOut,
    upgradeNote: upgrade && upgrade.deltaPerYear > 0 ? t('ai.plan.upgrade', { amount: baht(upgrade.deltaPerYear), plan: t(`plan.${upgrade.toPlanKey}`) }) : undefined,
  }
}

export function answerCoverageQuestion(t: T, question: string, rec?: PlanRecommendation): CoverageAnswer {
  const q = clean(question)
  const citations = new Set<string>()
  const add = (c: string) => citations.add(c)
  let answer = ''
  let escalate = false

  if (/(type 1|type 2|2\\+|3\\+|difference|ต่าง|ชั้น)/.test(q)) {
    add(t('ai.cite.coverageTiers'))
    answer = t('ai.answer.tiers')
  } else if (/(drive|driver|wife|husband|spouse|under 30|under 25|ขับ|แฟน|ภรรยา)/.test(q)) {
    add(t('ai.cite.driverRules'))
    answer = t('ai.answer.driver')
  } else if (/(garage|dealer|repair|ศูนย์|อู่)/.test(q)) {
    add(t('ai.cite.repair'))
    answer = t('ai.answer.repair')
  } else if (/(claim|accident|solo|flood|theft|fire|cover|not cover|surprise|เคลม|คุ้มครอง)/.test(q)) {
    add(t('ai.cite.coverageGaps'))
    const gaps = rec?.gapKeys?.map((g) => t(`gap.${g}`)).join(', ')
    answer = gaps ? t('ai.answer.gapsForPlan', { gaps }) : t('ai.answer.gapsGeneral')
  } else {
    add(t('ai.cite.handoff'))
    answer = t('ai.answer.escalate')
    escalate = true
  }

  return { answer, citations: Array.from(citations), escalate }
}

export function buildAdvisorBrief(
  t: T,
  answers: Answers,
  controls: PriceControls,
  rec: PlanRecommendation,
  confidence: ConfidenceAssessment,
  lead: Lead,
  reference: string,
): AdvisorBrief {
  const car = [answers.carBrand, answers.carModel, answers.carYear ? labelForOption(t, 'opt.year', answers.carYear) : ''].filter(Boolean).join(' ')
  const assumptions = confidence.flags
    .filter((f) => f.status !== 'confirmed')
    .map((f) => t(f.labelKey))
  return {
    customerContext: [
      t('ai.brief.customer', { name: lead.name, phone: lead.phone }),
      t('ai.brief.vehicle', { car: car || t('ai.unknown') }),
      t('ai.brief.intent', { plan: t(`plan.${rec.id}`), renewal: t(`opt.renew.${lead.renewal}`) }),
    ],
    quoteContext: [
      t('ai.brief.price', { price: rec.priced ? `${baht(rec.min)}-${baht(rec.max)}` : t('plan.advisorPrice'), confidence: t(`est.conf.${confidence.level}`) }),
      t('ai.brief.coverage', { coverage: t(`cov.${rec.coverage}`), repair: t(`repair.${rec.repair}`) }),
      t('ai.brief.controls', { ncb: t(`ncb.${controls.ncb}`), driver: t(`named.${controls.namedDriver}`) }),
    ],
    confirmNext: [
      assumptions.length ? t('ai.brief.assumptions', { items: assumptions.join(', ') }) : t('ai.brief.noAssumptions'),
      t('ai.brief.finalPrice'),
      rec.gapKeys.length ? t('ai.brief.gaps', { gaps: rec.gapKeys.map((g) => t(`gap.${g}`)).join(', ') }) : t('ai.brief.gapsNone'),
    ],
    suggestedOpening: t('ai.brief.opening', { name: lead.name || t('ai.customer'), reference }),
  }
}
