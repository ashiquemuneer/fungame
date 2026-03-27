import { Check, Hash, Image, PenLine } from 'lucide-react'
import type { Question } from '../types/game'
import { cn } from '../lib/utils'

// Mirrors the read-only appearance of the editor canvas at 960 × 540.
// Caller must place inside a relatively-positioned container and set
//   transform: `scale(${scale})` + transformOrigin: 'top left'
// on this component's wrapper, or use it inside a SlideThumb-style
//   aspect-[16/9] overflow-hidden container.

const OPTION_COLORS = [
  'border-accent-dim bg-accent-dim',
  'border-note-line bg-note-tint',
  'border-warn-line bg-warn-tint',
  'border-ok-line bg-ok-tint',
  'border-err-line bg-err-tint',
  'border-rim bg-fill-hi',
]

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

interface Props {
  question: Question
  questionNumber: number
}

export function SlidePreviewPane({ question, questionNumber }: Props) {
  const fp = question.imageFocalPoint ?? { x: 50, y: 50 }
  const fpStyle = { objectPosition: `${fp.x}% ${fp.y}%` }
  const hasImage = Boolean(question.imageUrl)
  const isSectionImage = question.type === 'section' && hasImage
  const layout = isSectionImage ? (question.sectionLayout ?? 'cover') : null
  const countdown = `${question.timeLimitSeconds}s`
  const metaChipLabel = question.isDemo ? 'Demo' : `${question.points} pts · ${countdown}`

  return (
    <div
      className={cn(
        'rounded-[32px] border border-line bg-page',
        isSectionImage ? 'relative overflow-hidden' : 'flex flex-col p-6',
      )}
      style={{ width: 960, height: 540, flexShrink: 0 }}
    >
      {/* ── Header ── */}
      {isSectionImage || question.type === 'section' ? null : (
        <div className="mb-4 flex shrink-0 items-center justify-between gap-2.5">
          <span className="slide-chip bg-fill-hi text-lo">{`Q${questionNumber}`}</span>
          <span className="slide-chip bg-raised text-on-accent">{metaChipLabel}</span>
        </div>
      )}

      {/* ── Prompt (non-section) ── */}
      {question.type !== 'section' && (
        <div className="shrink-0 mb-2 px-4 py-3">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold leading-snug text-hi">
            {question.prompt || <span className="italic text-subtle">No question set</span>}
          </h2>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 pb-1 overflow-hidden">

        {/* Section: cover */}
        {question.type === 'section' && layout === 'cover' && (
          <>
            <img
              src={question.imageUrl}
              className="absolute inset-0 h-full w-full object-cover"
              style={fpStyle}
              alt=""
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-12 text-center">
              <h2 className="text-5xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-white drop-shadow-lg">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && (
                <p className="mt-3 text-xl text-white/80 drop-shadow">{question.acceptedAnswer}</p>
              )}
            </div>
          </>
        )}

        {/* Section: image-left */}
        {question.type === 'section' && layout === 'image-left' && (
          <div className="absolute inset-0 flex">
            <div className="relative w-1/2 shrink-0 overflow-hidden">
              <img
                src={question.imageUrl}
                className="absolute inset-0 h-full w-full object-cover"
                style={fpStyle}
                alt=""
              />
            </div>
            <div className="flex w-1/2 flex-col items-start justify-center px-10">
              <h2 className="px-3 py-2 text-4xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && (
                <p className="px-3 py-1.5 text-lg leading-relaxed text-lo">{question.acceptedAnswer}</p>
              )}
            </div>
          </div>
        )}

        {/* Section: image-right */}
        {question.type === 'section' && layout === 'image-right' && (
          <div className="absolute inset-0 flex">
            <div className="flex w-1/2 flex-col items-start justify-center px-10">
              <h2 className="px-3 py-2 text-4xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && (
                <p className="px-3 py-1.5 text-lg leading-relaxed text-lo">{question.acceptedAnswer}</p>
              )}
            </div>
            <div className="relative w-1/2 shrink-0 overflow-hidden">
              <img
                src={question.imageUrl}
                className="absolute inset-0 h-full w-full object-cover"
                style={fpStyle}
                alt=""
              />
            </div>
          </div>
        )}

        {/* Section: no image */}
        {question.type === 'section' && !layout && (
          <div className="flex min-h-0 w-full flex-col items-center justify-center p-10 text-center">
            <h2 className="text-5xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi">
              {question.prompt || 'Untitled'}
            </h2>
            {question.acceptedAnswer && (
              <p className="mt-4 max-w-2xl text-xl text-lo">{question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* MCQ / True-False */}
        {(question.type === 'mcq' || question.type === 'true_false') &&
          question.options.length > 0 && (() => {
            const mode = question.optionDisplayMode ?? 'text'
            const count = question.options.length
            const hasImages = mode !== 'text'
            let cols: number
            if (!hasImages) {
              cols = count === 1 ? 1 : count === 3 ? 3 : 2
            } else if (count <= 4) {
              cols = count
            } else {
              cols = Math.ceil(count / 2)
            }
            const rows = Math.ceil(count / cols)
            const gap = count >= 8 ? 8 : 12

            if (hasImages) {
              const imgCols = Math.min(count, 4)
              const LABEL_H = mode === 'text+image' ? 24 : 0
              const CONTENT_W = 912
              const CONTENT_H = 358
              const maxFromWidth  = (CONTENT_W - (imgCols - 1) * 12) / imgCols
              const maxFromHeight = CONTENT_H - LABEL_H
              const imgSize = Math.floor(Math.min(maxFromWidth, maxFromHeight))
              const cardH = imgSize + LABEL_H
              return (
                <div className="flex flex-1 min-h-0 items-center justify-center">
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imgCols}, ${imgSize}px)`, gridTemplateRows: `${cardH}px`, gap: 12 }}>
                    {question.options.map((opt, i) => (
                      <div key={opt.id} className={cn('flex flex-col overflow-hidden rounded-2xl border', OPTION_COLORS[i % OPTION_COLORS.length])}>
                        <div className="relative overflow-hidden bg-fill" style={{ width: imgSize, height: imgSize, flexShrink: 0 }}>
                          {opt.imageUrl
                            ? <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" />
                            : <div className="flex h-full items-center justify-center text-[10px] text-faded">{OPTION_LETTERS[i]}</div>
                          }
                          <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/40 text-[9px] font-bold text-white">{OPTION_LETTERS[i]}</span>
                        </div>
                        {mode === 'text+image' && (
                          <div className="shrink-0 px-2 py-1" style={{ height: LABEL_H }}>
                            <p className={cn('truncate text-xs font-medium', opt.label ? 'text-md' : 'italic text-faded')}>{opt.label || OPTION_LETTERS[i]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
              }}
            >
              {question.options.map((opt, i) => (
                <div
                  key={opt.id}
                  className={cn(
                    'flex items-center rounded-2xl border',
                    count >= 8 ? 'gap-2 p-2.5' : 'gap-3 p-4',
                    OPTION_COLORS[i % OPTION_COLORS.length],
                  )}
                >
                  <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-input-bg font-bold text-lo', count >= 8 ? 'size-6 text-[10px]' : 'size-7 text-xs')}>
                    {OPTION_LETTERS[i]}
                  </span>
                  <p className={cn('flex-1 truncate font-medium', count >= 8 ? 'text-xs' : 'text-sm', opt.label ? 'text-md' : 'italic text-faded')}>
                    {opt.label || `Option ${OPTION_LETTERS[i]}`}
                  </p>
                  {opt.isCorrect && (
                    <div className={cn('ml-auto flex shrink-0 items-center justify-center rounded-full bg-ok-tint', count >= 8 ? 'size-4' : 'size-5')}>
                      <Check className={cn('text-ok-fg', count >= 8 ? 'size-2.5' : 'size-3')} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            )
          })()}

        {/* Short text */}
        {question.type === 'short_text' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
            <PenLine className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-sm text-faded">Players type their answer</p>
            {question.acceptedAnswer && (
              <p className="mt-1 text-xs text-subtle">Scoring: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* Emoji */}
        {question.type === 'emoji' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
            <p className="text-5xl leading-relaxed">{question.emojiPrompt || '🎯 🎲 🎪'}</p>
            <p className="mt-4 text-sm text-faded">Players guess from the emoji clue</p>
            {question.acceptedAnswer && (
              <p className="mt-1 text-xs text-ok-fg">Answer: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* Image guess */}
        {question.type === 'image_guess' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
            <Image className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-sm text-faded">Image reveal question</p>
            {question.acceptedAnswer && (
              <p className="mt-1 text-xs text-ok-fg">Answer: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* Rating */}
        {question.type === 'rating' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="flex size-12 items-center justify-center rounded-2xl border border-form bg-fill-hi text-lg font-bold text-dim"
                >
                  {n}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-faded">Players rate from 1 to 5</p>
          </div>
        )}

        {/* Number guess */}
        {question.type === 'number_guess' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
            <Hash className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-sm text-faded">Players guess a number</p>
            {question.acceptedAnswer && (
              <p className="mt-1 text-xs text-ok-fg">Answer: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
