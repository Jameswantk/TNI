import type { Answers } from '../types'
import { stepStatus, type StepKey } from '../data/flow'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  answers: Answers
  atTune: boolean
  onStepClick: (step: StepKey) => void
}

// Guided progress strip: Car -> Cover -> Driver -> Tune price (project memory
// 27.8). Makes the "3 taps" promise visible and signals where savings happen.
export function Stepper({ t, answers, atTune, onStepClick }: Props) {
  const { carDone, coverDone, driverDone } = stepStatus(answers, atTune)

  const steps = [
    { key: 'car' as StepKey, label: t('step.car'), done: carDone, current: !carDone, clickable: carDone },
    { key: 'cover' as StepKey, label: t('step.cover'), done: coverDone, current: carDone && !coverDone, clickable: coverDone },
    {
      key: 'driver' as StepKey,
      label: t('step.driver'),
      done: driverDone,
      current: coverDone && !driverDone,
      clickable: driverDone,
    },
    { key: 'tune' as StepKey, label: t('step.tune'), done: false, current: atTune, clickable: false },
  ]

  return (
    <div className="stepper" role="list" aria-label={t('step.aria')}>
      {steps.map((s, i) => {
        const state = s.done ? 'done' : s.current ? 'cur' : 'next'
        const content = (
          <>
            <span className="step-bub">
              {s.done ? <i className="ti ti-check" aria-hidden="true" /> : i + 1}
            </span>
            <span className="step-label">{s.label}</span>
          </>
        )
        return (
          <div className="step-wrap" key={s.key} role="listitem">
            {s.clickable ? (
              <button
                className={`step ${state} step-click`}
                type="button"
                onClick={() => onStepClick(s.key)}
                aria-label={t('step.change', { step: s.label })}
              >
                {content}
              </button>
            ) : (
              <span className={`step ${state}`}>{content}</span>
            )}
            {i < steps.length - 1 && <span className="step-rule" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}
