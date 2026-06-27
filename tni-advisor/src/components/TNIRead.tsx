import { useEffect, useRef, useState } from 'react'
import type { AdvisorReadItem, AdvisorTarget } from '../types'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  items: AdvisorReadItem[]
  onAction: (target: AdvisorTarget) => void
}

// Stable per-suggestion key so we can detect when one is resolved (the user
// acted on it and it dropped out of the list).
const keyOf = (i: AdvisorReadItem) => `${i.kind}:${i.bodyKey}`

interface Row {
  item: AdvisorReadItem
  key: string
  resolved: boolean
}

// "TNI's read" — a quiet advisor note, not a separate product. No AI badge,
// no chat input. When a suggestion is resolved by a real control change it ticks
// to a "done" state and fades out, so it feels like working through the advice.
export function TNIRead({ t, items, onAction }: Props) {
  const startCollapsed = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 820px)').matches
  const [open, setOpen] = useState(!startCollapsed)
  const [rows, setRows] = useState<Row[]>(() => items.map((i) => ({ item: i, key: keyOf(i), resolved: false })))
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const sig = items.map((i) => keyOf(i) + (i.bodyParams?.amount ?? '')).join('|')

  useEffect(() => {
    // Commercial pivot: a single blocking warning replaces the whole advisor flow.
    // Clear any lingering resolved rows immediately rather than letting them fade.
    const isCommercialOnly = items.length === 1 && items[0].bodyKey === 'read.warn.commercial'
    if (isCommercialOnly) {
      Object.values(timers.current).forEach(clearTimeout)
      timers.current = {}
      setRows(items.map((i) => ({ item: i, key: keyOf(i), resolved: false })))
      return
    }

    setRows((prev) => {
      const currentKeys = new Set(items.map(keyOf))
      const resolvedCarry = prev.filter((r) => r.resolved)
      const newlyResolved = prev
        .filter((r) => !r.resolved && !currentKeys.has(r.key))
        .map((r) => ({ ...r, resolved: true }))
      newlyResolved.forEach((r) => {
        if (!timers.current[r.key]) {
          timers.current[r.key] = setTimeout(() => {
            setRows((cur) => cur.filter((x) => x.key !== r.key))
            delete timers.current[r.key]
          }, 1300)
        }
      })
      const active: Row[] = items.map((i) => ({ item: i, key: keyOf(i), resolved: false }))
      return [...resolvedCarry, ...newlyResolved, ...active]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  if (rows.length === 0) return null

  const summaryText = items.find((i) => i.shortKey)?.shortKey
  const collapsed = summaryText ? t(summaryText) : ''

  return (
    <div className="rail-card TNI-read">
      <button className="ir-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="ir-title">
          <i className="ti ti-bulb" aria-hidden="true" /> {t('read.title')}
        </span>
        {!open && collapsed && <span className="ir-collapsed">{collapsed}</span>}
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="ir-rows">
          {rows.map(({ item, key, resolved }) =>
            resolved ? (
              <div className="ir-row resolved" key={key}>
                <i className="ti ti-circle-check ir-icon" aria-hidden="true" />
                <span className="ir-done">{t('read.done.' + item.kind)}</span>
              </div>
            ) : (
              <div className={`ir-row ${item.severity === 'warning' ? 'warn' : ''}`} key={key}>
                <i className={`ti ti-${item.icon} ir-icon`} aria-hidden="true" />
                <div className="ir-body">
                  <span className="ir-label">{t(item.labelKey)}</span>
                  <p className="ir-text">{t(item.bodyKey, item.bodyParams)}</p>
                </div>
                {item.actionKey && item.target && (
                  <button className="ir-action" onClick={() => onAction(item.target!)}>
                    {t(item.actionKey)}
                  </button>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
