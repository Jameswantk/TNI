import { useMemo, useState } from 'react'
import type { PlanRecommendation } from '../types'
import { answerCoverageQuestion } from '../lib/aiAdvisor'

interface Props {
  t: (key: string, params?: Record<string, string>) => string
  plan?: PlanRecommendation
}

const prompts = [
  'ai.copilot.q.surprise',
  'ai.copilot.q.typeDiff',
  'ai.copilot.q.driver',
  'ai.copilot.q.repair',
]

export function CoverageCopilot({ t, plan }: Props) {
  const [draftQuestion, setDraftQuestion] = useState('')
  const [activeQuestion, setActiveQuestion] = useState('')
  const answer = useMemo(
    () => answerCoverageQuestion(t, activeQuestion || t('ai.copilot.q.surprise'), plan),
    [activeQuestion, plan, t],
  )

  function ask(q: string) {
    const next = q.trim()
    if (!next) return
    setDraftQuestion(next)
    setActiveQuestion(next)
  }

  return (
    <div className="coverage-copilot">
      <div className="ai-section-title">
        <i className="ti ti-message-chatbot" aria-hidden="true" /> {t('ai.copilot.title')}
      </div>
      <p className="ai-muted">{t('ai.copilot.body')}</p>
      <div className="copilot-prompts">
        {prompts.map((p) => (
          <button key={p} className="mini" type="button" onClick={() => ask(t(p))}>
            {t(p)}
          </button>
        ))}
      </div>
      <div className="copilot-input">
        <input
          value={draftQuestion}
          onChange={(e) => setDraftQuestion(e.target.value)}
          placeholder={t('ai.copilot.placeholder')}
          onKeyDown={(e) => e.key === 'Enter' && ask(draftQuestion)}
        />
        <button className="send-btn" type="button" onClick={() => ask(draftQuestion)} aria-label={t('send')}>
          <i className="ti ti-send" />
        </button>
      </div>
      <div className={`copilot-answer${answer.escalate ? ' escalate' : ''}`}>
        <p>{answer.answer}</p>
        <div className="copilot-cites">
          {answer.citations.map((c) => (
            <span key={c}><i className="ti ti-link" aria-hidden="true" /> {c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
