import { useEffect, useState } from 'react'
import { ScrollRegion } from '../components/ScrollRegion'
import { ScreenHeader } from '../components/ScreenHeader'
import { todayKey } from '../hooks/useStored'
import type { AnswerEntry, CoupleProfile } from '../types'

interface QuestionScreenProps {
  question: string
  answers: AnswerEntry[]
  profile: CoupleProfile
  onSave: (question: string, you: string, partner: string) => void
  onBack: () => void
}

export function QuestionScreen({
  question,
  answers,
  profile,
  onSave,
  onBack,
}: QuestionScreenProps) {
  const today = todayKey()
  const saved = answers.find((entry) => entry.id === today)

  const [you, setYou] = useState(saved?.you ?? '')
  const [partner, setPartner] = useState(saved?.partner ?? '')
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    setYou(saved?.you ?? '')
    setPartner(saved?.partner ?? '')
  }, [saved?.you, saved?.partner])

  const history = answers.filter((entry) => entry.id !== today)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onSave(question, you, partner)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Daily Q"
        subtitle="One question a day, answered by both"
        onBack={onBack}
      />

      <ScrollRegion className="screen__scroll">
        <div className="surface question-card">
          <p className="question-card__eyebrow">Today</p>
          <p className="question-card__text">{question}</p>
        </div>

        <form className="surface form-card" onSubmit={submit}>
          <label className="field">
            <span>{profile.nameYou}</span>
            <textarea
              value={you}
              onChange={(event) => setYou(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Your answer"
            />
          </label>

          <label className="field">
            <span>{profile.namePartner}</span>
            <textarea
              value={partner}
              onChange={(event) => setPartner(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Their answer"
            />
          </label>

          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!you.trim() && !partner.trim()}
          >
            {justSaved ? 'Saved' : saved ? 'Update answers' : 'Save answers'}
          </button>
        </form>

        {history.length > 0 ? (
          <>
            <div className="section-head section-head--tight">
              <h2>Past questions</h2>
            </div>
            <ul className="history-list">
              {history.map((entry) => (
                <li key={entry.id} className="surface history">
                  <p className="history__question">{entry.question}</p>
                  {entry.you ? (
                    <p className="history__answer">
                      <span className="pill pill--you">{profile.nameYou}</span>
                      {entry.you}
                    </p>
                  ) : null}
                  {entry.partner ? (
                    <p className="history__answer">
                      <span className="pill pill--partner">{profile.namePartner}</span>
                      {entry.partner}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </ScrollRegion>
    </div>
  )
}
