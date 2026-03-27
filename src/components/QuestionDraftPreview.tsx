import { ImageIcon, MessageSquareText } from 'lucide-react'
import { QuestionOptionCard } from './QuestionOptionCard'
import { ImageRevealCanvas } from './ImageRevealCanvas'
import type { OptionDisplayMode, QuestionDraft } from '../types/game'
import { cn } from '../lib/utils'
import { getVerticalOptionGridStyle, resolveSlideLayout } from '../lib/slide-layout'

interface QuestionDraftPreviewProps {
  draft: QuestionDraft
  onOptionFocus?: (id: string) => void
}

function getGridLayout(count: number, mode: OptionDisplayMode) {
  const hasImages = mode !== 'text'
  let cols: number
  if (!hasImages) {
    cols = count === 1 ? 1 : count === 3 ? 3 : 2
  } else {
    if (count <= 2) cols = 2
    else if (count === 3) cols = 3
    else if (count === 4) cols = 4
    else cols = 3
  }
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

export function QuestionDraftPreview({ draft, onOptionFocus }: QuestionDraftPreviewProps) {
  const prompt = draft.prompt.trim() || 'Your question will appear here'
  const emojiPrompt = draft.emojiPrompt.trim() || '🚢🧊🚫🧍‍♀️❄️'
  const visibleOptions = draft.options.filter(
    (option) => option.label.trim() || option.imageUrl?.trim(),
  )
  const hasQuestionImage = Boolean(draft.imageUrl.trim())
  const resolvedLayout = resolveSlideLayout(
    draft.slideLayout,
    visibleOptions.length,
    hasQuestionImage,
  )
  const metaChipLabel = draft.isDemo ? 'Demo' : `${draft.points} pts · ${draft.timeLimitSeconds}s`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-faded">Slide preview</p>
          <h4 className="mt-2 text-2xl font-semibold text-hi">Live question canvas</h4>
        </div>
        <div className="rounded-full border border-edge bg-fill px-4 py-2 text-sm text-lo">
          16:9 preview
        </div>
      </div>

      <div className="slide-surface aspect-[16/9] rounded-[1.7rem] border border-edge p-2 shadow-[var(--shadow-xl)] sm:p-2.5">
        <div className="flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-line bg-input-bg p-3">
          {draft.type !== 'section' ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="slide-chip bg-fill-hi text-lo">Q</span>
              <span className="slide-chip bg-raised text-on-accent">{metaChipLabel}</span>
            </div>
          ) : null}

          {draft.type !== 'section' ? (
            <div className="mt-2.5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-accent-text sm:text-xs">
                Draft slide
              </p>
              <h3 className="mt-2 max-w-4xl font-[family-name:var(--font-heading)] text-xl font-semibold leading-tight text-hi sm:text-2xl xl:text-3xl">
                {prompt}
              </h3>
            </div>
          ) : null}

          <div className="mt-2.5 min-h-0 flex-1">
            {draft.type === 'section' ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <div className="mx-auto max-w-4xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-accent-text">
                    Draft section
                  </p>
                  <h3 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-hi sm:text-5xl xl:text-6xl">
                    {prompt}
                  </h3>
                  <p className="mt-5 text-base leading-8 text-lo sm:text-lg">
                    {draft.acceptedAnswer.trim() ||
                      'Introduce the next round, game mode, or instructions here.'}
                  </p>
                </div>
              </div>
            ) : draft.type === 'short_text' ? (
              <div className="flex h-full flex-col justify-end">
                <div className="rounded-[1.4rem] border border-dashed border-rim bg-fill px-5 py-4 text-sm text-lo sm:text-base">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="size-5 text-accent-text" />
                    Audience enters a short text response here
                  </div>
                </div>
              </div>
            ) : draft.type === 'emoji' ? (
              <div className="flex h-full flex-col justify-center">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-center text-center">
                  <div className="rounded-[1.6rem] border border-edge bg-fill px-8 py-8">
                    <p className="text-[4rem] leading-[1.1] sm:text-[5rem] xl:text-[6rem]">
                      {emojiPrompt}
                    </p>
                  </div>
                  <div className="mt-5 rounded-[1.3rem] border border-dashed border-rim bg-fill px-5 py-4 text-sm text-lo sm:text-base">
                    Players type what these emoji clues represent.
                  </div>
                </div>
              </div>
            ) : draft.type === 'image_guess' ? (
              <div className="flex h-full flex-col gap-4">
                <div className="flex-1 min-h-0">
                  <ImageRevealCanvas
                    alt="Guess image preview"
                    className="h-full"
                    config={draft.imageRevealConfig}
                    src={draft.imageUrl}
                  />
                </div>
                <div className="rounded-[1.3rem] border border-dashed border-rim bg-fill px-5 py-4 text-sm text-lo sm:text-base">
                  Players type the logo, brand, movie, place, or name they think this cropped image belongs to.
                </div>
              </div>
            ) : resolvedLayout === 'right' ? (
              <div className="grid h-full min-h-0 gap-2.5 xl:grid-cols-[minmax(0,_1fr)_minmax(260px,_32%)]">
                <div
                  className={cn(
                    'min-h-0 overflow-hidden rounded-[1.2rem] border border-edge bg-raised',
                    draft.imageUrl.trim() ? '' : 'flex items-center justify-center bg-fill',
                  )}
                >
                  {draft.imageUrl.trim() ? (
                    <img
                      alt="Question"
                      className="h-full w-full object-contain p-2"
                      src={draft.imageUrl}
                    />
                  ) : (
                    <div className="px-4 text-center text-sm text-dim">
                      Add a question image to use this area.
                    </div>
                  )}
                </div>

                <div
                  className="grid min-h-0 gap-2"
                  style={getVerticalOptionGridStyle(visibleOptions.length)}
                >
                  {visibleOptions.map((option, index) => (
                    <QuestionOptionCard
                      compact
                      fillHeight
                      displayMode={draft.optionDisplayMode ?? 'text'}
                      index={index}
                      key={option.id}
                      option={option}
                    />
                  ))}
                </div>
              </div>
            ) : visibleOptions.length > 0 ? (
              (() => {
                const mode = draft.optionDisplayMode ?? 'text'
                const { cols, rows } = getGridLayout(visibleOptions.length, mode)
                return (
                  <div
                    className="grid h-full min-h-0 gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    }}
                  >
                    {draft.imageUrl.trim() && cols === 2 ? (
                      <div className="col-span-full overflow-hidden rounded-[1.2rem] border border-edge bg-raised">
                        <img alt="Question" className="h-20 w-full object-contain p-2" src={draft.imageUrl} />
                      </div>
                    ) : null}
                    {visibleOptions.map((option, index) => (
                      <div
                        key={option.id}
                        className={onOptionFocus ? 'cursor-pointer' : ''}
                        onClick={() => onOptionFocus?.(option.id)}
                      >
                        <QuestionOptionCard
                          fillHeight
                          displayMode={mode}
                          index={index}
                          option={option}
                        />
                      </div>
                    ))}
                  </div>
                )
              })()
            ) : (
              <div className="flex h-full flex-col justify-end gap-2.5">
                {draft.imageUrl.trim() ? (
                  <div className="overflow-hidden rounded-[1.2rem] border border-edge bg-raised">
                    <img
                      alt="Question"
                      className="h-24 w-full object-contain p-2 sm:h-28 xl:h-32"
                      src={draft.imageUrl}
                    />
                  </div>
                ) : null}
                <div className="rounded-[1.3rem] border border-dashed border-rim bg-fill px-5 py-4 text-sm text-lo sm:text-base">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="size-5 text-accent-text" />
                    Add answer options on the right panel to preview them here
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
