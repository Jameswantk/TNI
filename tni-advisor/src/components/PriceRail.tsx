import { useRef, useState } from 'react'
import type {
  AdvisorTarget,
  AtFault,
  ConfidenceFlag,
  MileageTier,
  NamedDriver,
  NcbLevel,
  PriceControls,
  Quote,
  SumInsured,
  Answers,
} from '../types'
import { assessConfidence, insuredValue } from '../lib/pricing'
import { buildAdvisorRead } from '../lib/advisorRead'
import { TNIRead } from './TNIRead'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  answers: Answers
  controls: PriceControls
  quote: Quote
  lastUpdated: string
  onControls: (patch: Partial<PriceControls>) => void
  onSeePlans: () => void
}

const baht = (n: number) => '฿' + n.toLocaleString()

const PROVINCES = ['bangkok', 'central', 'north', 'northeast', 'south']
const NCB_LEVELS: NcbLevel[] = ['none', '1', '2', '3', '4plus', 'unsure']
const NAMED: NamedDriver[] = ['named', 'any30', 'any25', 'any']
const MILEAGE: MileageTier[] = ['u5', '5_10', '10_15', 'o15', 'unsure']
const SUM: SumInsured[] = ['lower', 'balanced', 'higher']
const NCB_PCT: Record<NcbLevel, number> = { none: 0, '1': 20, '2': 30, '3': 40, '4plus': 50, unsure: 0 }
const NAMED_PCT: Record<NamedDriver, number> = { named: 15, any30: 7, any25: 3, any: 0 }
type AccuracyKey = 'area' | 'usage' | 'insured'

const confClass: Record<string, string> = { high: 'conf-high', medium: 'conf-medium', rough: 'conf-rough' }
const confLabel: Record<string, string> = { high: 'est.conf.high', medium: 'est.conf.medium', rough: 'est.conf.rough' }

export function PriceRail({ t, answers, controls, quote, lastUpdated, onControls, onSeePlans }: Props) {
  const [showWhy, setShowWhy] = useState(false)
  const [showFlags, setShowFlags] = useState(false)
  const [moreSave, setMoreSave] = useState(false)
  const [moreAcc, setMoreAcc] = useState(false)
  const [accuracyOpen, setAccuracyOpen] = useState<Partial<Record<AccuracyKey, boolean>>>({})

  const lowerRef = useRef<HTMLDivElement>(null)
  const sharpenRef = useRef<HTMLDivElement>(null)

  // "TNI's read" rows point their actions at the existing controls below.
  const readItems = buildAdvisorRead(answers, controls, quote)
  function pulseEl(el: Element | null | undefined) {
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('pulse')
    window.setTimeout(() => el.classList.remove('pulse'), 1100)
  }
  function onReadAction(target: AdvisorTarget) {
    if (target === 'plans') return onSeePlans()
    if (target === 'sharpen') {
      // Pulse the first still-open accuracy control (the one the assumption is about).
      return pulseEl(sharpenRef.current?.querySelector('.prov-block, .ctrl-block') ?? sharpenRef.current)
    }
    const inMore = target === 'repair' || target === 'dashcam' || target === 'mileage' || target === 'excess'
    if (inMore) setMoreSave(true)
    const sel: Record<string, string> = {
      ncb: '[data-ctrl="ncb"]',
      named: '[data-ctrl="named"]',
      repair: '[data-ctrl="repair"]',
      dashcam: '[data-ctrl="toggles"]',
      excess: '[data-ctrl="toggles"]',
      mileage: '[data-ctrl="mileage"]',
    }
    const run = () => pulseEl(lowerRef.current?.querySelector(sel[target]))
    // Controls inside "More ways to save" mount on the next render, so wait a tick.
    if (inMore) window.setTimeout(run, 60)
    else run()
  }

  const car = `${answers.carBrand ?? ''} ${answers.carModel ?? ''}`.trim() || '—'
  const yearLabel = answers.carYear && answers.carYear !== 'unsure' ? t('opt.year.' + answers.carYear) : ''
  const baseLabel =
    quote.quality === 'segment'
      ? t('mod.baseFallback')
      : `${t('mod.base')} · ${[car, yearLabel].filter(Boolean).join(' ')}`
  const conf = assessConfidence(answers, controls, quote)
  const canFloor = quote.priced && !conf.commercial && (quote.floorMin < quote.min || quote.floorMax < quote.max)
  const currentInsuredValue = insuredValue(answers, controls)

  function accuracyFlag(key: AccuracyKey) {
    return conf.flags.find((f) => f.key === key)
  }

  function isAccuracyOpen(key: AccuracyKey): boolean {
    const manual = accuracyOpen[key]
    if (manual !== undefined) return manual
    return accuracyFlag(key)?.status !== 'confirmed'
  }

  function setAccuracy(key: AccuracyKey, open: boolean) {
    setAccuracyOpen((prev) => ({ ...prev, [key]: open }))
  }

  function insuredOptionValue(sumInsured: SumInsured): string {
    return baht(insuredValue(answers, { ...controls, sumInsured }))
  }

  // Display value for each confidence-checklist row.
  function flagValue(f: ConfidenceFlag): string {
    switch (f.key) {
      case 'vehicle':
        return f.status === 'confirmed' ? t('flag.matched') : t('flag.similar')
      case 'area':
        return controls.province ? t('opt.prov.' + controls.province) : t('flag.assumedAny')
      case 'usage':
        return controls.usage === 'private'
          ? t('usage.private')
          : controls.usage === 'commercial'
            ? t('flag.advisorCheck')
            : t('flag.assumedPrivate')
      case 'insured':
        return controls.sumInsured
          ? `${t('sum.' + controls.sumInsured)} · ${baht(currentInsuredValue)}`
          : t('flag.assumedBalanced')
      case 'claims':
        return controls.atFault ? t('atf.' + controls.atFault) : t('flag.notSet')
      default:
        return ''
    }
  }
  const statusIcon: Record<string, string> = { confirmed: 'circle-check', assumed: 'help-circle', open: 'minus' }

  return (
    <aside className="price-rail">
      {/* Live estimate + compositional confidence */}
      <div className="rail-card estimate">
        <div className="rail-head">
          <span className="rail-eyebrow">
            {t('rail.liveEstimate')} · {t('cov.' + quote.coverage)}
          </span>
          <span className="rail-live">
            <i className="ti ti-bolt" aria-hidden="true" /> {t('rail.updatesLive')}
          </span>
        </div>

        {conf.commercial ? (
          <div className="advisor-confirm">
            <i className="ti ti-user-shield" aria-hidden="true" />
            <span>{t('est.advisorCommercial')}</span>
          </div>
        ) : quote.priced ? (
          <p className="rail-price">
            {baht(quote.min)} – {baht(quote.max)}
            <span className="rail-per">{t('plan.perYear')}</span>
          </p>
        ) : (
          <p className="rail-unpriced">{t('est.unpriced')}</p>
        )}

        <div className="conf-row">
          <span className={`est-conf ${confClass[conf.level]}`}>
            <i className="ti ti-circle-dot" aria-hidden="true" /> {t(confLabel[conf.level])}
          </span>
          <button className="conf-toggle" onClick={() => setShowFlags(!showFlags)}>
            {t('est.whatsAssumed')} <i className={`ti ti-chevron-${showFlags ? 'up' : 'down'}`} aria-hidden="true" />
          </button>
        </div>
        {showFlags && (
          <div className="conf-flags">
            {conf.flags.map((f) => (
              <div className="conf-flag" key={f.key}>
                <span className={`cf-${f.status}`}>
                  <i className={`ti ti-${statusIcon[f.status]}`} aria-hidden="true" /> {t(f.labelKey)}
                </span>
                <span className="cf-val">{flagValue(f)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TNIRead t={t} items={readItems} onAction={onReadAction} />

      {answers.isEv && <EvNotice t={t} />}

      {/* Why this price? — collapsible to keep the rail calm */}
      {quote.priced && !conf.commercial && (
        <div className="rail-card">
          <button className="why-toggle" onClick={() => setShowWhy(!showWhy)}>
            <span><i className="ti ti-info-circle" aria-hidden="true" /> {t('est.why')}</span>
            <i className={`ti ti-chevron-${showWhy ? 'up' : 'down'}`} aria-hidden="true" />
          </button>
          {showWhy && (
            <div className="why-rows">
              <div className="why-row">
                <span className="why-label">{baseLabel}</span>
                <span className="why-val">{baht(quote.base.median)}</span>
              </div>
              {quote.modifiers.map((m) => (
                <div className="why-row" key={m.key}>
                  <span className="why-label">{t(m.labelKey)}</span>
                  <span className={`why-val ${m.deltaPct < 0 ? 'save' : 'load'}`}>
                    {m.deltaPct > 0 ? '+' : ''}
                    {m.deltaPct}%
                  </span>
                </div>
              ))}
              <div className="why-row total">
                <span className="why-label">{t('est.estimateLabel')}</span>
                <span className="why-val">{baht(quote.min)} – {baht(quote.max)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Lower my price (savings levers) ===== */}
      <div className="rail-card lower" ref={lowerRef}>
        <div className="rail-card-title between">
          <span><i className="ti ti-arrow-down-circle" aria-hidden="true" /> {t('rail.lower')}</span>
          {canFloor && <span className="floor save">→ {baht(quote.floorMin)}–{baht(quote.floorMax)}</span>}
        </div>

        <div
          className={`ncb-block ${controls.ncb === 'none' || controls.ncb === 'unsure' ? 'lead' : ''}`}
          data-ctrl="ncb"
        >
          <div className="ncb-head">
            <span><i className="ti ti-shield-check" aria-hidden="true" /> {t('ctrl.ncb')}</span>
            <span className="save strong">
              {controls.ncb !== 'none' && controls.ncb !== 'unsure' ? `−${NCB_PCT[controls.ncb]}%` : t('ctrl.upTo', { n: '50' })}
            </span>
          </div>
          <div className="mini-row wrap">
            {NCB_LEVELS.map((lvl) => (
              <button key={lvl} className={`mini ${controls.ncb === lvl ? 'sel' : ''}`} onClick={() => onControls({ ncb: lvl })}>
                {t('ncb.' + lvl)}
              </button>
            ))}
          </div>
        </div>

        <div className="ctrl-block" data-ctrl="named">
          <div className="ncb-head">
            <span><i className="ti ti-users" aria-hidden="true" /> {t('ctrl.named')}</span>
            <span className="save strong">
              {controls.namedDriver !== 'any' ? `−${NAMED_PCT[controls.namedDriver]}%` : t('ctrl.upTo', { n: '15' })}
            </span>
          </div>
          <div className="mini-row wrap">
            {NAMED.map((n) => (
              <button key={n} className={`mini ${controls.namedDriver === n ? 'sel' : ''}`} onClick={() => onControls({ namedDriver: n })}>
                {t('named.' + n)}
              </button>
            ))}
          </div>
          {controls.namedDriver !== 'any' && (
            <p className="ctrl-warn">
              <i className="ti ti-alert-triangle" aria-hidden="true" />{' '}
              {t(controls.namedDriver === 'any30' ? 'named.tradeoff.any30' : controls.namedDriver === 'any25' ? 'named.tradeoff.any25' : 'named.tradeoff.named')}
            </p>
          )}
        </div>

        <button className="more-toggle" onClick={() => setMoreSave(!moreSave)}>
          {moreSave ? t('rail.fewer') : t('rail.moreSave')} <i className={`ti ti-chevron-${moreSave ? 'up' : 'down'}`} aria-hidden="true" />
        </button>
        {moreSave && (
          <div className="more-body">
            <div className="ctrl-row" data-ctrl="repair">
              <span className="ctrl-label"><i className="ti ti-tool" aria-hidden="true" /> {t('ctrl.repair')}</span>
              <div className="seg">
                <button className={controls.repairPref === 'garage' ? 'sel' : ''} onClick={() => onControls({ repairPref: 'garage' })}>{t('opt.repair.garage')}</button>
                <button className={controls.repairPref === 'dealer' ? 'sel' : ''} onClick={() => onControls({ repairPref: 'dealer' })}>{t('opt.repair.dealer')}</button>
              </div>
            </div>
            <div className="toggle-grid" data-ctrl="toggles">
              <Toggle icon="camera" label={t('ctrl.dashcam')} on={controls.dashcam} onClick={() => onControls({ dashcam: !controls.dashcam })} />
              <Toggle icon="cash" label={t('ctrl.excess')} on={controls.higherExcess} onClick={() => onControls({ higherExcess: !controls.higherExcess })} />
            </div>
            <div className="ctrl-row" style={{ marginTop: '10px' }} data-ctrl="mileage">
              <span className="ctrl-label"><i className="ti ti-road" aria-hidden="true" /> {t('ctrl.mileage')}</span>
              <div className="mini-row wrap" style={{ marginTop: 0 }}>
                {MILEAGE.map((m) => (
                  <button key={m} className={`mini ${controls.mileage === m ? 'sel' : ''}`} onClick={() => onControls({ mileage: m })}>{t('mile.' + m)}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Sharpen this estimate (accuracy levers) ===== */}
      <div className="rail-card sharpen" ref={sharpenRef}>
        <div className="rail-card-title between">
          <span><i className="ti ti-adjustments-alt" aria-hidden="true" /> {t('rail.sharpen')}</span>
          <span className="rail-hint">{t('rail.sharpenHint')}</span>
        </div>

        {isAccuracyOpen('area') ? (
          <div className="prov-block">
            <span className="ctrl-label">
              <i className="ti ti-map-pin" aria-hidden="true" /> {t('ctrl.province')}
              {!controls.province && <span className="prov-hint">{t('ctrl.provinceHint')}</span>}
            </span>
            <div className="mini-row wrap">
              {PROVINCES.map((p) => (
                <button key={p} className={`mini ${controls.province === p ? 'sel' : ''}`} onClick={() => onControls({ province: p })}>{t('opt.prov.' + p)}</button>
              ))}
            </div>
            {controls.province && <button className="inline-done" onClick={() => setAccuracy('area', false)}>{t('rail.done')}</button>}
          </div>
        ) : (
          <SummaryRow
            icon="map-pin"
            label={t('ctrl.province')}
            value={controls.province ? t('opt.prov.' + controls.province) : t('flag.assumedAny')}
            editLabel={t('rail.edit')}
            onEdit={() => setAccuracy('area', true)}
          />
        )}

        {isAccuracyOpen('usage') ? (
          <div className="ctrl-block">
            <div className="ncb-head">
              <span><i className="ti ti-steering-wheel" aria-hidden="true" /> {t('ctrl.usage')}</span>
              {!controls.usage && <span className="prov-hint">{t('usage.assumed')}</span>}
            </div>
            <div className="mini-row wrap">
              <button className={`mini ${controls.usage === 'private' ? 'sel' : ''}`} onClick={() => onControls({ usage: 'private' })}>{t('usage.private')}</button>
              <button className={`mini ${controls.usage === 'commercial' ? 'sel' : ''}`} onClick={() => onControls({ usage: 'commercial' })}>{t('usage.commercial')}</button>
            </div>
            {controls.usage === 'commercial' && (
              <p className="ctrl-info"><i className="ti ti-info-circle" aria-hidden="true" /> {t('usage.advisor')}</p>
            )}
            {controls.usage && <button className="inline-done" onClick={() => setAccuracy('usage', false)}>{t('rail.done')}</button>}
          </div>
        ) : (
          <SummaryRow
            icon="steering-wheel"
            label={t('ctrl.usage')}
            value={controls.usage === 'private' ? t('usage.private') : controls.usage === 'commercial' ? t('usage.commercial') : t('flag.assumedPrivate')}
            editLabel={t('rail.edit')}
            onEdit={() => setAccuracy('usage', true)}
          />
        )}

        {isAccuracyOpen('insured') ? (
          <div className="ctrl-block">
            <div className="ncb-head">
              <span><i className="ti ti-shield-half" aria-hidden="true" /> {t('ctrl.sumInsured')}</span>
              <span className="sum-value">{t('sum.valueLabel', { v: currentInsuredValue.toLocaleString() })}</span>
            </div>
            <div className="mini-row wrap">
              {SUM.map((s) => (
                <button
                  key={s}
                  className={`mini ${controls.sumInsured === s || (!controls.sumInsured && s === 'balanced') ? 'sel' : ''}`}
                  onClick={() => onControls({ sumInsured: s })}
                >
                  {t('sum.' + s)} · {insuredOptionValue(s)}
                </button>
              ))}
            </div>
            {controls.sumInsured === 'lower' && (
              <p className="ctrl-warn"><i className="ti ti-alert-triangle" aria-hidden="true" /> {t('sum.warn')}</p>
            )}
            {controls.sumInsured && <button className="inline-done" onClick={() => setAccuracy('insured', false)}>{t('rail.done')}</button>}
          </div>
        ) : (
          <SummaryRow
            icon="shield-half"
            label={t('ctrl.sumInsured')}
            value={`${t('sum.' + (controls.sumInsured ?? 'balanced'))} · ${baht(currentInsuredValue)}`}
            editLabel={t('rail.edit')}
            onEdit={() => setAccuracy('insured', true)}
          />
        )}

        <button className="more-toggle" onClick={() => setMoreAcc(!moreAcc)}>
          {moreAcc ? t('rail.fewer') : t('rail.moreAcc')} <i className={`ti ti-chevron-${moreAcc ? 'up' : 'down'}`} aria-hidden="true" />
        </button>
        {moreAcc && (
          <div className="more-body">
            <div className="ctrl-row">
              <span className="ctrl-label"><i className="ti ti-alert-octagon" aria-hidden="true" /> {t('ctrl.atFault')}</span>
              <div className="mini-row wrap" style={{ marginTop: 0 }}>
                {(['none', '1', '2plus'] as AtFault[]).map((x) => (
                  <button key={x} className={`mini ${controls.atFault === x ? 'sel' : ''}`} onClick={() => onControls({ atFault: x })}>{t('atf.' + x)}</button>
                ))}
                <button className={`mini ${!controls.atFault ? 'sel' : ''}`} onClick={() => onControls({ atFault: undefined })}>{t('atf.unsure')}</button>
              </div>
            </div>
          </div>
        )}

        <p className="trim-later"><i className="ti ti-engine" aria-hidden="true" /> {t('ctrl.trimLater')}</p>
      </div>

      <button className="btn-primary btn-block see-plans" onClick={onSeePlans}>
        {t('rail.seePlans')} <i className="ti ti-arrow-right" aria-hidden="true" />
      </button>

      <p className="rail-foot">
        <i className="ti ti-database" aria-hidden="true" /> {t('rail.freshness', { date: fmtDate(lastUpdated) })}
      </p>
    </aside>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  editLabel,
  onEdit,
}: {
  icon: string
  label: string
  value: string
  editLabel: string
  onEdit: () => void
}) {
  return (
    <div className="accuracy-summary">
      <span>
        <i className={`ti ti-${icon}`} aria-hidden="true" /> {label} <span className="summary-value">· {value}</span>
      </span>
      <button onClick={onEdit}>{editLabel}</button>
    </div>
  )
}

function Toggle({ icon, label, on, onClick }: { icon: string; label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}>
      <i className={`ti ti-${icon}`} aria-hidden="true" /> {label}
      {on && <i className="ti ti-check toggle-check" aria-hidden="true" />}
    </button>
  )
}

function EvNotice({ t }: { t: (k: string) => string }) {
  return (
    <div className="rail-card ev-notice">
      <div className="rail-card-title">
        <i className="ti ti-bolt" aria-hidden="true" /> {t('ev.title')}
      </div>
      <p className="ev-text">{t('ev.body')}</p>
      <p className="ev-warn">
        <i className="ti ti-alert-triangle" aria-hidden="true" /> {t('ev.warn')}
      </p>
    </div>
  )
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
