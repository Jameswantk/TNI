import { useEffect, useMemo, useRef, useState } from 'react'
import type { Answers, Lang, Lead, PlanId, PriceControls, Stage } from './types'
import { defaultControls } from './types'
import { flow, isCoreComplete, type StepKey } from './data/flow'
import { resolveVehicleGroup, isEvVehicle } from './data/catalog'
import { translate } from './data/i18n'
import { assessConfidence, headlineQuote, headlineRepair, recommendPlans } from './lib/pricing'
import { makeReference } from './data/mockDb'
import { dataLastUpdated } from './data/pricingData'
import { Header } from './components/Header'
import { Stepper } from './components/Stepper'
import { ChatPanel, type AnswerMeta } from './components/ChatPanel'
import { PriceRail } from './components/PriceRail'
import { ResultsPanel } from './components/ResultsPanel'
import { ClaimCalculator } from './components/ClaimCalculator'
import { extractOneShotIntake, type OneShotDraft } from './lib/aiAdvisor'

const baht = (n: number) => '฿' + n.toLocaleString()

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [controls, setControls] = useState<PriceControls>(defaultControls)
  const [stage, setStage] = useState<Stage>('intake')
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('value')
  const [reference, setReference] = useState('')
  const [lead, setLead] = useState<Lead | null>(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [oneShotDraft, setOneShotDraft] = useState<OneShotDraft | null>(null)

  const t = (key: string, params?: Record<string, string>) => translate(lang, key, params)

  const coreComplete = isCoreComplete(answers)
  const intakeActive = stage === 'intake'
  const atTune = stage === 'tune' || stage === 'recommendations' || stage === 'lead' || stage === 'confirmed'

  const quote = useMemo(() => headlineQuote(answers, controls), [answers, controls])
  const quoteConfidence = useMemo(() => assessConfidence(answers, controls, quote), [answers, controls, quote])
  const recs = useMemo(() => recommendPlans(answers, controls), [answers, controls])
  const selectedPlan = recs.find((r) => r.id === selectedPlanId)

  // Count the five actual required answers before the indicative price appears.
  const requiredDone =
    (answers.carBrand ? 1 : 0) +
    (answers.carModel ? 1 : 0) +
    (answers.carYear ? 1 : 0) +
    (answers.coverageStyle ? 1 : 0) +
    (answers.driverAge ? 1 : 0)
  const requiredTotal = 5

  function nextOpenStep(next: Answers, afterIndex: number) {
    for (let i = afterIndex + 1; i < flow.length; i++) {
      if (next[flow[i].id] === undefined) return i
    }
    for (let i = 0; i < flow.length; i++) {
      if (next[flow[i].id] === undefined) return i
    }
    return flow.length
  }

  function moveAfterAnswer(next: Answers, fromIndex: number) {
    if (isCoreComplete(next)) {
      setStepIndex(flow.length)
      setStage('tune')
      return
    }
    setStepIndex(nextOpenStep(next, fromIndex))
    setStage('intake')
  }

  function moveAfterBulkAnswers(next: Answers) {
    if (isCoreComplete(next)) {
      setStepIndex(flow.length)
      setStage('tune')
      return
    }
    setStepIndex(nextOpenStep(next, -1))
    setStage('intake')
  }

  function clearForEdit(current: Answers, targetIndex: number): Answers {
    const field = flow[targetIndex]?.id
    const next: Answers = { ...current }

    if (field === 'carBrand') {
      next.carBrand = undefined
      next.carModel = undefined
      next.vehicleGroup = undefined
      next.isEv = undefined
      next.carYear = undefined
    } else if (field === 'carModel') {
      next.carModel = undefined
      next.vehicleGroup = undefined
      next.isEv = undefined
    } else if (field === 'carYear') {
      next.carYear = undefined
    } else if (field === 'coverageStyle') {
      next.coverageStyle = undefined
    } else if (field === 'driverAge') {
      next.driverAge = undefined
    }

    return next
  }

  function editAnswer(targetIndex: number) {
    if (targetIndex < 0 || targetIndex >= flow.length) return
    setAnswers((a) => clearForEdit(a, targetIndex))
    setStepIndex(targetIndex)
    setStage('intake')
    setReference('')
    setLead(null)
    setOneShotDraft(null)
  }

  function onBackAnswer() {
    const answered = flow
      .map((step, i) => (answers[step.id] !== undefined ? i : -1))
      .filter((i) => i >= 0 && (stage !== 'intake' || i < stepIndex))
    const target = answered[answered.length - 1]
    if (target !== undefined) editAnswer(target)
  }

  function onStepClick(step: StepKey) {
    if (step === 'car' && answers.carBrand) editAnswer(0)
    if (step === 'cover' && answers.coverageStyle) editAnswer(3)
    if (step === 'driver' && answers.driverAge) editAnswer(4)
    if (step === 'tune' && coreComplete) {
      setStepIndex(flow.length)
      setStage('tune')
    }
  }

  function onAnswer(value: string, meta?: AnswerMeta) {
    if (stage !== 'intake') return
    const step = flow[stepIndex]
    const next: Answers = { ...answers, [step.id]: value }

    if (step.id === 'carBrand') {
      // A different brand invalidates the dependent vehicle identity.
      next.carModel = undefined
      next.vehicleGroup = undefined
      next.isEv = undefined
      next.carYear = undefined
    }
    if (step.id === 'carModel') {
      next.vehicleGroup = meta?.vehicleGroup ?? resolveVehicleGroup(answers.carBrand, value)
      next.isEv = meta?.isEv ?? isEvVehicle(answers.carBrand, value)
    }

    setAnswers(next)
    setOneShotDraft(null)

    // Align the repair channel with the chosen coverage goal (user can flip it).
    if (step.id === 'coverageStyle') {
      setControls((c) => ({ ...c, repairPref: headlineRepair({ coverageStyle: value } as Answers) }))
    }

    moveAfterAnswer(next, stepIndex)
  }

  function onNaturalIntake(text: string) {
    setOneShotDraft(extractOneShotIntake(text, t))
  }

  function onConfirmNaturalIntake() {
    if (!oneShotDraft) return
    const next: Answers = { ...answers, ...oneShotDraft.answers }
    setAnswers(next)
    setControls((c) => ({ ...c, ...oneShotDraft.controls }))
    setOneShotDraft(null)
    moveAfterBulkAnswers(next)
  }

  function patchControls(patch: Partial<PriceControls>) {
    setControls((c) => ({ ...c, ...patch }))
  }

  function onInterested(id: PlanId) {
    setSelectedPlanId(id)
    setStage('lead')
  }

  function onSubmitLead(submitted: Lead) {
    const enrichedLead: Lead = {
      ...submitted,
      quoteContext: {
        answers,
        controls,
        confidence: quoteConfidence,
        commercial: quoteConfidence.commercial,
      },
    }
    console.info('TNI lead quote context', enrichedLead.quoteContext)
    setLead(enrichedLead)
    setReference(makeReference())
    setStage('confirmed')
  }

  function onRestart() {
    setAnswers({})
    setControls(defaultControls)
    setStepIndex(0)
    setStage('intake')
    setSelectedPlanId('value')
    setReference('')
    setLead(null)
    setOneShotDraft(null)
  }

  const showRail = stage === 'tune'
  const showResults = stage === 'recommendations' || stage === 'lead' || stage === 'confirmed'

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="app">
      <Header t={t} lang={lang} onToggleLang={() => setLang(lang === 'en' ? 'th' : 'en')} onOpenClaim={() => setClaimOpen(true)} />
      <section className="brand-ribbon" aria-label={t('brand.ribbonAria')}>
        <div className="brand-ribbon-main">
          <span className="brand-ribbon-kicker">{t('brand.ribbonKicker')}</span>
          <strong>{t('brand.ribbonTitle')}</strong>
        </div>
        <div className="brand-proof">
          <span><i className="ti ti-car" aria-hidden="true" /> {t('brand.proof.motor')}</span>
          <span><i className="ti ti-headset" aria-hidden="true" /> {t('brand.proof.claims')}</span>
          <span><i className="ti ti-phone" aria-hidden="true" /> {t('brand.proof.hotline')}</span>
        </div>
      </section>
      <Stepper t={t} answers={answers} atTune={atTune} onStepClick={onStepClick} />

      <div className="app-body">
        <ChatPanel
          t={t}
          answers={answers}
          stepIndex={stepIndex}
          intakeActive={intakeActive}
          tuneActive={stage === 'tune'}
          onAnswer={onAnswer}
          onBack={onBackAnswer}
          onEditAnswer={editAnswer}
          oneShotDraft={oneShotDraft}
          onNaturalIntake={onNaturalIntake}
          onConfirmNaturalIntake={onConfirmNaturalIntake}
          onCancelNaturalIntake={() => setOneShotDraft(null)}
        />

        <div className="right-pane">
          {intakeActive && !coreComplete && (
            <aside className="results-panel placeholder">
              <div className="ph-icon" aria-hidden="true">
                <i className="ti ti-bolt" />
              </div>
              <p className="ph-text">{t('rail.intro')}</p>
              <div className="ph-progress">
                <div className="ph-bar">
                  <div className="ph-fill" style={{ width: `${(requiredDone / requiredTotal) * 100}%` }} />
                </div>
                <span className="ph-count">{t('rail.progressHint', { done: String(requiredDone), total: String(requiredTotal) })}</span>
              </div>
            </aside>
          )}

          {showRail && (
            <PriceRail
              t={t}
              answers={answers}
              controls={controls}
              quote={quote}
              lastUpdated={dataLastUpdated}
              onControls={patchControls}
              onSeePlans={() => setStage('recommendations')}
            />
          )}

          {showResults && (
            <ResultsPanel
              t={t}
              stage={stage}
              recs={recs}
              answers={answers}
              controls={controls}
              selectedPlan={selectedPlan}
              reference={reference}
              lead={lead}
              onBackToTune={() => setStage('tune')}
              onBackToRecommendations={() => setStage('recommendations')}
              onInterested={onInterested}
              onSubmitLead={onSubmitLead}
              onRestart={onRestart}
              onOpenPrivacy={() => setPrivacyOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Mobile sticky price bar: keeps the live number visible while chat scrolls */}
      {showRail && quote.priced && (
        <div className="mobile-price-bar">
          <div>
            <div className="mpb-label">{t('rail.liveEstimate')}</div>
            <div className="mpb-price">
              {quoteConfidence.commercial ? t('mpb.advisor') : `${baht(quote.median)} · ${t('rail.typical')}`}
            </div>
          </div>
          <button className="cta" type="button" onClick={() => setStage('recommendations')}>
            {t('rail.seePlans')} <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}

      <footer className="app-footer">
        {t('rec.disclaimer')} <span aria-hidden="true">-</span>{' '}
        <a href="#privacy" onClick={(e) => { e.preventDefault(); setPrivacyOpen(true) }}>{t('lead.privacy')}</a>
      </footer>

      {claimOpen && (
        <ClaimCalculator t={t} defaultPremium={quote.median} defaultNcb={controls.ncb} onClose={() => setClaimOpen(false)} />
      )}
      {privacyOpen && <PrivacyModal t={t} onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}

function PrivacyModal({ t, onClose }: { t: (key: string, params?: Record<string, string>) => string; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onClick={onClose}>
      <div ref={modalRef} className="modal privacy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title" id="privacy-title">
            <i className="ti ti-shield-lock" aria-hidden="true" /> {t('privacy.title')}
          </span>
          <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label={t('privacy.close')}>
            <i className="ti ti-x" />
          </button>
        </div>
        <p className="modal-sub">{t('privacy.body')}</p>
        <button className="btn-primary btn-block" type="button" onClick={onClose}>{t('privacy.close')}</button>
      </div>
    </div>
  )
}
