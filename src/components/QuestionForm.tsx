import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createQuestionDraft, generateId } from '../lib/mock-data'
import type { Question, QuestionDraft, QuestionType } from '../types/game'
import { ImageAssetField } from './ImageAssetField'
import { QuestionDraftPreview } from './QuestionDraftPreview'

interface QuestionFormProps {
  initialQuestion?: Question
  onSubmit: (draft: QuestionDraft) => void
  onCancelEdit?: () => void
}

function draftFromQuestion(question?: Question): QuestionDraft {
  if (!question) {
    return createQuestionDraft()
  }

  return {
    type: question.type,
    prompt: question.prompt,
    emojiPrompt: question.emojiPrompt ?? '',
    imageUrl: question.imageUrl ?? '',
    imageRevealConfig: question.imageRevealConfig ?? createQuestionDraft().imageRevealConfig,
    acceptedAnswer: question.acceptedAnswer ?? '',
    slideLayout: question.slideLayout ?? 'auto',
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    isDemo: question.isDemo ?? false,
    isTieBreaker: question.isTieBreaker,
    options:
      question.options.length > 0
        ? question.options
        : createQuestionDraft().options,
  }
}

export function QuestionForm({ initialQuestion, onSubmit, onCancelEdit }: QuestionFormProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() => draftFromQuestion(initialQuestion))

  useEffect(() => {
    setDraft(draftFromQuestion(initialQuestion))
  }, [initialQuestion])

  const canAddOption = useMemo(
    () => draft.type === 'mcq' && draft.options.length < 6,
    [draft.options.length, draft.type],
  )

  const handleTypeChange = (type: QuestionType) => {
    setDraft((current) => {
      if (type === 'true_false') {
        return {
          ...current,
          type,
          options: [
            {
              id: current.options[0]?.id ?? generateId('opt'),
              label: 'True',
              imageUrl: current.options[0]?.imageUrl ?? '',
              isCorrect: true,
            },
            {
              id: current.options[1]?.id ?? generateId('opt'),
              label: 'False',
              imageUrl: current.options[1]?.imageUrl ?? '',
              isCorrect: false,
            },
          ],
        }
      }

      if (type === 'short_text') {
        return {
          ...current,
          type,
          options: [],
        }
      }

      if (type === 'emoji') {
        return {
          ...current,
          type,
          imageUrl: '',
          options: [],
        }
      }

      if (type === 'image_guess') {
        return {
          ...current,
          type,
          emojiPrompt: '',
          options: [],
        }
      }

      if (type === 'section') {
        return {
          ...current,
          type,
          options: [],
          points: 0,
          timeLimitSeconds: 0,
          isDemo: false,
          isTieBreaker: false,
        }
      }

      return {
        ...current,
        type,
        options:
          current.options.length >= 2
            ? current.options
            : createQuestionDraft().options,
      }
    })
  }

  return (
    <form
      className="grid items-start gap-2 lg:grid-cols-[minmax(0,_1fr)_300px] xl:grid-cols-[minmax(0,_1fr)_340px] 2xl:grid-cols-[minmax(0,_1fr)_370px]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(draft)
        if (!initialQuestion) {
          setDraft(createQuestionDraft())
        }
      }}
    >
      <div className="min-w-0">
        <QuestionDraftPreview draft={draft} />
      </div>

      <aside className="min-w-0 space-y-2 lg:sticky lg:top-2 lg:h-fit lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1">
        <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Content</p>
          <div className="mt-3 space-y-3">
            <label className="space-y-2 text-sm text-white/80">
              <span>Question prompt</span>
              <textarea
                className="input min-h-32"
                placeholder={
                  draft.type === 'emoji' || draft.type === 'image_guess'
                    ? 'Example: Guess the movie title'
                    : 'What are we asking the team?'
                }
                value={draft.prompt}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, prompt: event.target.value }))
                }
                required
              />
            </label>

            {draft.type === 'emoji' ? (
              <label className="space-y-2 text-sm text-white/80">
                <span>Emoji clue</span>
                <textarea
                  className="input min-h-28 text-3xl leading-relaxed"
                  placeholder="🚢🧊🚫🧍‍♀️❄️"
                  value={draft.emojiPrompt}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, emojiPrompt: event.target.value }))
                  }
                  required
                />
              </label>
            ) : (
              <ImageAssetField
                label={draft.type === 'image_guess' ? 'Source image' : 'Question image'}
                value={draft.imageUrl}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, imageUrl: value }))
                }
              />
            )}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Slide settings</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-white/80 sm:col-span-2">
              <span>Question type</span>
              {/* ── Grouped type picker ── */}
              <div className="space-y-3 pt-1">
                {/* Quiz questions */}
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-white/35">Quiz</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {([
                      { value: 'mcq',        label: 'Multiple choice', emoji: '🔘' },
                      { value: 'true_false', label: 'True / False',    emoji: '✅' },
                      { value: 'short_text', label: 'Short text',      emoji: '✏️' },
                    ] as { value: QuestionType; label: string; emoji: string }[]).map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTypeChange(value)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                          draft.type === value
                            ? 'border-orange-300/40 bg-orange-300/10 text-orange-200'
                            : 'border-white/8 bg-white/4 text-white/60 hover:border-white/15 hover:bg-white/8 hover:text-white/80'
                        }`}
                      >
                        <span className="text-base leading-none">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Media / special */}
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-white/35">Media &amp; Special</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {([
                      { value: 'emoji',       label: 'Emoji guess',  emoji: '😄' },
                      { value: 'image_guess', label: 'Image reveal', emoji: '🖼️' },
                      { value: 'section',     label: 'Section slide', emoji: '📌' },
                    ] as { value: QuestionType; label: string; emoji: string }[]).map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTypeChange(value)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                          draft.type === value
                            ? 'border-orange-300/40 bg-orange-300/10 text-orange-200'
                            : 'border-white/8 bg-white/4 text-white/60 hover:border-white/15 hover:bg-white/8 hover:text-white/80'
                        }`}
                      >
                        <span className="text-base leading-none">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {draft.type !== 'section' && draft.type !== 'emoji' && draft.type !== 'image_guess' ? (
              <label className="space-y-2 text-sm text-white/80 sm:col-span-2">
                <span>Slide view</span>
                <select
                  className="input"
                  value={draft.slideLayout}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      slideLayout: event.target.value as QuestionDraft['slideLayout'],
                    }))
                  }
                >
                  <option value="auto">Auto (recommended)</option>
                  <option value="bottom">Options below question</option>
                  <option value="right">Options on right side</option>
                </select>
              </label>
            ) : null}

            {draft.type !== 'section' && !draft.isDemo ? (
              <label className="space-y-2 text-sm text-white/80">
                <span>Timer (sec)</span>
                <input
                  className="input"
                  min={5}
                  max={120}
                  type="number"
                  value={draft.timeLimitSeconds}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      timeLimitSeconds: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 px-4 py-3 text-sm text-white/55">
                Section slides do not use timers.
              </div>
            )}

            {draft.type !== 'section' ? (
              <>
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/80 sm:col-span-2">
                  <input
                    checked={draft.isDemo}
                    className="size-4 accent-orange-300"
                    type="checkbox"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        isDemo: event.target.checked,
                        points:
                          event.target.checked
                            ? 0
                            : current.points > 0
                              ? current.points
                              : 10,
                        timeLimitSeconds:
                          event.target.checked
                            ? 0
                            : current.timeLimitSeconds > 0
                              ? current.timeLimitSeconds
                              : 20,
                        isTieBreaker: event.target.checked ? false : current.isTieBreaker,
                      }))
                    }
                  />
                  Demo option
                </label>
                {!draft.isDemo ? (
                  <label className="space-y-2 text-sm text-white/80">
                    <span>Points</span>
                    <input
                      className="input"
                      min={1}
                      max={100}
                      type="number"
                      value={draft.points}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, points: Number(event.target.value) }))
                      }
                    />
                  </label>
                ) : null}
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/80 sm:col-span-2">
                  <input
                    checked={draft.isTieBreaker}
                    className="size-4 accent-orange-300"
                    disabled={draft.isDemo}
                    type="checkbox"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, isTieBreaker: event.target.checked }))
                    }
                  />
                  Mark as tie-breaker
                </label>
              </>
            ) : (
              <label className="space-y-2 text-sm text-white/80 sm:col-span-2">
                <span>Section subtitle</span>
                <textarea
                  className="input min-h-28"
                  placeholder="Introduce the next round or explain what comes next."
                  value={draft.acceptedAnswer}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, acceptedAnswer: event.target.value }))
                  }
                />
              </label>
            )}
          </div>
        </section>

        {draft.type === 'short_text' ? (
          <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Scoring</p>
            <label className="mt-4 block space-y-2 text-sm text-white/80">
              <span>Scoring guidance for host (optional)</span>
              <input
                className="input"
                placeholder="Example: score thoughtful answers with 5 to 15 points"
                value={draft.acceptedAnswer}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, acceptedAnswer: event.target.value }))
                }
              />
            </label>
          </section>
        ) : draft.type === 'emoji' ? (
          <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Emoji answer</p>
            <div className="mt-3 space-y-3">
              <label className="block space-y-2 text-sm text-white/80">
                <span>Correct answer</span>
                <input
                  className="input"
                  placeholder="Titanic"
                  value={draft.acceptedAnswer}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, acceptedAnswer: event.target.value }))
                  }
                />
              </label>
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/4 px-4 py-4 text-sm leading-7 text-white/60">
                Players type the movie, brand, place, or phrase they think the emoji clues represent.
                Exact matches score automatically.
              </div>
              <div className="rounded-2xl border border-dashed border-orange-200/20 bg-orange-300/6 px-4 py-4 text-sm leading-7 text-orange-50/80">
                Example: <span className="font-medium">🚢🧊🚫🧍‍♀️❄️</span> {'->'} <span className="font-medium">Titanic</span>
              </div>
            </div>
          </section>
        ) : draft.type === 'image_guess' ? (
          <>
            <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Image answer</p>
              <div className="mt-3 space-y-3">
                <label className="block space-y-2 text-sm text-white/80">
                  <span>Correct answer</span>
                  <input
                    className="input"
                    placeholder="Titanic"
                    value={draft.acceptedAnswer}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, acceptedAnswer: event.target.value }))
                    }
                  />
                </label>
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/4 px-4 py-4 text-sm leading-7 text-white/60">
                  Upload the full image, then crop and rotate it to reveal just a confusing piece.
                  During the live game the host can tap <span className="font-medium text-white">Show more</span> if nobody gets it.
                </div>
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Crop and reveal</p>
              <div className="mt-3 space-y-3">
                <label className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Zoom</span>
                    <span className="text-white/55">{draft.imageRevealConfig.zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    className="w-full accent-orange-300"
                    max={5}
                    min={1}
                    step={0.1}
                    type="range"
                    value={draft.imageRevealConfig.zoom}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        imageRevealConfig: {
                          ...current.imageRevealConfig,
                          zoom: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Rotate</span>
                    <span className="text-white/55">{draft.imageRevealConfig.rotation}deg</span>
                  </div>
                  <input
                    className="w-full accent-orange-300"
                    max={180}
                    min={-180}
                    step={1}
                    type="range"
                    value={draft.imageRevealConfig.rotation}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        imageRevealConfig: {
                          ...current.imageRevealConfig,
                          rotation: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Horizontal crop</span>
                    <span className="text-white/55">{draft.imageRevealConfig.focusX}%</span>
                  </div>
                  <input
                    className="w-full accent-orange-300"
                    max={100}
                    min={0}
                    step={1}
                    type="range"
                    value={draft.imageRevealConfig.focusX}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        imageRevealConfig: {
                          ...current.imageRevealConfig,
                          focusX: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Vertical crop</span>
                    <span className="text-white/55">{draft.imageRevealConfig.focusY}%</span>
                  </div>
                  <input
                    className="w-full accent-orange-300"
                    max={100}
                    min={0}
                    step={1}
                    type="range"
                    value={draft.imageRevealConfig.focusY}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        imageRevealConfig: {
                          ...current.imageRevealConfig,
                          focusY: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>

                <label className="space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Show more step</span>
                    <span className="text-white/55">{draft.imageRevealConfig.revealStep.toFixed(2)}x</span>
                  </div>
                  <input
                    className="w-full accent-orange-300"
                    max={1.25}
                    min={0.15}
                    step={0.05}
                    type="range"
                    value={draft.imageRevealConfig.revealStep}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        imageRevealConfig: {
                          ...current.imageRevealConfig,
                          revealStep: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>
              </div>
            </section>
          </>
        ) : draft.type === 'section' ? (
          <section className="rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Section slide</p>
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/4 px-4 py-4 text-sm leading-7 text-white/60">
              Use section slides to separate rounds, introduce the next game, or show a short
              title card between questions.
            </div>
          </section>
        ) : (
          <section className="space-y-2 rounded-[1.35rem] border border-white/10 bg-black/15 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Answer options</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Inspector</h3>
                <p className="mt-2 text-sm text-white/60">
                  Mark the correct option so objective rounds score automatically.
                </p>
              </div>

              {canAddOption ? (
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      options: [
                        ...current.options,
                        { id: generateId('opt'), label: '', imageUrl: '', isCorrect: false },
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" />
                  Add option
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              {draft.options.map((option) => (
                <div
                  key={option.id}
                  className="space-y-3 rounded-2xl border border-white/8 bg-white/4 p-3"
                >
                  <input
                    className="input"
                    disabled={draft.type === 'true_false'}
                    placeholder="Option label"
                    value={option.label}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        options: current.options.map((item) =>
                          item.id === option.id ? { ...item, label: event.target.value } : item,
                        ),
                      }))
                    }
                  />

                  <ImageAssetField
                    label="Option image"
                    value={option.imageUrl ?? ''}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        options: current.options.map((item) =>
                          item.id === option.id ? { ...item, imageUrl: value } : item,
                        ),
                      }))
                    }
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/75">
                      <input
                        checked={option.isCorrect}
                        className="accent-orange-300"
                        name="correct-option"
                        type="radio"
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            options: current.options.map((item) => ({
                              ...item,
                              isCorrect: item.id === option.id,
                            })),
                          }))
                        }
                      />
                      Correct
                    </label>

                    {draft.type === 'mcq' && draft.options.length > 2 ? (
                      <button
                        className="button-ghost justify-center rounded-full border border-white/10"
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            options: current.options.filter((item) => item.id !== option.id),
                          }))
                        }
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-2">
          {initialQuestion && onCancelEdit ? (
            <button className="button-secondary" type="button" onClick={onCancelEdit}>
              Cancel edit
            </button>
          ) : null}

          <button className="button-primary" type="submit">
            {initialQuestion ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </aside>
    </form>
  )
}
