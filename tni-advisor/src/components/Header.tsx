import type { Lang } from '../types'

interface Props {
  t: (key: string) => string
  lang: Lang
  onToggleLang: () => void
  onOpenClaim: () => void
}

export function Header({ t, lang, onToggleLang, onOpenClaim }: Props) {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        <i className="ti ti-shield-check" />
      </div>
      <div className="brand-text">
        <div className="brand-title">{t('app.title')}</div>
        <div className="brand-status">
          <span className="status-dot" />
          {t('app.online')}
        </div>
      </div>
      <button className="tool-btn" onClick={onOpenClaim}>
        <i className="ti ti-calculator" aria-hidden="true" /> {t('claim.tool')}
      </button>
      <button className="lang-toggle" onClick={onToggleLang} aria-label="Toggle language">
        {lang === 'en' ? 'TH' : 'EN'}
      </button>
    </header>
  )
}
