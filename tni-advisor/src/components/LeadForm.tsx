import { useRef, useState } from 'react'
import type { Lead, PlanRecommendation } from '../types'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  plan: PlanRecommendation
  onBack: () => void
  onSubmit: (lead: Lead) => void
  onOpenPrivacy: () => void
}

export function LeadForm({ t, plan, onBack, onSubmit, onOpenPrivacy }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [callback, setCallback] = useState('afternoon')
  const [renewal, setRenewal] = useState('soon')
  const [consent, setConsent] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [touched, setTouched] = useState({ name: false, phone: false, consent: false })
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  const phoneDigits = phone.replace(/\D/g, '')
  const phoneOk = phoneDigits.length >= 7 && /^[0-9+\-\s()]+$/.test(phone.trim())
  const valid = name.trim() !== '' && phoneOk && consent

  function submit() {
    setAttempted(true)
    if (!valid) {
      if (name.trim() === '') nameRef.current?.focus()
      else if (!phoneOk) phoneRef.current?.focus()
      else consentRef.current?.focus()
      return
    }
    onSubmit({ name: name.trim(), phone: phone.trim(), lineId: lineId.trim(), callback, renewal, consent })
  }

  const showNameHint = (attempted || touched.name) && name.trim() === ''
  const showPhoneHint = (attempted || touched.phone) && !phoneOk
  const showConsentHint = (attempted || touched.consent) && !consent

  return (
    <div className="lead-form">
      <button className="btn-link back" onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" /> {t('lead.back')}
      </button>
      <p className="lead-intro">{t('lead.intro', { plan: t('plan.' + plan.id) })}</p>

      <label className="field-label" htmlFor="lead-name">{t('lead.name')}</label>
      <input ref={nameRef} id="lead-name" className="field" value={name} onBlur={() => setTouched((x) => ({ ...x, name: true }))} onChange={(e) => setName(e.target.value)} />
      {showNameHint && <p className="field-hint">{t('lead.nameHint')}</p>}

      <label className="field-label" htmlFor="lead-phone">{t('lead.phone')}</label>
      <input ref={phoneRef} id="lead-phone" className="field" value={phone} onBlur={() => setTouched((x) => ({ ...x, phone: true }))} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      {showPhoneHint && <p className="field-hint">{t('lead.phoneHint')}</p>}

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
        <input ref={consentRef} type="checkbox" checked={consent} onBlur={() => setTouched((x) => ({ ...x, consent: true }))} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {t('lead.consent')} <a href="#privacy" onClick={(e) => { e.preventDefault(); onOpenPrivacy() }}>{t('lead.privacy')}</a>
        </span>
      </label>
      {showConsentHint && <p className="field-hint">{t('lead.consentHint')}</p>}

      <button className={`btn-primary btn-block${valid ? '' : ' is-incomplete'}`} type="button" onClick={submit}>
        {t('lead.submit')}
      </button>
    </div>
  )
}
