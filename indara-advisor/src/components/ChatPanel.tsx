import { useEffect, useRef, useState } from 'react'
import type { Answers } from '../types'
import { flow, type FlowStep } from '../data/flow'
import { catalog } from '../data/catalog'
import type { OneShotDraft } from '../lib/aiAdvisor'

export interface AnswerMeta {
  vehicleGroup?: string
  isEv?: boolean
}

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  answers: Answers
  stepIndex: number
  intakeActive: boolean
  tuneActive: boolean
  onAnswer: (value: string, meta?: AnswerMeta) => void
  onBack: () => void
  onEditAnswer: (stepIndex: number) => void
  oneShotDraft: OneShotDraft | null
  onNaturalIntake: (text: string) => void
  onConfirmNaturalIntake: () => void
  onCancelNaturalIntake: () => void
}

function answerLabel(step: FlowStep, value: string, t: (key: string) => string): string {
  if (value === 'unsure') return t('opt.notSure')
  if (step.kind === 'brand' || step.kind === 'model') return value
  const opt = step.options?.find((o) => o.value === value)
  return opt ? t(opt.labelKey) : value
}

export function ChatPanel({
  t,
  answers,
  stepIndex,
  intakeActive,
  tuneActive,
  onAnswer,
  onBack,
  onEditAnswer,
  oneShotDraft,
  onNaturalIntake,
  onConfirmNaturalIntake,
  onCancelNaturalIntake,
}: Props) {
  const [text, setText] = useState('')
  const [naturalText, setNaturalText] = useState('')
  const [showNatural, setShowNatural] = useState(false)
  const [freeTextCue, setFreeTextCue] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastStep = Math.min(stepIndex, flow.length - 1)
  const canBack = flow.some((step, i) => answers[step.id] !== undefined && (!intakeActive || i < stepIndex))

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
    setFreeTextCue(false)
  }, [stepIndex, intakeActive, tuneActive])

  function submitText() {
    const v = text.trim()
    if (!v) return
    setText('')
    setFreeTextCue(false)
    onAnswer(v)
  }

  function focusFreeText() {
    setFreeTextCue(true)
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    inputRef.current?.focus()
  }

  function submitNatural() {
    const v = naturalText.trim()
    if (!v) return
    onNaturalIntake(v)
  }

  const rows = []
  for (let i = 0; i <= lastStep; i++) {
    const step = flow[i]
    const value = answers[step.id]
    rows.push(
      <div className="bubble advisor" key={`a-${i}`}>
        {t(step.promptKey)}
      </div>,
    )
    if (value !== undefined && !(intakeActive && i === stepIndex)) {
      const label = answerLabel(step, String(value), t)
      rows.push(
        <div className="answer-wrap" key={`u-${i}`}>
          <button
            className="bubble user answer-bubble"
            type="button"
            onClick={() => onEditAnswer(i)}
            aria-label={t('chat.changeAnswer', { answer: label })}
          >
            {label}
          </button>
          <button className="answer-change" type="button" onClick={() => onEditAnswer(i)}>
            <i className="ti ti-pencil" aria-hidden="true" /> {t('chat.change')}
          </button>
        </div>,
      )
    }
  }

  const current = intakeActive ? flow[stepIndex] : null
  const brandModels =
    current?.kind === 'model'
      ? catalog.find((c) => c.brand.toLowerCase() === (answers.carBrand ?? '').toLowerCase())
          ?.models ?? []
      : []

  return (
    <section className="chat-panel">
      <div className="chat-scroll">
        {rows}

        {canBack && (
          <div className="chat-nav-row">
            <button className="chat-back" type="button" onClick={onBack}>
              <i className="ti ti-arrow-left" aria-hidden="true" /> {t('chat.back')}
            </button>
          </div>
        )}

        {current?.kind === 'brand' && (
          <div className="chip-section">
            <div className="ai-intake-card">
              <button className="ai-intake-toggle" type="button" onClick={() => setShowNatural(!showNatural)}>
                <i className="ti ti-sparkles" aria-hidden="true" /> {t('ai.intake.toggle')}
              </button>
              {showNatural && (
                <div className="ai-intake-body">
                  <textarea
                    value={naturalText}
                    onChange={(e) => setNaturalText(e.target.value)}
                    placeholder={t('ai.intake.placeholder')}
                    rows={3}
                  />
                  <button className="btn-primary btn-small" type="button" onClick={submitNatural}>
                    {t('ai.intake.extract')}
                  </button>
                </div>
              )}
              {oneShotDraft && (
                <div className="ai-draft">
                  <div className="ai-draft-title">
                    <i className="ti ti-checkup-list" aria-hidden="true" /> {t('ai.intake.understood')}
                  </div>
                  {oneShotDraft.understood.map((item) => (
                    <div className="ai-draft-row" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                  {oneShotDraft.needsConfirmation.length > 0 && (
                    <p className="ai-draft-note">{t('ai.intake.confirmNote')}</p>
                  )}
                  <div className="ai-draft-actions">
                    <button className="btn-primary btn-small" type="button" onClick={onConfirmNaturalIntake}>
                      {t('ai.intake.use')}
                    </button>
                    <button className="btn-ghost btn-small" type="button" onClick={onCancelNaturalIntake}>
                      {t('ai.intake.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="chip-label">{t('chip.popularBrands')}</div>
            <div className="chips">
              {catalog.map((b) => (
                <button key={b.brand} className="chip" onClick={() => onAnswer(b.brand)}>
                  {b.brand}
                </button>
              ))}
              <button className="chip chip-muted" onClick={focusFreeText}>
                {t('chip.brandNotListed')}
              </button>
            </div>
            {freeTextCue && <p className="chip-helper focus-cue">{t('chip.typeBrandBelow')}</p>}
          </div>
        )}

        {current?.kind === 'model' && (
          <div className="chip-section">
            {brandModels.length > 0 ? (
              <>
                <div className="chip-label">{t('chip.popularModels')}</div>
                <div className="chips">
                  {brandModels.map((m) => (
                    <button
                      key={m.group}
                      className="chip"
                      onClick={() => onAnswer(m.label, { vehicleGroup: m.group, isEv: m.ev })}
                    >
                      {m.label}
                      {m.ev && <i className="ti ti-bolt chip-ev" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <p className="chip-helper">{t('chip.modelNotListed')}</p>
              </>
            ) : (
              <p className="chip-helper empty">{t('chip.typeModel')}</p>
            )}
          </div>
        )}

        {current?.kind === 'chips' && (
          <div className="chips">
            {current.options?.map((o) => (
              <button key={o.value} className="chip" onClick={() => onAnswer(o.value)}>
                {t(o.labelKey)}
              </button>
            ))}
            {current.allowNotSure && (
              <button className="chip chip-muted" onClick={() => onAnswer('unsure')}>
                {t('opt.notSure')}
              </button>
            )}
          </div>
        )}

        {tuneActive && (
          <div className="bubble advisor chat-wrap">
            <i className="ti ti-arrow-right-circle" aria-hidden="true" /> {t('chat.estimateReady')}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {intakeActive && (current?.kind === 'brand' || current?.kind === 'model') && (
        <div className="chat-input">
          <input
            ref={inputRef}
            type="text"
            value={text}
            placeholder={
              current?.kind === 'brand'
                ? t('chip.brandPlaceholder')
                : current?.kind === 'model'
                  ? t('chip.modelPlaceholder')
                  : t('chip.placeholder')
            }
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitText()}
          />
          <button className="send-btn" onClick={submitText} aria-label={t('send')}>
            <i className="ti ti-send" />
          </button>
        </div>
      )}
    </section>
  )
}
