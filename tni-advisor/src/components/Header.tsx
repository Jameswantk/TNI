import type { Lang } from '../types'
import thanachartLogo from '../assets/thanachart-insurance-logo.png'

interface Props {
  t: (key: string) => string
  lang: Lang
  onToggleLang: () => void
  onOpenClaim: () => void
}

export function Header({ t, lang, onToggleLang, onOpenClaim }: Props) {
  return (
    <header className="app-header">
      <img className="brand-mark" src={thanachartLogo} alt="Thanachart Insurance" />
      <div className="brand-text">
        <div className="brand-title">{t('app.title')}</div>
        <div className="brand-status">
          <span className="status-dot" />
          {t('brand.kicker')}
        </div>
      </div>
      <div className="header-actions">
        <button className="tool-btn" onClick={onOpenClaim}>
          <i className="ti ti-calculator" aria-hidden="true" /> <span>{t('claim.tool')}</span>
        </button>
        <button className="lang-toggle" onClick={onToggleLang} aria-label="Toggle language">
          {lang === 'en' ? 'TH' : 'EN'}
        </button>
      </div>
    </header>
  )
}
