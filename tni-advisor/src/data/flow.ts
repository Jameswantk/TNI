import type { Answers } from '../types'

// The 3-tap core intake (project memory 27.1). Only these are asked in chat:
// car (brand -> model -> year), coverage goal, driver age. Everything else —
// province, NCB, repair, dashcam, excess, mileage — is tuned interactively in
// the live price rail AFTER the first estimate, not asked as chat questions.

export interface FlowOption {
  value: string
  labelKey: string
}

// step kinds: 'brand'/'model' drive the cascading catalog picker; 'year' and
// 'chips' are quick-reply options; 'text' is a free typed answer.
export type StepKind = 'brand' | 'model' | 'chips'

export interface FlowStep {
  id: keyof Answers
  promptKey: string
  kind: StepKind
  options?: FlowOption[]
  allowNotSure?: boolean
}

export const flow: FlowStep[] = [
  { id: 'carBrand', promptKey: 'q.carBrand', kind: 'brand' },
  { id: 'carModel', promptKey: 'q.carModel', kind: 'model' },
  {
    id: 'carYear',
    promptKey: 'q.carYear',
    kind: 'chips',
    options: [
      { value: 'new', labelKey: 'opt.year.new' },
      { value: 'mid', labelKey: 'opt.year.mid' },
      { value: 'old', labelKey: 'opt.year.old' },
    ],
    allowNotSure: true,
  },
  {
    id: 'coverageStyle',
    promptKey: 'q.coverageStyle',
    kind: 'chips',
    options: [
      { value: 'best', labelKey: 'opt.cov.best' },
      { value: 'value', labelKey: 'opt.cov.value' },
      { value: 'cheap', labelKey: 'opt.cov.cheap' },
      { value: 'unsure', labelKey: 'opt.cov.unsure' },
    ],
  },
  {
    id: 'driverAge',
    promptKey: 'q.driverAge',
    kind: 'chips',
    options: [
      { value: '18-24', labelKey: 'opt.age.1' },
      { value: '25-35', labelKey: 'opt.age.2' },
      { value: '36-50', labelKey: 'opt.age.3' },
      { value: '50+', labelKey: 'opt.age.4' },
    ],
  },
]

export const CORE_FIELDS: (keyof Answers)[] = [
  'carBrand',
  'carModel',
  'carYear',
  'coverageStyle',
  'driverAge',
]

export function isCoreComplete(answers: Answers): boolean {
  return CORE_FIELDS.every((f) => answers[f] !== undefined)
}

// The 4 stepper milestones (project memory 27.8): Car, Cover, Driver, Tune.
export type StepKey = 'car' | 'cover' | 'driver' | 'tune'

export function stepStatus(answers: Answers, atTune: boolean) {
  const carDone = !!(answers.carBrand && answers.carModel && answers.carYear)
  const coverDone = !!answers.coverageStyle
  const driverDone = !!answers.driverAge
  return { carDone, coverDone, driverDone, atTune }
}
