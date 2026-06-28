import { useState } from 'react'
import type { Answers, Lead, PlanId, PlanRecommendation, PriceControls, Stage } from '../types'
import { assessConfidence, insuredValue } from '../lib/pricing'
import { PlanCard } from './PlanCard'
import { LeadForm } from './LeadForm'
import { CoverageCopilot } from './CoverageCopilot'
import { buildPlanAiExplanation } from '../lib/aiAdvisor'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  stage: Stage
  recs: PlanRecommendation[]
  answers: Answers
  controls: PriceControls
  selectedPlan?: PlanRecommendation
  reference: string
  lead: Lead | null
  onBackToTune: () => void
  onBackToRecommendations: () => void
  onInterested: (id: PlanId) => void
  onSubmitLead: (lead: Lead) => void
  onRestart: () => void
  onOpenPrivacy: () => void
}

const baht = (n: number) => '฿' + n.toLocaleString()

// Upgrade delta for the educator: budget -> value, value -> strongest.
function upgradeFor(rec: PlanRecommendation, recs: PlanRecommendation[]) {
  const order: PlanId[] = ['budget', 'value', 'strongest']
  const i = order.indexOf(rec.id)
  if (i < 0 || i >= order.length - 1) return null
  const next = recs.find((r) => r.id === order[i + 1])
  if (!next || !rec.priced || !next.priced) return null
  return { deltaPerYear: Math.max(0, next.median - rec.median), toPlanKey: next.id }
}

export function ResultsPanel(props: Props) {
  const { t, stage, recs, answers, controls, selectedPlan, reference, lead } = props
  const [expandedWhy, setExpandedWhy] = useState<PlanId | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showCopilot, setShowCopilot] = useState(false)
  const currentInsuredValue = insuredValue(answers, controls)
  const highlightedPlan = recs.find((r) => r.recommended) ?? recs[0]
  const otherPlans = recs.filter((r) => r.id !== highlightedPlan?.id)

  function renderPlanCard(rec: PlanRecommendation) {
    const upgrade = upgradeFor(rec, recs)
    return (
      <PlanCard
        key={rec.id}
        t={t}
        rec={rec}
        insuredValue={currentInsuredValue}
        controls={controls}
        commercial={assessConfidence(answers, controls, rec).commercial}
        upgrade={upgrade}
        aiExplanation={buildPlanAiExplanation(t, answers, controls, rec, upgrade)}
        expanded={expandedWhy === rec.id}
        onToggleWhy={() => setExpandedWhy(expandedWhy === rec.id ? null : rec.id)}
        onInterested={() => props.onInterested(rec.id)}
      />
    )
  }

  if (stage === 'recommendations') {
    return (
      <aside className="results-panel">
        <div className="recs-head">
          <button className="btn-link back" onClick={props.onBackToTune}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> {t('rec.back')}
          </button>
          <p className="panel-intro">{t('rec.intro')}</p>
        </div>

        <div className="plan-decision">
          <div className="ai-section-title">
            <i className="ti ti-sparkles" aria-hidden="true" /> {t('plan.decisionTitle', { plan: t('plan.' + highlightedPlan.id) })}
          </div>
          <p>{t('plan.decisionBody', { coverage: t('cov.' + highlightedPlan.coverage) })}</p>
        </div>

        {renderPlanCard(highlightedPlan)}

        <div className="plan-section-title">{t('plan.otherOptions')}</div>
        {otherPlans.map(renderPlanCard)}

        <div className="copilot-drawer">
          <button
            className="copilot-drawer-toggle"
            type="button"
            aria-expanded={showCopilot}
            onClick={() => setShowCopilot(!showCopilot)}
          >
            <span>
              <i className="ti ti-message-question" aria-hidden="true" /> {t('copilot.drawer.title')}
            </span>
            <i className={`ti ti-chevron-${showCopilot ? 'up' : 'down'}`} aria-hidden="true" />
          </button>
          <p>{t('copilot.drawer.body')}</p>
          {showCopilot && <CoverageCopilot t={t} plan={highlightedPlan} />}
        </div>

        <button className="btn-ghost btn-block" onClick={() => setShowCompare(!showCompare)}>
          {t('plan.compare')}
        </button>
        {showCompare && (
          <table className="compare-table">
            <thead>
              <tr>
                <th />
                {recs.map((r) => (
                  <th key={r.id}>{t('plan.' + r.id)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('compare.coverage')}</td>
                {recs.map((r) => (
                  <td key={r.id}>{t('cov.' + r.coverage)}</td>
                ))}
              </tr>
              <tr>
                <td>{t('sum.repair')}</td>
                {recs.map((r) => (
                  <td key={r.id}>{t('repair.' + r.repair)}</td>
                ))}
              </tr>
              <CompareRow t={t} labelKey="compare.ownDamage" recs={recs} check={(r) => hasBenefit(r, 'ownDamage')} />
              <CompareRow t={t} labelKey="compare.theftFire" recs={recs} check={(r) => hasBenefit(r, 'theftFire')} />
              <CompareRow t={t} labelKey="compare.flood" recs={recs} check={(r) => hasBenefit(r, 'flood') || hasBenefit(r, 'floodOpt')} />
              <CompareRow t={t} labelKey="compare.soloAccident" recs={recs} check={(r) => !hasGap(r, 'gapSolo')} />
              <CompareRow t={t} labelKey="compare.dealerRepair" recs={recs} check={(r) => r.repair === 'dealer'} />
              <CompareRow t={t} labelKey="compare.roadside" recs={recs} check={(r) => hasBenefit(r, 'roadside')} />
              <tr>
                <td>{t('conf.estimatedRange')}</td>
                {recs.map((r) => (
                  <td key={r.id}>
                    {assessConfidence(answers, controls, r).commercial
                      ? t('plan.commercialAdvisor')
                      : r.priced
                        ? `${baht(r.min)}-${baht(r.max)}`
                        : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        <p className="disclaimer">
          <i className="ti ti-info-circle" aria-hidden="true" /> {t('rec.disclaimer')}
        </p>
      </aside>
    )
  }

  if (stage === 'lead' && selectedPlan) {
    return (
      <aside className="results-panel">
        <LeadForm
          t={t}
          plan={selectedPlan}
          onBack={props.onBackToRecommendations}
          onSubmit={props.onSubmitLead}
          onOpenPrivacy={props.onOpenPrivacy}
        />
      </aside>
    )
  }

  if (stage === 'confirmed' && selectedPlan && lead) {
    const selectedConfidence = assessConfidence(answers, controls, selectedPlan)
    return (
      <aside className="results-panel">
        <div className="confirm-card">
          <div className="confirm-icon" aria-hidden="true">
            <i className="ti ti-circle-check" />
          </div>
          <p className="confirm-title">{t('conf.title')}</p>
          <div className="confirm-ref">
            <span>{t('conf.ref')}</span>
            <strong>{reference}</strong>
          </div>
          <p className="confirm-window">{t('conf.window')}</p>
          <div className="summary-card">
            <Row label={t('lead.name')} value={lead.name} />
            <Row label={t('lead.phone')} value={lead.phone} />
            <Row label={t('rec.title')} value={t('plan.' + selectedPlan.id)} />
            <Row
              label={t('conf.estimatedRange')}
              value={
                selectedConfidence.commercial
                  ? t('plan.commercialAdvisor')
                  : selectedPlan.priced
                    ? `${baht(selectedPlan.min)}-${baht(selectedPlan.max)}`
                    : t('plan.advisorPrice')
              }
              last
            />
          </div>
          <button className="btn-ghost btn-block" onClick={props.onRestart}>
            {t('conf.again')}
          </button>
        </div>
      </aside>
    )
  }

  return null
}

function hasBenefit(rec: PlanRecommendation, key: string) {
  return rec.benefitKeys.includes(key)
}

function hasGap(rec: PlanRecommendation, key: string) {
  return rec.gapKeys.includes(key)
}

function CompareRow({
  t,
  labelKey,
  recs,
  check,
}: {
  t: (key: string, params?: Record<string, string>) => string
  labelKey: string
  recs: PlanRecommendation[]
  check: (rec: PlanRecommendation) => boolean
}) {
  return (
    <tr>
      <td>{t(labelKey)}</td>
      {recs.map((r) => (
        <td key={r.id} className={check(r) ? 'yes' : 'no'}>
          {check(r) ? t('compare.yes') : t('compare.no')}
        </td>
      ))}
    </tr>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`summary-row${last ? ' last' : ''}`}>
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
    </div>
  )
}
