import type { Question } from '../types/game'
import { cn } from '../lib/utils'

// Rendered at full 960×540, then CSS-scaled to fit the thumbnail container.
// Container must be aspect-[16/9] w-full overflow-hidden with position:relative.
const FULL_W = 960
const FULL_H = 540

const OPTION_COLORS = [
  'border border-accent-dim bg-accent-dim text-accent-text',
  'border border-note-line bg-note-tint text-note-fg',
  'border border-warn-line bg-warn-tint text-warn-fg',
  'border border-ok-line bg-ok-tint text-ok-fg',
]

interface Props {
  question: Question
  /** Visual scale factor — default 0.2 (192px wide container). */
  scale?: number
  className?: string
}

export function SlideThumb({ question, scale = 0.2, className }: Props) {
  const fp     = question.imageFocalPoint ?? { x: 50, y: 50 }
  const fpStyle = { objectPosition: `${fp.x}% ${fp.y}%` }
  const hasImage  = Boolean(question.imageUrl)
  const layout    = question.type === 'section' && hasImage
    ? (question.sectionLayout ?? 'cover')
    : null

  return (
    <div
      className={cn('relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-page', className)}
      style={{ containerType: 'inline-size' }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{ width: FULL_W, height: FULL_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* ── Section: cover ── */}
        {layout === 'cover' && (
          <>
            <img src={question.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-20 text-center">
              <h2 className="font-[family-name:var(--font-heading)] text-5xl font-semibold leading-tight text-white drop-shadow-lg">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && (
                <p className="mt-5 text-xl text-white/80">{question.acceptedAnswer}</p>
              )}
            </div>
          </>
        )}

        {/* ── Section: image-left ── */}
        {layout === 'image-left' && (
          <div className="flex h-full bg-page">
            <div className="relative w-1/2 overflow-hidden">
              <img src={question.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
            </div>
            <div className="flex w-1/2 flex-col justify-center px-16">
              <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-hi">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && <p className="mt-4 text-lg text-lo">{question.acceptedAnswer}</p>}
            </div>
          </div>
        )}

        {/* ── Section: image-right ── */}
        {layout === 'image-right' && (
          <div className="flex h-full bg-page">
            <div className="flex w-1/2 flex-col justify-center px-16">
              <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-hi">
                {question.prompt || 'Untitled'}
              </h2>
              {question.acceptedAnswer && <p className="mt-4 text-lg text-lo">{question.acceptedAnswer}</p>}
            </div>
            <div className="relative w-1/2 overflow-hidden">
              <img src={question.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
            </div>
          </div>
        )}

        {/* ── All other slides ── */}
        {!layout && (
          <div className="flex h-full flex-col bg-page px-16 py-12">
            {/* Fake badge row */}
            <div className="mb-7 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-fill-hi" />
                <div className="h-6 w-14 rounded-full bg-accent-dim" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-fill" />
              </div>
            </div>

            {/* Section counter or Q counter */}
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-accent-text">
              {question.type === 'section' ? 'Section' : 'Question'}
            </p>

            {/* Prompt */}
            <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-hi">
              {question.prompt || 'Empty slide'}
            </h2>

            {/* Question image */}
            {hasImage && question.type !== 'section' && (
              <div className="mt-6 flex-1 overflow-hidden rounded-2xl border border-edge bg-raised">
                <img src={question.imageUrl} className="h-full w-full object-contain p-4" alt="" />
              </div>
            )}

            {/* Options grid */}
            {(question.type === 'mcq' || question.type === 'true_false') && question.options.length > 0 && (
              <div className="mt-auto grid grid-cols-2 gap-4">
                {question.options.slice(0, 4).map((opt, i) => (
                  <div key={opt.id} className={cn('rounded-2xl px-6 py-5 text-2xl font-semibold', OPTION_COLORS[i % 4])}>
                    {opt.label || '…'}
                  </div>
                ))}
              </div>
            )}

            {/* Emoji prompt */}
            {question.type === 'emoji' && question.emojiPrompt && (
              <p className="mt-6 text-7xl">{question.emojiPrompt}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
