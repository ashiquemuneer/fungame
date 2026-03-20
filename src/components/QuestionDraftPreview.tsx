import { ImageIcon, MessageSquareText } from 'lucide-react'
import { QuestionOptionCard } from './QuestionOptionCard'
import { ImageRevealCanvas } from './ImageRevealCanvas'
import type { QuestionDraft } from '../types/game'
import { cn } from '../lib/utils'
import { getVerticalOptionGridStyle, resolveSlideLayout } from '../lib/slide-layout'

interface QuestionDraftPreviewProps {
  draft: QuestionDraft
}

export function QuestionDraftPreview({ draft }: QuestionDraftPreviewProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Slide preview</p>
          <h4 className="mt-2 text-2xl font-semibold text-white">Live question canvas</h4>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/60">
          16:9 preview
        </div>
      </div>

      <div className="slide-surface aspect-[16/9] rounded-[1.7rem] border border-white/12 p-2 shadow-[0_22px_82px_rgba(0,0,0,0.25)] sm:p-2.5">
        <div className="flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-white/8 bg-black/12 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="slide-chip bg-white/12 text-white/70">Preview</span>
              <span className="slide-chip bg-orange-300/12 text-orange-100">
                {draft.type.replace('_', ' ')}
              </span>
            </div>

            <div className="slide-chip bg-white text-stone-950">
              {draft.type === 'section'
                ? 'Section'
                : draft.isDemo
                  ? 'Demo round'
                  : `${draft.points} pts · ${draft.timeLimitSeconds}s`}
            </div>
          </div>

          {draft.type !== 'section' ? (
            <div className="mt-2.5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-orange-200/70 sm:text-xs">
                Draft slide
              </p>
              <h3 className="mt-2 max-w-4xl font-['Sora','Avenir_Next',sans-serif] text-xl font-semibold leading-tight text-white sm:text-2xl xl:text-3xl">
                {prompt}
              </h3>
            </div>
          ) : null}

          <div className="mt-2.5 min-h-0 flex-1">
            {draft.type === 'section' ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <div className="mx-auto max-w-4xl">
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-200/70">
                    Draft section
                  </p>
                  <h3 className="mt-5 font-['Sora','Avenir_Next',sans-serif] text-4xl font-semibold leading-tight text-white sm:text-5xl xl:text-6xl">
                    {prompt}
                  </h3>
                  <p className="mt-5 text-base leading-8 text-white/70 sm:text-lg">
                    {draft.acceptedAnswer.trim() ||
                      'Introduce the next round, game mode, or instructions here.'}
                  </p>
                </div>
              </div>
            ) : draft.type === 'short_text' ? (
              <div className="flex h-full flex-col justify-end">
                <div className="rounded-[1.4rem] border border-dashed border-white/20 bg-white/4 px-5 py-4 text-sm text-white/60 sm:text-base">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="size-5 text-orange-100" />
                    Audience enters a short text response here
                  </div>
                </div>
              </div>
            ) : draft.type === 'emoji' ? (
              <div className="flex h-full flex-col justify-center">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-center text-center">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/4 px-8 py-8">
                    <p className="text-[3rem] leading-[1.15] sm:text-[4rem] xl:text-[5rem]">
                      {emojiPrompt}
                    </p>
                  </div>
                  <div className="mt-5 rounded-[1.3rem] border border-dashed border-white/15 bg-white/4 px-5 py-4 text-sm text-white/60 sm:text-base">
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
                <div className="rounded-[1.3rem] border border-dashed border-white/15 bg-white/4 px-5 py-4 text-sm text-white/60 sm:text-base">
                  Players type the logo, brand, movie, place, or name they think this cropped image belongs to.
                </div>
              </div>
            ) : resolvedLayout === 'right' ? (
              <div className="grid h-full min-h-0 gap-2.5 xl:grid-cols-[minmax(0,_1fr)_minmax(260px,_32%)]">
                <div
                  className={cn(
                    'min-h-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/95',
                    draft.imageUrl.trim() ? '' : 'flex items-center justify-center bg-white/4',
                  )}
                >
                  {draft.imageUrl.trim() ? (
                    <img
                      alt="Question"
                      className="h-full w-full object-contain p-2"
                      src={draft.imageUrl}
                    />
                  ) : (
                    <div className="px-4 text-center text-sm text-white/55">
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
                      index={index}
                      key={option.id}
                      option={option}
                    />
                  ))}
                </div>
              </div>
            ) : visibleOptions.length > 0 ? (
              <div className={cn('grid h-full min-h-0 gap-2.5', visibleOptions.length > 1 ? 'sm:grid-cols-2' : '')}>
                {draft.imageUrl.trim() ? (
                  <div className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/95">
                    <img
                      alt="Question"
                      className="h-24 w-full object-contain p-2 sm:h-28 xl:h-32"
                      src={draft.imageUrl}
                    />
                  </div>
                ) : null}
                {visibleOptions.map((option, index) => (
                  <QuestionOptionCard fillHeight index={index} key={option.id} option={option} />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-end gap-2.5">
                {draft.imageUrl.trim() ? (
                  <div className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/95">
                    <img
                      alt="Question"
                      className="h-24 w-full object-contain p-2 sm:h-28 xl:h-32"
                      src={draft.imageUrl}
                    />
                  </div>
                ) : null}
                <div className="rounded-[1.3rem] border border-dashed border-white/20 bg-white/4 px-5 py-4 text-sm text-white/60 sm:text-base">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="size-5 text-orange-100" />
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
