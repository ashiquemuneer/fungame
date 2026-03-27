import { useEffect, useMemo, useRef, useState } from 'react'
import { type LucideIcon, CircleDot, Crop, Hash, ToggleLeft, PenLine, Smile, Image, ImageIcon, Layout, LayoutTemplate, Star, Plus, Trash2, Type } from 'lucide-react'
import { createQuestionDraft, generateId } from '../lib/mock-data'
import type { OptionDisplayMode, Question, QuestionDraft, QuestionType } from '../types/game'
import { ImageAssetField } from './ImageAssetField'
import { ImageCropModal } from './ImageCropModal'
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
    hostNotes: question.hostNotes ?? '',
    slideLayout: question.slideLayout ?? 'auto',
    optionDisplayMode: question.optionDisplayMode ?? 'text',
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    isDemo: question.isDemo ?? false,
    isTieBreaker: question.isTieBreaker,
    shortAnswerType: question.shortAnswerType ?? 'text',
    numberMin: question.numberMin,
    numberMax: question.numberMax,
    options:
      question.options.length > 0
        ? question.options
        : createQuestionDraft().options,
  }
}

export function QuestionForm({ initialQuestion, onSubmit, onCancelEdit }: QuestionFormProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() => draftFromQuestion(initialQuestion))
  const [activeOptId, setActiveOptId] = useState<string | null>(null)
  const [cropFor, setCropFor] = useState<string | null>(null)
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setDraft(draftFromQuestion(initialQuestion))
  }, [initialQuestion])

  useEffect(() => {
    if (!activeOptId) return
    const el = optionRefs.current[activeOptId]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeOptId])

  const canAddOption = useMemo(
    () => draft.type === 'mcq' && draft.options.length < 10,
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
        <QuestionDraftPreview draft={draft} onOptionFocus={setActiveOptId} />
      </div>

      <aside className="min-w-0 space-y-2 lg:sticky lg:top-2 lg:h-fit lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1">
        <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
          <p className="text-sm uppercase tracking-[0.12em] text-faded">Content</p>
          <div className="mt-3 space-y-3">
            <label className="space-y-2 text-sm text-md">
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
              <label className="space-y-2 text-sm text-md">
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

        <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
          <p className="text-sm uppercase tracking-[0.12em] text-faded">Slide settings</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-md sm:col-span-2">
              <span>Question type</span>
              {/* ── Grouped type picker ── */}
              <div className="space-y-3 pt-1">
                {/* Quiz questions */}
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-faded">Quiz</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {([
                      { value: 'mcq',        label: 'Multiple choice', icon: CircleDot  },
                      { value: 'true_false', label: 'True / False',    icon: ToggleLeft },
                      { value: 'short_text', label: 'Short text',      icon: PenLine    },
                    ] as { value: QuestionType; label: string; icon: LucideIcon }[]).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTypeChange(value)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                          draft.type === value
                            ? 'border-accent-dim bg-accent-dim text-accent-text'
                            : 'border-line bg-fill text-lo hover:border-edge hover:bg-fill-lo hover:text-md'
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Media / special */}
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-faded">Media &amp; Special</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {([
                      { value: 'emoji',        label: 'Emoji guess',    icon: Smile  },
                      { value: 'image_guess',  label: 'Image reveal',   icon: Image  },
                      { value: 'rating',       label: 'Rating 1–5',     icon: Star   },
                      { value: 'number_guess', label: 'Number guess',   icon: Hash   },
                      { value: 'section',      label: 'Section slide',  icon: Layout },
                    ] as { value: QuestionType; label: string; icon: LucideIcon }[]).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTypeChange(value)}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                          draft.type === value
                            ? 'border-accent-dim bg-accent-dim text-accent-text'
                            : 'border-line bg-fill text-lo hover:border-edge hover:bg-fill-lo hover:text-md'
                        }`}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {draft.type !== 'section' && draft.type !== 'emoji' && draft.type !== 'image_guess' ? (
              <label className="space-y-2 text-sm text-md sm:col-span-2">
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
              <label className="space-y-2 text-sm text-md">
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
              <div className="rounded-3xl border border-dashed border-rim bg-fill px-4 py-3 text-sm text-dim">
                Section slides do not use timers.
              </div>
            )}

            {draft.type !== 'section' ? (
              <>
                <label className="flex items-center gap-3 rounded-3xl border border-edge bg-fill px-4 py-3 text-sm text-md sm:col-span-2">
                  <input
                    checked={draft.isDemo}
                    className="size-4 accent-[var(--accent)]"
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
                  <label className="space-y-2 text-sm text-md">
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
                <label className="flex items-center gap-3 rounded-3xl border border-edge bg-fill px-4 py-3 text-sm text-md sm:col-span-2">
                  <input
                    checked={draft.isTieBreaker}
                    className="size-4 accent-[var(--accent)]"
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
              <label className="space-y-2 text-sm text-md sm:col-span-2">
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
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Answer Format</p>
            <div className="mt-4 space-y-4">
              <label className="block space-y-2 text-sm text-md">
                <span>Input type</span>
                <select
                  className="input w-full"
                  value={draft.shortAnswerType ?? 'text'}
                  onChange={(e) => setDraft((c) => ({ ...c, shortAnswerType: e.target.value as 'text' | 'number' }))}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
              </label>

              {draft.shortAnswerType === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2 text-sm text-md">
                    <span>Minimum (optional)</span>
                    <input
                      className="input w-full"
                      type="number"
                      placeholder="e.g. 0"
                      value={draft.numberMin ?? ''}
                      onChange={(e) => setDraft((c) => ({ ...c, numberMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-md">
                    <span>Maximum (optional)</span>
                    <input
                      className="input w-full"
                      type="number"
                      placeholder="e.g. 100"
                      value={draft.numberMax ?? ''}
                      onChange={(e) => setDraft((c) => ({ ...c, numberMax: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    />
                  </label>
                </div>
              )}

              <p className="mt-2 pt-3 text-sm uppercase tracking-[0.12em] text-faded border-t border-edge">Scoring</p>
              <label className="block space-y-2 text-sm text-md">
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
            </div>
          </section>
        ) : draft.type === 'emoji' ? (
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Emoji answer</p>
            <div className="mt-3 space-y-3">
              <label className="block space-y-2 text-sm text-md">
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
              <div className="rounded-2xl border border-dashed border-rim bg-fill px-4 py-4 text-sm leading-7 text-lo">
                Players type the movie, brand, place, or phrase they think the emoji clues represent.
                Exact matches score automatically.
              </div>
              <div className="rounded-2xl border border-dashed border-accent-dim bg-accent-dim px-4 py-4 text-sm leading-7 text-accent-text">
                Example: <span className="font-medium">🚢🧊🚫🧍‍♀️❄️</span> {'->'} <span className="font-medium">Titanic</span>
              </div>
            </div>
          </section>
        ) : draft.type === 'image_guess' ? (
          <>
            <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
              <p className="text-sm uppercase tracking-[0.12em] text-faded">Image answer</p>
              <div className="mt-3 space-y-3">
                <label className="block space-y-2 text-sm text-md">
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
                <div className="rounded-2xl border border-dashed border-rim bg-fill px-4 py-4 text-sm leading-7 text-lo">
                  Upload the full image, then crop and rotate it to reveal just a confusing piece.
                  During the live game the host can tap <span className="font-medium text-hi">Show more</span> if nobody gets it.
                </div>
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
              <p className="text-sm uppercase tracking-[0.12em] text-faded">Crop and reveal</p>
              <div className="mt-3 space-y-3">
                <label className="space-y-2 text-sm text-md">
                  <div className="flex items-center justify-between gap-3">
                    <span>Zoom</span>
                    <span className="text-dim">{draft.imageRevealConfig.zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
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

                <label className="space-y-2 text-sm text-md">
                  <div className="flex items-center justify-between gap-3">
                    <span>Rotate</span>
                    <span className="text-dim">{draft.imageRevealConfig.rotation}deg</span>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
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

                <label className="space-y-2 text-sm text-md">
                  <div className="flex items-center justify-between gap-3">
                    <span>Horizontal crop</span>
                    <span className="text-dim">{draft.imageRevealConfig.focusX}%</span>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
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

                <label className="space-y-2 text-sm text-md">
                  <div className="flex items-center justify-between gap-3">
                    <span>Vertical crop</span>
                    <span className="text-dim">{draft.imageRevealConfig.focusY}%</span>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
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

                <label className="space-y-2 text-sm text-md">
                  <div className="flex items-center justify-between gap-3">
                    <span>Show more step</span>
                    <span className="text-dim">{draft.imageRevealConfig.revealStep.toFixed(2)}x</span>
                  </div>
                  <input
                    className="w-full accent-[var(--accent)]"
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
        ) : draft.type === 'rating' ? (
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Rating question</p>
            <div className="mt-3 space-y-3">
              <label className="block space-y-2 text-sm text-md">
                <span>Target rating (optional — auto-scores exact match)</span>
                <input
                  className="input"
                  placeholder="e.g. 4"
                  type="number"
                  min={1}
                  max={5}
                  value={draft.acceptedAnswer}
                  onChange={(e) => setDraft((c) => ({ ...c, acceptedAnswer: e.target.value }))}
                />
              </label>
              <div className="rounded-2xl border border-dashed border-rim bg-fill px-4 py-4 text-sm leading-7 text-lo">
                Players pick a rating from 1 to 5 stars. Leave the target blank to use this as a poll — the host awards points manually.
              </div>
            </div>
          </section>
        ) : draft.type === 'number_guess' ? (
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Number guess</p>
            <div className="mt-3 space-y-3">
              <label className="block space-y-2 text-sm text-md">
                <span>Correct answer (number)</span>
                <input
                  className="input"
                  placeholder="e.g. 1969"
                  type="number"
                  value={draft.acceptedAnswer}
                  onChange={(e) => setDraft((c) => ({ ...c, acceptedAnswer: e.target.value }))}
                />
              </label>
              <div className="rounded-2xl border border-dashed border-rim bg-fill px-4 py-4 text-sm leading-7 text-lo">
                Players type any number. Exact matches score automatically. The host can use <span className="font-medium text-md">Score closest</span> in the session to award points to the nearest answer.
              </div>
            </div>
          </section>
        ) : draft.type === 'section' ? (
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Section slide</p>
            <div className="mt-4 rounded-2xl border border-dashed border-rim bg-fill px-4 py-4 text-sm leading-7 text-lo">
              Use section slides to separate rounds, introduce the next game, or show a short
              title card between questions.
            </div>
          </section>
        ) : (
          <section className="space-y-2 rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.12em] text-faded">Answer options</p>
                <h3 className="mt-2 text-xl font-semibold text-hi">Inspector</h3>
                <p className="mt-2 text-sm text-lo">
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

            {/* Option display mode */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-faded">Option display</p>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { value: 'text'       as OptionDisplayMode, label: 'Text',         icon: Type           },
                  { value: 'image'      as OptionDisplayMode, label: 'Image',        icon: ImageIcon      },
                  { value: 'text+image' as OptionDisplayMode, label: 'Text + Image', icon: LayoutTemplate },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft(c => ({ ...c, optionDisplayMode: value }))}
                    className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-left text-xs font-medium transition ${
                      draft.optionDisplayMode === value
                        ? 'border-accent-dim bg-accent-dim text-accent-text'
                        : 'border-line bg-fill text-lo hover:border-edge hover:text-md'
                    }`}
                  >
                    <Icon className="size-3 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {draft.options.map((option) => (
                <div
                  key={option.id}
                  ref={(el) => { optionRefs.current[option.id] = el }}
                  className={`space-y-3 rounded-2xl border p-3 transition ${
                    activeOptId === option.id
                      ? 'border-accent-dim bg-accent-dim/30'
                      : 'border-line bg-fill'
                  }`}
                  onClick={() => setActiveOptId(option.id)}
                >
                  {draft.optionDisplayMode !== 'image' ? (
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
                  ) : null}

                  {draft.optionDisplayMode !== 'text' ? (
                    <div className="space-y-2">
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
                      {option.imageUrl ? (
                        <button
                          type="button"
                          className="button-ghost rounded-full border border-edge text-xs"
                          onClick={(e) => { e.stopPropagation(); setCropFor(option.id) }}
                        >
                          <Crop className="size-3.5" />
                          Crop 1:1
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-sm text-md">
                      <input
                        checked={option.isCorrect}
                        className="accent-[var(--accent)]"
                        name={draft.type === 'mcq' ? `correct-option-${option.id}` : 'correct-option'}
                        type={draft.type === 'mcq' ? 'checkbox' : 'radio'}
                        onChange={() =>
                          setDraft((current) => {
                            const isOnlyCorrect = option.isCorrect && current.options.filter((o) => o.isCorrect).length === 1
                            if (draft.type === 'mcq' && isOnlyCorrect) return current // Prevent unchecking the last correct answer

                            return {
                              ...current,
                              options: current.options.map((item) =>
                                draft.type === 'mcq'
                                  ? item.id === option.id
                                    ? { ...item, isCorrect: !item.isCorrect }
                                    : item
                                  : { ...item, isCorrect: item.id === option.id },
                              ),
                            }
                          })
                        }
                      />
                      Correct
                    </label>

                    {draft.type === 'mcq' && draft.options.length > 2 ? (
                      <button
                        className="button-ghost justify-center rounded-full border border-edge"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDraft((current) => ({
                            ...current,
                            options: current.options.filter((item) => item.id !== option.id),
                          }))
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {cropFor && (() => {
            const opt = draft.options.find(o => o.id === cropFor)
            if (!opt?.imageUrl) return null
            return (
              <ImageCropModal
                open
                src={opt.imageUrl}
                onClose={() => setCropFor(null)}
                onApply={(dataUrl) => {
                  setDraft(c => ({
                    ...c,
                    options: c.options.map(o => o.id === cropFor ? { ...o, imageUrl: dataUrl } : o),
                  }))
                  setCropFor(null)
                }}
              />
            )
          })()}
        )}

        {draft.type !== 'section' && (
          <section className="rounded-[1.35rem] border border-edge bg-input-bg p-3">
            <p className="text-sm uppercase tracking-[0.12em] text-faded">Host notes</p>
            <label className="mt-3 block space-y-2 text-sm text-md">
              <span>Internal notes (only visible to the host during the session)</span>
              <textarea
                className="input min-h-20"
                placeholder="Talking points, backstory, hints for scoring…"
                value={draft.hostNotes}
                onChange={(e) => setDraft((c) => ({ ...c, hostNotes: e.target.value }))}
              />
            </label>
          </section>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-edge pt-2">
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
