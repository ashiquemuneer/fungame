import { BookOpen, CircleDot, Globe, Hash, Image, Layout, PenLine, Smile, Star, ToggleLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useGameStore } from '../state/game-store'
import type { QuestionType } from '../types/game'

const TYPE_META: Record<QuestionType, { label: string; icon: React.ElementType }> = {
  mcq:          { label: 'Multiple choice', icon: CircleDot  },
  true_false:   { label: 'True / False',    icon: ToggleLeft },
  short_text:   { label: 'Short text',      icon: PenLine    },
  emoji:        { label: 'Emoji guess',     icon: Smile      },
  image_guess:  { label: 'Image reveal',    icon: Image      },
  rating:       { label: 'Rating 1–5',      icon: Star       },
  number_guess: { label: 'Number guess',    icon: Hash       },
  section:      { label: 'Section',         icon: Layout     },
}

export function PublicGamePage() {
  const { gameId = '' } = useParams()
  const { getGame } = useGameStore()
  const game = getGame(gameId)

  if (!game) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="panel p-8 text-center text-lo">
          <Globe className="mx-auto mb-4 size-10 opacity-30" />
          <p className="text-lg font-semibold text-lo">Game not found</p>
          <p className="mt-2 text-sm">This link may be invalid or the game is no longer public.</p>
          <Link className="button-secondary mt-6 inline-flex" to="/">Back to home</Link>
        </div>
      </div>
    )
  }

  if (!game.isPublic) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="panel p-8 text-center text-lo">
          <Globe className="mx-auto mb-4 size-10 opacity-30" />
          <p className="text-lg font-semibold text-lo">This game is private</p>
          <p className="mt-2 text-sm">The host has not made this question set public.</p>
          <Link className="button-secondary mt-6 inline-flex" to="/">Back to home</Link>
        </div>
      </div>
    )
  }

  const questions = game.questions.filter((q) => q.type !== 'section')
  const sections  = game.questions.filter((q) => q.type === 'section')

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <section className="panel p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-dim text-accent-text">
            <BookOpen className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-ok-tint px-3 py-1 text-xs text-ok-fg">
                <Globe className="size-3" /> Public
              </span>
              {(game.tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full bg-accent-dim px-3 py-1 text-xs text-accent-text">{tag}</span>
              ))}
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-hi">{game.title}</h1>
            {game.description && (
              <p className="mt-1 text-sm text-lo">{game.description}</p>
            )}
            <p className="mt-3 text-xs text-faded">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
              {sections.length > 0 && ` · ${sections.length} section${sections.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </section>

      {/* Question list */}
      <section className="space-y-2">
        {game.questions.map((q, i) => {
          const meta = TYPE_META[q.type]
          const Icon = meta.icon
          return (
            <div
              key={q.id}
              className={`panel p-4 ${q.type === 'section' ? 'border-line bg-fill' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-fill-hi text-dim">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {q.type !== 'section' && (
                      <span className="text-xs text-faded">Q{game.questions.slice(0, i).filter((x) => x.type !== 'section').length + 1}</span>
                    )}
                    <span className="text-[10px] uppercase tracking-[0.12em] text-faded">{meta.label}</span>
                    {q.type !== 'section' && !q.isDemo && (
                      <span className="text-[10px] text-faded">{q.points} pts · {q.timeLimitSeconds}s</span>
                    )}
                  </div>
                  <p className={`mt-1 font-medium ${q.type === 'section' ? 'text-lo text-sm' : 'text-md'}`}>
                    {q.prompt}
                  </p>
                  {q.type === 'mcq' || q.type === 'true_false' ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <span
                          key={opt.id}
                          className={`rounded-full px-3 py-1 text-xs ${opt.isCorrect ? 'bg-ok-tint text-ok-fg' : 'bg-fill-hi text-dim'}`}
                        >
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <div className="pb-6 text-center">
        <Link className="button-ghost text-sm text-faded hover:text-lo" to="/">
          Powered by FunGame
        </Link>
      </div>
    </div>
  )
}
