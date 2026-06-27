import { useState } from 'react'
import type { Lead, PlanRecommendation } from '../types'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  plan: PlanRecommendation
  onBack: () => void
  onSubmit: (lead: Lead) => void
}

export function LeadForm({ t, plan, onBack, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [callback, setCallback] = useState('afternoon')
  const [renewal, setRenewal] = useState('soon')
  const [consent, setConsent] = useState(false)

  const valid = name.trim() !== '' && phone.trim() !== '' && consent

  function submit() {
    if (!valid) return
    onSubmit({ name: name.trim(), phone: phone.trim(), lineId: lineId.trim(), callback, renewal, consent })
  }

  return (
    <div className="lead-form">
      <button className="btn-link back" onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" /> {t('lead.back')}
      </button>
      <p className="lead-intro">{t('lead.intro', { plan: t('plan.' + plan.id) })}</p>

      <label className="field-label" htmlFor="lead-name">{t('lead.name')}</label>
      <input id="lead-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />

      <label className="field-label" htmlFor="lead-phone">{t('lead.phone')}</label>
      <input id="lead-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />

      <div className="field-row">
        <div className="field-col">
          <label className="field-label" htmlFor="lead-line">
            {t('lead.line')} <span className="muted">({t('lead.optional')})</span>
          </label>
          <input id="lead-line" className="field" value={lineId} onChange={(e) => setLineId(e.target.value)} />
        </div>
        <div className="field-col">
          <label className="field-label" htmlFor="lead-callback">{t('lead.callback')}</label>
          <select id="lead-callback" className="field" value={callback} onChange={(e) => setCallback(e.target.value)}>
            <option value="morning">{t('cb.morning')}</option>
            <option value="afternoon">{t('cb.afternoon')}</option>
            <option value="evening">{t('cb.evening')}</option>
            <option value="any">{t('cb.any')}</option>
          </select>
        </div>
      </div>

      <label className="field-label" htmlFor="lead-renewal">{t('lead.renewal')}</label>
      <select id="lead-renewal" className="field" value={renewal} onChange={(e) => setRenewal(e.target.value)}>
        <option value="now">{t('opt.renew.now')}</option>
        <option value="soon">{t('opt.renew.soon')}</option>
        <option value="later">{t('opt.renew.later')}</option>
      </select>

      <label className="consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {t('lead.consent')} <a href="#privacy" onClick={(e) => e.preventDefault()}>{t('lead.privacy')}</a>
        </span>
      </label>

      <button className="btn-primary btn-block" disabled={!valid} onClick={submit}>
        {t('lead.submit')}
      </button>
      <button className="btn-link" onClick={submit} disabled={!valid}>
        {t('lead.human')}
      </button>
    </div>
  )
}
