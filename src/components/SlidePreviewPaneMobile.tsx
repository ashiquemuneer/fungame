import { Check, Hash, Image, PenLine } from 'lucide-react'
import type { Question } from '../types/game'
import { cn } from '../lib/utils'

// Portrait-native mobile preview at 9:16.
// Renders the same slide data as SlidePreviewPane but adapted for a
// 9:16 portrait screen — full-bleed cover images, vertically-stacked
// MCQ options, and responsive section layouts.
//
// Caller wraps in an overflow-hidden container and applies CSS scale.

const OPTION_COLORS = [
  'border-accent-dim bg-accent-dim',
  'border-note-line bg-note-tint',
  'border-warn-line bg-warn-tint',
  'border-ok-line bg-ok-tint',
  'border-err-line bg-err-tint',
  'border-rim bg-fill-hi',
]

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const W = 360
const H = 640

interface Props {
  question: Question
  questionNumber: number
}

export function SlidePreviewPaneMobile({ question, questionNumber }: Props) {
  const fp = question.imageFocalPoint ?? { x: 50, y: 50 }
  const fpStyle = { objectPosition: `${fp.x}% ${fp.y}%` }

  const hasImage = Boolean(question.imageUrl)
  const isCover =
    question.type === 'section' && hasImage && (question.sectionLayout ?? 'cover') === 'cover'
  const isSplit =
    question.type === 'section' &&
    hasImage &&
    (question.sectionLayout === 'image-left' || question.sectionLayout === 'image-right')
  const isSectionNoImg = question.type === 'section' && !hasImage

  const countdown = `${question.timeLimitSeconds}s`
  const metaChipLabel = question.isDemo ? 'Demo' : `${question.points} pts · ${countdown}`

  /* ─── Section: cover (full-bleed portrait) ─────────────────────────── */
  if (isCover) {
    return (
      <div
        className="relative overflow-hidden bg-black"
        style={{ width: W, height: H, flexShrink: 0 }}
      >
        <img
          src={question.imageUrl}
          className="absolute inset-0 h-full w-full object-cover"
          style={fpStyle}
          alt=""
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-10 text-center">
          <h2 className="text-[2.2rem] font-[family-name:var(--font-heading)] font-semibold leading-tight text-white drop-shadow-lg">
            {question.prompt || 'Untitled'}
          </h2>
          {question.acceptedAnswer && (
            <p className="mt-4 text-lg text-white/80 drop-shadow">
              {question.acceptedAnswer}
            </p>
          )}
        </div>
      </div>
    )
  }

  /* ─── Section: image-left / image-right → image-top on mobile ───────── */
  if (isSplit) {
    return (
      <div
        className="flex flex-col overflow-hidden bg-page"
        style={{ width: W, height: H, flexShrink: 0 }}
      >
        {/* Image fills top 40% */}
        <div className="relative shrink-0 overflow-hidden" style={{ height: Math.round(H * 0.40) }}>
          <img
            src={question.imageUrl}
            className="absolute inset-0 h-full w-full object-cover"
            style={fpStyle}
            alt=""
          />
        </div>

        {/* Text content */}
        <div className="flex flex-1 flex-col items-center justify-center px-10 py-8 text-center">
          <h2 className="text-[1.75rem] font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi">
            {question.prompt || 'Untitled'}
          </h2>
          {question.acceptedAnswer && (
            <p className="mt-4 text-lg leading-relaxed text-lo">{question.acceptedAnswer}</p>
          )}
        </div>
      </div>
    )
  }

  /* ─── Section: no image ─────────────────────────────────────────────── */
  if (isSectionNoImg) {
    return (
      <div
        className="flex flex-col items-center justify-center overflow-hidden bg-page px-10 text-center"
        style={{ width: W, height: H, flexShrink: 0 }}
      >
        <h2 className="text-[2.2rem] font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi">
          {question.prompt || 'Untitled'}
        </h2>
        {question.acceptedAnswer && (
          <p className="mt-5 text-lg leading-relaxed text-lo">{question.acceptedAnswer}</p>
        )}
      </div>
    )
  }

  /* ─── Question slides ───────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col overflow-hidden bg-page"
      style={{ width: W, height: H, flexShrink: 0 }}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 px-5 pb-3 pt-6">
        <span className="slide-chip bg-fill-hi text-lo">{`Q${questionNumber}`}</span>
        <span className="slide-chip bg-raised text-on-accent">{metaChipLabel}</span>
      </div>

      {/* Question prompt */}
      <div className="shrink-0 px-5 pb-5">
        <h2 className="font-[family-name:var(--font-heading)] text-[1.5rem] font-semibold leading-snug text-hi">
          {question.prompt || <span className="italic text-subtle">No question set</span>}
        </h2>
      </div>

      {/* Divider */}
      <div className="mx-5 shrink-0 border-t border-line" />

      {/* Content area */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-hidden px-5 py-5">

        {/* MCQ / True-False */}
        {(question.type === 'mcq' || question.type === 'true_false') &&
          question.options.length > 0 && (() => {
            const mode = question.optionDisplayMode ?? 'text'
            const count = question.options.length
            if (mode === 'image' || mode === 'text+image') {
              const cols = count === 4 ? 2 : 1
              const LABEL_H = mode === 'text+image' ? 24 : 0
              const CONTENT_W = W - 40  // px-5 each side
              const gap = 8
              const rows = Math.ceil(count / cols)
              const maxFromW = (CONTENT_W - (cols - 1) * gap) / cols
              const maxFromH = (CONTENT_H - rows * LABEL_H - (rows - 1) * gap) / rows
              const imgSize = Math.floor(Math.min(maxFromW, maxFromH))
              const cardH = imgSize + LABEL_H
              return (
                <div className="flex flex-1 min-h-0 items-center justify-center">
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${imgSize}px)`, gridTemplateRows: `repeat(${rows}, ${cardH}px)`, gap }}>
                    {question.options.map((opt, i) => (
                      <div key={opt.id} className={cn('flex flex-col overflow-hidden rounded-2xl border', OPTION_COLORS[i % OPTION_COLORS.length])}>
                        <div className="relative overflow-hidden bg-fill" style={{ width: imgSize, height: imgSize, flexShrink: 0 }}>
                          {opt.imageUrl
                            ? <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" />
                            : <div className="flex h-full items-center justify-center text-xs text-faded">{OPTION_LETTERS[i]}</div>
                          }
                          <span className="absolute left-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-black/40 text-[8px] font-bold text-white">{OPTION_LETTERS[i]}</span>
                        </div>
                        {mode === 'text+image' && (
                          <div className="shrink-0 px-2 py-1" style={{ height: LABEL_H }}>
                            <p className={cn('truncate text-[10px] font-medium', opt.label ? 'text-md' : 'italic text-faded')}>{opt.label || OPTION_LETTERS[i]}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            // text mode
            return question.options.map((opt, i) => (
              <div
                key={opt.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4',
                  OPTION_COLORS[i % OPTION_COLORS.length],
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-input-bg text-xs font-bold text-lo">
                  {OPTION_LETTERS[i]}
                </span>
                <p className={cn('flex-1 text-base font-medium leading-snug', opt.label ? 'text-md' : 'italic text-faded')}>
                  {opt.label || `Option ${OPTION_LETTERS[i]}`}
                </p>
                {opt.isCorrect && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ok-tint">
                    <Check className="size-3.5 text-ok-fg" />
                  </div>
                )}
              </div>
            ))
          })()}

        {/* Short text */}
        {question.type === 'short_text' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-10 text-center">
            <PenLine className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-base text-faded">Players type their answer</p>
            {question.acceptedAnswer && (
              <p className="mt-2 text-sm text-subtle">Scoring: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* Emoji */}
        {question.type === 'emoji' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-10 text-center">
            <p className="text-6xl leading-relaxed">{question.emojiPrompt || '🎯 🎲 🎪'}</p>
            <p className="mt-4 text-base text-faded">Players guess from the emoji clue</p>
            {question.acceptedAnswer && (
              <p className="mt-2 text-sm text-ok-fg">Answer: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

        {/* Image guess */}
        {question.type === 'image_guess' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-10 text-center">
            <Image className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-base text-faded">Image reveal question</p>
            {question.acceptedAnswer && (
              <p className="mt-2 text-sm text-ok-fg">Answer: {question.acceptedAnswer}</p>
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
                  className="flex size-14 items-center justify-center rounded-2xl border border-form bg-fill-hi text-xl font-bold text-dim"
                >
                  {n}
                </div>
              ))}
            </div>
            <p className="mt-4 text-base text-faded">Players rate from 1 to 5</p>
          </div>
        )}

        {/* Number guess */}
        {question.type === 'number_guess' && (
          <div className="rounded-2xl border border-dashed border-edge bg-fill p-10 text-center">
            <Hash className="mx-auto mb-3 size-8 text-subtle" />
            <p className="text-base text-faded">Players guess a number</p>
            {question.acceptedAnswer && (
              <p className="mt-2 text-sm text-ok-fg">Answer: {question.acceptedAnswer}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
