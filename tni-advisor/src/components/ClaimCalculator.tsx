import { useEffect, useRef, useState } from 'react'
import type { NcbLevel } from '../types'
import { evaluateClaim } from '../lib/pricing'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  defaultPremium: number
  defaultNcb: NcbLevel
  onClose: () => void
}

const baht = (n: number) => '฿' + Math.round(n).toLocaleString()
const NCB_LEVELS: NcbLevel[] = ['none', '1', '2', '3', '4plus']

// "Should I claim?" decision calculator (project memory 28.1). Educational only —
// indicative, NOT claims handling or financial advice (compliance §14).
export function ClaimCalculator({ t, defaultPremium, defaultNcb, onClose }: Props) {
  const [repairCost, setRepairCost] = useState(10000)
  const [ncb, setNcb] = useState<NcbLevel>(defaultNcb === 'unsure' ? 'none' : defaultNcb)
  const [excess, setExcess] = useState(0)
  const [atFault, setAtFault] = useState(true)
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

  const r = evaluateClaim({
    repairCost,
    annualPremium: defaultPremium || 14000,
    ncb,
    excess,
    atFault,
  })

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="claim-title" onClick={onClose}>
      <div ref={modalRef} className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title" id="claim-title">
            <i className="ti ti-calculator" aria-hidden="true" /> {t('claim.title')}
          </span>
          <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label={t('claim.close')}>
            <i className="ti ti-x" />
          </button>
        </div>
        <p className="modal-sub">{t('claim.intro')}</p>

        <label className="field-label" htmlFor="claim-repair">{t('claim.repairCost')}</label>
        <div className="slider-row">
          <input
            id="claim-repair"
            type="range"
            min={2000}
            max={120000}
            step={1000}
            value={repairCost}
            aria-label={t('claim.repairCost')}
            onChange={(e) => setRepairCost(Number(e.target.value))}
          />
          <span className="slider-val">{baht(repairCost)}</span>
        </div>

        <label className="field-label">{t('claim.fault')}</label>
        <div className="mini-row wrap">
          <button className={`mini ${atFault ? 'sel' : ''}`} type="button" aria-pressed={atFault} onClick={() => setAtFault(true)}>
            {t('claim.atFault')}
          </button>
          <button className={`mini ${!atFault ? 'sel' : ''}`} type="button" aria-pressed={!atFault} onClick={() => setAtFault(false)}>
            {t('claim.notAtFault')}
          </button>
        </div>

        <label className="field-label">{t('claim.ncb')}</label>
        <div className="mini-row wrap">
          {NCB_LEVELS.map((lvl) => (
            <button key={lvl} className={`mini ${ncb === lvl ? 'sel' : ''}`} type="button" aria-pressed={ncb === lvl} onClick={() => setNcb(lvl)}>
              {t('ncb.' + lvl)}
            </button>
          ))}
        </div>

        <label className="field-label">{t('claim.excess')}</label>
        <div className="mini-row wrap">
          {[0, 2000, 5000].map((x) => (
            <button key={x} className={`mini ${excess === x ? 'sel' : ''}`} type="button" aria-pressed={excess === x} onClick={() => setExcess(x)}>
              {x === 0 ? t('claim.noExcess') : baht(x)}
            </button>
          ))}
        </div>

        <div className={`claim-verdict ${r.shouldClaim ? 'claim' : 'pocket'}`}>
          <i className={`ti ti-${r.shouldClaim ? 'shield-check' : 'wallet'}`} aria-hidden="true" />
          <div>
            <strong>{r.shouldClaim ? t('claim.doClaim') : t('claim.payPocket')}</strong>
            <span>{t('claim.byAbout', { amount: baht(r.saving) })}</span>
          </div>
        </div>
        <p className="claim-assumption">{t('claim.assumptionNote')}</p>

        <div className="claim-breakdown">
          <div className="why-row">
            <span className="why-label">{t('claim.outOfPocket')}</span>
            <span className="why-val">{baht(r.outOfPocketCost)}</span>
          </div>
          <div className="why-row">
            <span className="why-label">{t('claim.excessLine')}</span>
            <span className="why-val">{baht(excess)}</span>
          </div>
          <div className="why-row">
            <span className="why-label">
              {r.ncbLossValue === 0
                ? t('claim.noNcbLoss')
                : t('claim.ncbLoss', { from: String(r.ncbCurrentPct), to: String(r.ncbAfterPct) })}
            </span>
            <span className="why-val">{baht(r.ncbLossValue)}</span>
          </div>
          <div className="why-row total">
            <span className="why-label">{t('claim.claimCost')}</span>
            <span className="why-val">{baht(r.claimNetCost)}</span>
          </div>
        </div>

        <p className="claim-disclaimer">
          <i className="ti ti-info-circle" aria-hidden="true" /> {t('claim.disclaimer')}
        </p>
      </div>
    </div>
  )
}
