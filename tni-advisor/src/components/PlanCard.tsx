import type { PlanRecommendation, PriceControls } from '../types'
import type { PlanAiExplanation } from '../lib/aiAdvisor'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  rec: PlanRecommendation
  insuredValue: number
  controls: PriceControls
  commercial: boolean
  expanded: boolean
  aiExplanation: PlanAiExplanation
  upgrade?: { deltaPerYear: number; toPlanKey: string } | null
  onToggleWhy: () => void
  onInterested: () => void
}

const baht = (n: number) => '฿' + n.toLocaleString()

function assumptionChips(t: Props['t'], controls: PriceControls) {
  const chips: string[] = []
  if (controls.ncb !== 'none' && controls.ncb !== 'unsure') chips.push(`${t('ctrl.ncb')}: ${t('ncb.' + controls.ncb)}`)
  if (controls.namedDriver !== 'any') chips.push(t('named.' + controls.namedDriver))
  if (controls.dashcam) chips.push(t('ctrl.dashcam'))
  if (controls.higherExcess) chips.push(t('ctrl.excess'))
  if (controls.mileage !== 'unsure') chips.push(`${t('ctrl.mileage')}: ${t('mile.' + controls.mileage)}`)
  if (controls.province) chips.push(t('opt.prov.' + controls.province))
  return chips
}

export function PlanCard({ t, rec, insuredValue, controls, commercial, expanded, aiExplanation, upgrade, onToggleWhy, onInterested }: Props) {
  const assumptions = assumptionChips(t, controls)
  return (
    <div className={`plan-card${rec.recommended ? ' featured' : ''}`}>
      {rec.recommended && <span className="plan-badge">{t('plan.recommended')}</span>}
      <div className="plan-head">
        <span className="plan-name">{t('plan.' + rec.id)}</span>
        <span className="plan-meta">
          {t('cov.' + rec.coverage)} · {t('repair.' + rec.repair)}
        </span>
      </div>

      {commercial ? (
        <div className="plan-advisor-price commercial">
          <i className="ti ti-user-shield" aria-hidden="true" /> {t('plan.commercialAdvisor')}
        </div>
      ) : rec.priced ? (
        <div className="plan-price">
          {baht(rec.min)} – {baht(rec.max)}
          <span className="plan-per"> {t('plan.perYear')}</span>
          {rec.confidence === 'low' && <span className="rough-tag">{t('plan.roughEstimate')}</span>}
        </div>
      ) : (
        <div className="plan-advisor-price">
          <i className="ti ti-user-question" aria-hidden="true" /> {t('plan.advisorPrice')}
        </div>
      )}

      <div className="plan-insured">
        <i className="ti ti-shield-half" aria-hidden="true" /> {t('plan.insuredValue', { v: insuredValue.toLocaleString() })}
      </div>

      {assumptions.length > 0 && (
        <div className="plan-assumptions" aria-label={t('plan.assumptions')}>
          {assumptions.slice(0, 4).map((a) => (
            <span className="assumption-chip" key={a}>{a}</span>
          ))}
        </div>
      )}

      <div className="benefit-chips">
        {rec.benefitKeys.map((b) => (
          <span className="benefit-chip" key={b}>
            <i className="ti ti-check" aria-hidden="true" /> {t('benefit.' + b)}
          </span>
        ))}
      </div>

      {/* Coverage-gap educator: what this tier does NOT cover (project memory §25) */}
      {rec.gapKeys.length > 0 && (
        <div className="gap-row">
          <span className="gap-label">{t('plan.notCovered')}</span>
          {rec.gapKeys.map((g) => (
            <span className="gap-chip" key={g}>
              <i className="ti ti-x" aria-hidden="true" /> {t('gap.' + g)}
            </span>
          ))}
        </div>
      )}

      {commercial && (
        <div className="gap-row">
          <span className="gap-chip caveat">
            <i className="ti ti-alert-triangle" aria-hidden="true" /> {t('plan.commercialCaveat')}
          </span>
        </div>
      )}

      {!commercial && upgrade && upgrade.deltaPerYear > 0 && (
        <p className="upgrade-delta">
          <i className="ti ti-arrow-up-circle" aria-hidden="true" />{' '}
          {t('plan.upgradeDelta', {
            amount: baht(upgrade.deltaPerYear),
            plan: t('plan.' + upgrade.toPlanKey),
          })}
        </p>
      )}

      {expanded && (
        <div className="ai-plan-explain">
          <div className="ai-section-title">
            <i className="ti ti-sparkles" aria-hidden="true" /> {t('ai.plan.title')}
          </div>
          <p>{aiExplanation.summary}</p>
          <ul className="why-list">
            {aiExplanation.whyItFits.slice(0, 2).map((w) => (
              <li key={w}>{w}</li>
            ))}
            {aiExplanation.watchOut.slice(0, 1).map((w) => (
              <li className="watch" key={w}>{w}</li>
            ))}
            {aiExplanation.upgradeNote && <li>{aiExplanation.upgradeNote}</li>}
          </ul>
          <p className="ai-safe-note">{t('ai.safeNote')}</p>
        </div>
      )}

      <div className="plan-actions">
        <button className="btn-ghost" type="button" aria-expanded={expanded} onClick={onToggleWhy}>
          {t('ai.plan.button')}
        </button>
        <button className="btn-primary" type="button" onClick={onInterested}>
          {commercial ? t('lead.human') : t('plan.interested')}
        </button>
      </div>
    </div>
  )
}
