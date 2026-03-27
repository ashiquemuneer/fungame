import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  ArrowLeft, Check, ChevronRight, CircleDot, Copy,
  Eye, Hash, Image, ImageIcon, Layout, LayoutTemplate, LogIn, Monitor, MoreHorizontal, PanelLeft, PanelRight,
  PanelRightClose, PanelRightOpen,
  PenLine, Play, Plus, Smartphone, Smile, Star, ToggleLeft, Trash2, Type, X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cn } from '../lib/utils'
import { createQuestionDraft, generateId } from '../lib/mock-data'
import { useGameStore } from '../state/game-store'
import { ConfirmDialog, Modal, Tooltip, useToast } from '../components/ui'
import type { OptionDisplayMode, Question, QuestionDraft, QuestionType } from '../types/game'
import { SlideThumb } from '../components/SlideThumb'
import { SlidePreviewPane } from '../components/SlidePreviewPane'
import { SlidePreviewPaneMobile } from '../components/SlidePreviewPaneMobile'
import { SectionImageField } from '../components/SectionImageField'
import { ImageAssetField } from '../components/ImageAssetField'
import { ImageCropModal } from '../components/ImageCropModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_GROUPS = [
  {
    label: 'Structure',
    types: [
      { value: 'section'      as QuestionType, label: 'Section slide', icon: Layout },
    ],
  },
  {
    label: 'Quiz',
    types: [
      { value: 'mcq'        as QuestionType, label: 'Multiple choice', icon: CircleDot  },
      { value: 'true_false' as QuestionType, label: 'True / False',    icon: ToggleLeft },
      { value: 'short_text' as QuestionType, label: 'Short text',      icon: PenLine    },
    ],
  },
  {
    label: 'Special',
    types: [
      { value: 'emoji'        as QuestionType, label: 'Emoji guess',   icon: Smile  },
      { value: 'image_guess'  as QuestionType, label: 'Image reveal',  icon: Image  },
      { value: 'rating'       as QuestionType, label: 'Rating 1–5',    icon: Star   },
      { value: 'number_guess' as QuestionType, label: 'Number guess',  icon: Hash   },
    ],
  },
]

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Multiple choice', true_false: 'True / False', short_text: 'Short text',
  emoji: 'Emoji guess', image_guess: 'Image reveal', rating: 'Rating 1–5',
  number_guess: 'Number guess', section: 'Section',
}

const OPTION_COLORS = [
  'border-accent-dim bg-accent-dim',
  'border-note-line bg-note-tint',
  'border-warn-line bg-warn-tint',
  'border-ok-line bg-ok-tint',
  'border-err-line bg-err-tint',
  'border-rim bg-fill-hi',
]

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

// ─── Draft helpers ─────────────────────────────────────────────────────────────

function draftFromQuestion(question?: Question): QuestionDraft {
  if (!question) return createQuestionDraft()
  return {
    type:              question.type,
    prompt:            question.prompt,
    emojiPrompt:       question.emojiPrompt       ?? '',
    imageUrl:          question.imageUrl           ?? '',
    imageRevealConfig: question.imageRevealConfig  ?? createQuestionDraft().imageRevealConfig,
    acceptedAnswer:    question.acceptedAnswer     ?? '',
    hostNotes:         question.hostNotes          ?? '',
    slideLayout:       question.slideLayout        ?? 'auto',
    sectionLayout:     question.sectionLayout      ?? undefined,
    imageFocalPoint:   question.imageFocalPoint    ?? undefined,
    timeLimitSeconds:  question.timeLimitSeconds,
    points:            question.points,
    isDemo:            question.isDemo             ?? false,
    isTieBreaker:      question.isTieBreaker,
    isSkipped:         question.isSkipped        ?? false,
    shortAnswerType:   question.shortAnswerType  ?? 'text',
    numberMin:         question.numberMin,
    numberMax:         question.numberMax,
    optionDisplayMode: question.optionDisplayMode ?? 'text',
    options:           question.type === 'true_false' ? question.options.slice(0, 2) : (question.options.length > 0 ? question.options : createQuestionDraft().options),
  }
}

function applyTypeChange(draft: QuestionDraft, type: QuestionType): QuestionDraft {
  if (type === 'true_false') {
    return { ...draft, type, options: [
      { id: draft.options[0]?.id ?? generateId('opt'), label: 'True',  imageUrl: '', isCorrect: true  },
      { id: draft.options[1]?.id ?? generateId('opt'), label: 'False', imageUrl: '', isCorrect: false },
    ]}
  }
  if (type === 'section') {
    return { ...draft, type, options: [], points: 0, timeLimitSeconds: 0, isDemo: false, isTieBreaker: false, sectionLayout: undefined }
  }
  if (['short_text', 'emoji', 'image_guess', 'rating', 'number_guess'].includes(type)) {
    return { ...draft, type, options: [] }
  }
  return { ...draft, type, options: draft.options.length >= 2 ? draft.options : createQuestionDraft().options }
}

// ─── GameEditorPage ────────────────────────────────────────────────────────────

export function GameEditorPage() {
  const { gameId = '' } = useParams()
  const navigate = useNavigate()
  const {
    state, getGame, updateGameMeta, saveQuestion, duplicateQuestion, deleteQuestion,
    reorderQuestion, moveQuestionToEnd, createSession,
  } = useGameStore()
  const toast = useToast()
  const game = getGame(gameId)

  // ── UI state ──
  const [selectedIndex,  setSelectedIndex]  = useState(0)
  const [selectedOptId,  setSelectedOptId]  = useState<string | null>(null)
  const [cropFor,        setCropFor]        = useState<string | null>(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [editingTitle,   setEditingTitle]   = useState(false)
  const [editingPrompt,    setEditingPrompt]    = useState(false)
  const promptCounterRef = useRef<HTMLParagraphElement>(null)
  const [editingSubtitle,  setEditingSubtitle]  = useState(false)
  const [showAddSlide,   setShowAddSlide]   = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showFormatPicker, setShowFormatPicker] = useState(false)
  const [slideMenuId,    setSlideMenuId]    = useState<string | null>(null)
  const [deleteTarget,   setDeleteTarget]   = useState<Question | null>(null)
  const [copyTarget,     setCopyTarget]     = useState<Question | null>(null)
  const [showPreview,    setShowPreview]    = useState(false)
  const [previewMode,    setPreviewMode]    = useState<'desktop' | 'mobile'>('desktop')
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale,   setPreviewScale]   = useState(0)
  const [startingRoom,   setStartingRoom]   = useState(false)

  // ── Drag state ──
  const [draggedId,  setDraggedId]  = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: 'before' | 'after' } | null>(null)

  // ── Draft (local, auto-saved) ──
  const questions       = game?.questions ?? []
  const safeIndex       = Math.min(selectedIndex, Math.max(0, questions.length - 1))
  const currentQuestion = questions.length > 0 ? questions[safeIndex] : undefined
  // Count only real (non-section, non-demo) questions up to and including the current slide
  const questionNumber  = questions
    .slice(0, safeIndex + 1)
    .filter(q => q.type !== 'section' && !q.isDemo)
    .length

  const [draft, setDraft] = useState<QuestionDraft>(() => draftFromQuestion(currentQuestion))
  const draftMetaChipLabel = draft.isDemo ? 'Demo' : `${draft.points} pts · ${draft.timeLimitSeconds}s`
  const isSectionImage  = currentQuestion?.type === 'section' && Boolean(draft.imageUrl)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewQuestion = useMemo<Question | undefined>(() => {
    if (!currentQuestion) return undefined
    return {
      ...currentQuestion,
      type: draft.type,
      prompt: draft.prompt,
      emojiPrompt: draft.emojiPrompt.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      imageRevealConfig: draft.imageRevealConfig,
      acceptedAnswer: draft.acceptedAnswer.trim() || undefined,
      hostNotes: draft.hostNotes.trim() || undefined,
      slideLayout: draft.slideLayout,
      sectionLayout: draft.sectionLayout,
      imageFocalPoint: draft.imageFocalPoint,
      timeLimitSeconds: draft.timeLimitSeconds,
      points: draft.points,
      isDemo: draft.isDemo,
      isTieBreaker: draft.isTieBreaker,
      isSkipped: draft.isSkipped,
      shortAnswerType: draft.shortAnswerType,
      numberMin: draft.numberMin,
      numberMax: draft.numberMax,
      optionDisplayMode: draft.optionDisplayMode,
      options: draft.options,
    }
  }, [currentQuestion, draft])

  // ── Canvas Scaling ──
  const canvasRef = useRef<HTMLElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const compute = (w: number, h: number) => {
      const availW = w - 64
      const availH = h - 64
      if (availW <= 10 || availH <= 10) return // Skip collapsed unpainted ticks
      setCanvasScale(Math.max(0.1, Math.min(availW / 960, availH / 540)))
    }

    const resizeObj = new ResizeObserver((entries) => {
      for (const entry of entries) {
        compute(entry.contentRect.width, entry.contentRect.height)
      }
    })

    resizeObj.observe(el)

    // Force an initial synchronous read utilizing client dimensions (ignoring transforms)
    if (el.clientWidth > 10 && el.clientHeight > 10) {
      compute(el.clientWidth, el.clientHeight)
    }

    // Unbreakable fallback after flex engines calculate CSS paints
    const timer = window.setTimeout(() => {
      if (el.clientWidth > 10 && el.clientHeight > 10) {
        compute(el.clientWidth, el.clientHeight)
      }
    }, 150)

    const onWinResize = () => compute(el.clientWidth, el.clientHeight)
    window.addEventListener('resize', onWinResize)

    return () => {
      window.clearTimeout(timer)
      resizeObj.disconnect()
      window.removeEventListener('resize', onWinResize)
    }
  }, [game?.id])

  // Preview scale — computed synchronously before paint when preview opens
  useLayoutEffect(() => {
    if (!showPreview || previewMode !== 'desktop') { setPreviewScale(0); return }
    const el = previewContainerRef.current
    if (!el) return
    const compute = () => setPreviewScale(el.clientWidth / 960)
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showPreview, previewMode])

  // Re-init draft when switching slides
  useEffect(() => {
    setDraft(draftFromQuestion(currentQuestion))
    setSelectedOptId(null)
    setEditingPrompt(false)
    setEditingSubtitle(false)
  }, [currentQuestion?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save (text fields)
  const saveDraftDebounced = useCallback((d: QuestionDraft) => {
    if (!currentQuestion) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveQuestion(gameId, d, currentQuestion.id), 400)
  }, [currentQuestion, gameId, saveQuestion])

  const updateDraft = useCallback((patch: Partial<QuestionDraft>) => {
    setDraft(prev => { const next = { ...prev, ...patch }; saveDraftDebounced(next); return next })
  }, [saveDraftDebounced])

  // Immediate save (toggles, type changes)
  const updateDraftImmediate = useCallback((patch: Partial<QuestionDraft>) => {
    if (!currentQuestion) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setDraft(prev => { const next = { ...prev, ...patch }; saveQuestion(gameId, next, currentQuestion.id); return next })
  }, [currentQuestion, gameId, saveQuestion])

  const moveToAdjacentOption = useCallback(
    (optionId: string, direction: -1 | 1) => {
      const idx = draft.options.findIndex((o) => o.id === optionId)
      if (idx === -1) return

      const nextIdx = idx + direction
      if (nextIdx >= 0 && nextIdx < draft.options.length) {
        setSelectedOptId(draft.options[nextIdx].id)
        return
      }

      if (direction === 1 && draft.type === 'mcq' && draft.options.length < 10) {
        const newOpt = { id: generateId('opt'), label: '', imageUrl: '', isCorrect: false }
        updateDraftImmediate({ options: [...draft.options, newOpt] })
        setSelectedOptId(newOpt.id)
      }
    },
    [draft.options, draft.type, updateDraftImmediate],
  )

  const handleOptionTab = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>, optionId: string) => {
      if (event.key !== 'Tab') return
      event.preventDefault()
      moveToAdjacentOption(optionId, event.shiftKey ? -1 : 1)
    },
    [moveToAdjacentOption],
  )

  const otherGames = useMemo(() => state.games.filter(g => g.id !== gameId), [state.games, gameId])

  // ── Early return ──
  if (!game) {
    return (
      <div className="flex h-screen items-center justify-center bg-page text-hi">
        <div className="text-center">
          <p className="mb-4 text-lo">Game not found.</p>
          <Link className="button-secondary" to="/host/my-games">Back to games</Link>
        </div>
      </div>
    )
  }

  // ── Handlers ──
  const handleAddSlide = (type: QuestionType) => {
    const newDraft = applyTypeChange(createQuestionDraft(), type)
    saveQuestion(gameId, newDraft)
    setSelectedIndex(questions.length)
    setShowAddSlide(false)
  }

  const handleStartRoom = async () => {
    setStartingRoom(true)
    try {
      const sessionId = await createSession(gameId)
      if (!sessionId) { toast.error('Failed to start room', 'Try again.'); return }
      navigate(`/host/sessions/${sessionId}`)
    } finally {
      setStartingRoom(false)
    }
  }

  // ── Render ──
  return (
    <div className="light-host flex h-screen flex-col overflow-hidden bg-page text-hi">

      {/* ═══ TOP BAR ═══ */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
        <Link
          to="/host/my-games"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-dim transition hover:bg-fill-hi hover:text-md"
        >
          <ArrowLeft className="size-4" />
          My Games
        </Link>

        <div className="mx-2 h-4 w-px bg-fill-hi" />

        {/* Inline title */}
        {editingTitle ? (
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-lg bg-fill-lo px-3 py-1.5 text-sm font-semibold text-hi outline-none ring-1 ring-ring"
            value={game.title}
            onChange={(e) => updateGameMeta(gameId, { title: e.target.value, description: game.description, status: game.status })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
          />
        ) : (
          <button
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-md transition hover:text-hi"
            onClick={() => setEditingTitle(true)}
            title="Click to rename"
          >
            {game.title}
          </button>
        )}

        <span className="ml-auto shrink-0 text-xs text-faded">
          {questions.length === 0 ? 'No slides' : `${safeIndex + 1} / ${questions.length}`}
        </span>

        <button
          className="button-ghost shrink-0"
          onClick={() => setRightPanelOpen(v => !v)}
          title={rightPanelOpen ? 'Close panel' : 'Open panel'}
        >
          {rightPanelOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </button>

        {currentQuestion && (
          <button className="button-secondary shrink-0" onClick={() => setShowPreview(true)}>
            <Eye className="size-4" />
            Preview
          </button>
        )}

        <Tooltip content={questions.length === 0 ? 'Add slides first' : 'Start a live room'} side="bottom">
          <button
            className="button-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={questions.length === 0 || startingRoom}
            onClick={handleStartRoom}
          >
            <Play className="size-4" />
            {startingRoom ? 'Starting…' : 'Start room'}
          </button>
        </Tooltip>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: slide list ── */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-line">
          <div className="flex-1 space-y-1 overflow-y-auto p-2">

            {/* Add slide — top */}
            <div className="relative mb-1">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-rim py-2 text-xs text-dim transition hover:border-accent-dim hover:text-accent-text"
                onClick={() => setShowAddSlide(v => !v)}
              >
                <Plus className="size-3.5" />
                Add slide
              </button>
              {showAddSlide && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAddSlide(false)} />
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-edge bg-raised p-2 shadow-2xl backdrop-blur-md">
                    {TYPE_GROUPS.map((group) => (
                      <div key={group.label} className="mb-1 last:mb-0">
                        <p className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.12em] text-faded">{group.label}</p>
                        {group.types.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-lo transition hover:bg-accent-dim hover:text-accent-text"
                            onClick={() => handleAddSlide(value)}
                          >
                            <Icon className="size-4 shrink-0 text-faded" />
                            {label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {questions.length === 0 && (
              <div className="px-3 py-6 text-center text-xs leading-6 text-faded">
                No slides yet.<br />Click above to add your first slide.
              </div>
            )}

            {questions.map((q, i) => {
              const isActive  = i === safeIndex
              const isDropTgt = dropTarget?.id === q.id
              return (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => { setDraggedId(q.id); setDropTarget(null) }}
                  onDragEnd={() => { setDraggedId(null); setDropTarget(null) }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedId && draggedId !== q.id) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setDropTarget({ id: q.id, placement: e.clientY < rect.top + rect.height / 2 ? 'before' : 'after' })
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedId && draggedId !== q.id && dropTarget) {
                      if (dropTarget.placement === 'before') {
                        reorderQuestion(gameId, draggedId, q.id)
                      } else {
                        const next = questions[i + 1]
                        if (next) reorderQuestion(gameId, draggedId, next.id)
                        else moveQuestionToEnd(gameId, draggedId)
                      }
                    }
                    setDraggedId(null); setDropTarget(null)
                  }}
                  onClick={() => { setSelectedIndex(i); setSelectedOptId(null) }}
                  className={cn(
                    'group relative cursor-pointer rounded-xl border p-2 transition',
                    isActive
                      ? 'border-accent-dim bg-accent-dim'
                      : 'border-line hover:border-rim hover:bg-fill',
                    isDropTgt && dropTarget?.placement === 'before'
                      ? 'shadow-[inset_0_3px_0_var(--outline-focus)]' : '',
                    isDropTgt && dropTarget?.placement === 'after'
                      ? 'shadow-[inset_0_-3px_0_var(--outline-focus)]' : '',
                  )}
                >
                  {/* Mini thumbnail */}
                  <div className={cn('relative mb-2', q.isSkipped && 'opacity-50')}>
                    <SlideThumb question={q} />
                    {q.isSkipped && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-fill-hi px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-lo">
                        skipped
                      </span>
                    )}
                  </div>

                  {/* Slide meta */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-medium text-faded">{i + 1}</span>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                      isActive ? 'bg-accent-dim text-accent-text' : 'bg-fill-hi text-faded',
                    )}>
                      {TYPE_LABEL[q.type]}
                    </span>
                  </div>

                  {/* 3-dot menu */}
                  <div className="absolute right-1 top-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      aria-label="Slide options"
                      className="flex size-5 items-center justify-center rounded bg-input-bg text-lo opacity-0 transition hover:bg-input-bg hover:text-md group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      onClick={(e) => { e.stopPropagation(); setSlideMenuId(slideMenuId === q.id ? null : q.id) }}
                    >
                      <MoreHorizontal className="size-3" />
                    </button>
                    {slideMenuId === q.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setSlideMenuId(null)} />
                        <div className="absolute right-0 top-full z-20 mt-0.5 w-32 rounded-xl border border-edge bg-raised py-1 shadow-2xl backdrop-blur-md">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-lo transition hover:bg-fill-hi hover:text-md"
                            onClick={() => { duplicateQuestion(gameId, q.id); setSlideMenuId(null) }}
                          >
                            <Copy className="size-3" /> Duplicate
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-lo transition hover:bg-fill-hi hover:text-md"
                            onClick={() => { setCopyTarget(q); setSlideMenuId(null) }}
                          >
                            <LogIn className="size-3" /> Copy to
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-lo transition hover:bg-fill-hi hover:text-md"
                            onClick={() => {
                              saveQuestion(gameId, { ...draftFromQuestion(q), isSkipped: !q.isSkipped }, q.id)
                              setSlideMenuId(null)
                            }}
                          >
                            <X className="size-3" /> {q.isSkipped ? 'Unskip' : 'Skip'}
                          </button>
                          <div className="my-1 border-t border-line" />
                          <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-err-fg transition hover:bg-err-tint hover:text-err-fg"
                            onClick={() => { setDeleteTarget(q); setSlideMenuId(null) }}
                          >
                            <Trash2 className="size-3" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </aside>

        {/* ── CENTER: canvas ── */}
        <main
          ref={canvasRef}
          className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-page-alt"
          onClick={() => { setSelectedOptId(null) }}
        >
          {questions.length === 0 ? (
            <div 
              className="flex items-center justify-center rounded-[32px] border border-line bg-page shadow-2xl"
              style={{
                width: 960, height: 540, flexShrink: 0,
                transform: `scale(${canvasScale})`,
                transformOrigin: 'center center',
              }}
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-fill text-faded">
                  <Plus className="size-8" />
                </div>
                <p className="text-base font-medium text-dim">No slides yet</p>
                <p className="mt-1 text-sm text-faded">Use "Add slide" on the left to get started.</p>
              </div>
            </div>
          ) : currentQuestion ? (
            <div
              className={cn(
                'rounded-[32px] border border-line bg-page shadow-2xl overflow-hidden',
                isSectionImage ? 'relative' : 'flex flex-col p-6',
              )}
              style={{
                width: 960, height: 540, flexShrink: 0,
                transform: `scale(${canvasScale})`,
                transformOrigin: 'center center',
              }}
            >

              {/* Slide header — mirrors QuestionSlide badge layout */}
              {isSectionImage || currentQuestion.type === 'section' ? null : (
                <div className="mb-4 flex shrink-0 items-center justify-between gap-2.5">
                  <span className="slide-chip bg-fill-hi text-lo">{`Q${questionNumber}`}</span>
                  <span className="slide-chip bg-raised text-on-accent">{draftMetaChipLabel}</span>
                </div>
              )}

              {/* ── Prompt — click to edit inline ── */}
              {currentQuestion.type !== 'section' && (
                <div
                  className={cn(
                    'shrink-0 mb-2 rounded-2xl border p-4 transition',
                    editingPrompt
                      ? 'border-edge bg-fill'
                      : 'cursor-text border-transparent hover:border-edge hover:bg-fill',
                  )}
                >
                  {/* key remounts on slide change so dangerouslySetInnerHTML re-initialises cleanly */}
                  <p
                    key={`prompt-${currentQuestion.id}`}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Ask your question…"
                    className="text-2xl font-semibold leading-snug text-hi outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: draft.prompt || '' }}
                    onFocus={(e) => {
                      setEditingPrompt(true)
                      if (promptCounterRef.current) {
                        const len = e.currentTarget.textContent?.length ?? 0
                        promptCounterRef.current.textContent = `${len}/220`
                        promptCounterRef.current.className = cn('mt-1 text-right text-xs tabular-nums', len >= 200 ? 'text-warn-fg' : 'text-faded')
                      }
                      const el = e.currentTarget
                      requestAnimationFrame(() => {
                        const range = document.createRange()
                        range.selectNodeContents(el)
                        range.collapse(false)
                        const sel = window.getSelection()
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      })
                    }}
                    onInput={(e) => {
                      const text = e.currentTarget.textContent ?? ''
                      let len = text.length
                      if (len > 220) {
                        e.currentTarget.textContent = text.slice(0, 220)
                        const range = document.createRange()
                        range.selectNodeContents(e.currentTarget)
                        range.collapse(false)
                        window.getSelection()?.removeAllRanges()
                        window.getSelection()?.addRange(range)
                        len = 220
                      }
                      if (promptCounterRef.current) {
                        promptCounterRef.current.textContent = `${len}/220`
                        promptCounterRef.current.className = cn('mt-1 text-right text-xs tabular-nums', len >= 200 ? 'text-warn-fg' : 'text-faded')
                      }
                    }}
                    onBlur={(e) => {
                      updateDraft({ prompt: e.currentTarget.textContent?.trim() ?? '' })
                      setEditingPrompt(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                      if (e.key === 'Escape') { e.currentTarget.blur() }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      document.execCommand('insertText', false, e.clipboardData.getData('text/plain').slice(0, 220))
                    }}
                  />
                  {editingPrompt && (
                    <p ref={promptCounterRef} className="mt-1 text-right text-xs tabular-nums text-faded" />
                  )}
                </div>
              )}

              {/* ── Slide Content Area ── */}
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 pb-1 overflow-hidden">
                {(currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false') && (() => {
                const mode = draft.optionDisplayMode ?? 'text'
                const count = draft.options.length
                const hasImages = mode !== 'text'
                let cols: number
                if (!hasImages) {
                  cols = count === 1 ? 1 : count === 3 ? 3 : 2
                } else if (count <= 4) {
                  cols = count
                } else {
                  cols = Math.ceil(count / 2)
                }
                const gap = count >= 8 ? 8 : 12

                if (hasImages) {
                  // Image/text+image: max 4 options, single row, add button inline
                  const canAdd = currentQuestion.type === 'mcq' && count < 4
                  const totalSlots = count + (canAdd ? 1 : 0)
                  const imgCols = totalSlots
                  const LABEL_H = mode === 'text+image' ? 28 : 0
                  const CONTENT_W = 896   // subtract 16px for p-2 wrapper padding
                  const CONTENT_H = 342   // subtract 16px for p-2 wrapper padding
                  const imgGap = 12
                  const maxFromWidth = (CONTENT_W - (imgCols - 1) * imgGap) / imgCols
                  const maxFromHeight = CONTENT_H - LABEL_H
                  const imgSize = Math.floor(Math.min(maxFromWidth, maxFromHeight))
                  const cardH = imgSize + LABEL_H

                  return (
                    <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-2">
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imgCols}, ${imgSize}px)`, gridTemplateRows: `${cardH}px`, gap: imgGap }}>
                        {draft.options.map((opt, i) => {
                          const isSelected = selectedOptId === opt.id
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                'group/card flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition',
                                OPTION_COLORS[i % OPTION_COLORS.length],
                                isSelected ? 'ring-2 ring-ring ring-offset-1 ring-offset-page-alt' : 'hover:brightness-110',
                              )}
                              onClick={(e) => { e.stopPropagation(); setSelectedOptId(isSelected ? null : opt.id) }}
                            >
                              {/* Image area */}
                              <div className="relative overflow-hidden bg-fill" style={{ width: imgSize, height: imgSize, flexShrink: 0 }}>
                                {opt.imageUrl ? (
                                  <img src={opt.imageUrl} alt={opt.label} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <ImageIcon className="size-6 text-faded opacity-50" />
                                  </div>
                                )}
                                <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
                                  {OPTION_LETTERS[i]}
                                </span>
                                {opt.isCorrect && (
                                  <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-ok-tint">
                                    <Check className="size-3 text-ok-fg" />
                                  </div>
                                )}
                              </div>
                              {/* Delete button — bottom-right, hover-reveal */}
                              {draft.options.length > 2 && (
                                <button
                                  className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-err-fg group-hover/card:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); updateDraftImmediate({ options: draft.options.filter(o => o.id !== opt.id) }); setSelectedOptId(null) }}
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                              {/* Label row (text+image only) */}
                              {mode === 'text+image' && (
                                <div className="shrink-0 px-2 py-1.5" style={{ height: LABEL_H }}>
                                  {isSelected ? (
                                    <input
                                      autoFocus
                                      className="w-full bg-transparent text-xs font-medium text-hi outline-none placeholder:text-dim"
                                      placeholder="Label…"
                                      value={opt.label}
                                      disabled={currentQuestion.type === 'true_false'}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => handleOptionTab(e, opt.id)}
                                      onChange={(e) => updateDraftImmediate({
                                        options: draft.options.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o),
                                      })}
                                    />
                                  ) : (
                                    <p className={cn('truncate text-xs font-medium', opt.label ? 'text-md' : 'italic text-faded')}>
                                      {opt.label || OPTION_LETTERS[i]}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {canAdd && (
                          <button
                            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-form text-faded transition hover:border-rim hover:text-lo"
                            style={{ width: imgSize, height: cardH }}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateDraftImmediate({
                                options: [...draft.options, { id: generateId('opt'), label: '', imageUrl: '', isCorrect: false }],
                              })
                            }}
                          >
                            <Plus className="size-5" />
                            <span className="text-xs">Add option</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}>
                  {draft.options.map((opt, i) => {
                    const isSelected = selectedOptId === opt.id
                    const isDense = count >= 8
                    // Text-only card
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'group/card relative flex cursor-pointer items-center rounded-2xl border transition min-h-0 justify-center',
                          isDense ? 'p-2.5 gap-2' : 'p-4 gap-3',
                          OPTION_COLORS[i % OPTION_COLORS.length],
                          isSelected ? 'ring-2 ring-ring ring-offset-1 ring-offset-page-alt' : 'hover:brightness-110',
                        )}
                        onClick={(e) => { e.stopPropagation(); setSelectedOptId(isSelected ? null : opt.id) }}
                      >
                        <span className={cn(
                          "flex shrink-0 items-center justify-center rounded-full bg-input-bg font-bold text-lo",
                          isDense ? "size-6 text-[10px]" : "size-7 text-xs"
                        )}>
                          {OPTION_LETTERS[i]}
                        </span>
                        <div className="min-w-0 flex-1 flex items-center h-full">
                          {isSelected ? (
                            <input
                              autoFocus
                              className={cn("w-full bg-transparent font-medium text-hi outline-none placeholder:text-dim", isDense ? "text-xs" : "text-sm")}
                              placeholder="Option text…"
                              value={opt.label}
                              disabled={currentQuestion.type === 'true_false'}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => handleOptionTab(e, opt.id)}
                              onChange={(e) => updateDraftImmediate({
                                options: draft.options.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o),
                              })}
                            />
                          ) : (
                            <p className={cn('font-medium truncate', opt.label ? 'text-md' : 'italic text-faded text-xs', isDense ? 'text-xs' : 'text-sm')}>
                              {opt.label || `Option ${OPTION_LETTERS[i]}`}
                            </p>
                          )}
                        </div>
                        {opt.isCorrect && (
                          <div className={cn("ml-auto flex shrink-0 items-center justify-center rounded-full bg-ok-tint", isDense ? "size-4" : "size-5")}>
                            <Check className={cn("text-ok-fg", isDense ? "size-2.5" : "size-3")} />
                          </div>
                        )}
                        {draft.options.length > 2 && (
                          <button
                            className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-err-fg group-hover/card:opacity-100"
                            onClick={(e) => { e.stopPropagation(); updateDraftImmediate({ options: draft.options.filter(o => o.id !== opt.id) }); setSelectedOptId(null) }}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                )
              })()}

              {currentQuestion.type === 'short_text' && (
                <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
                  <PenLine className="mx-auto mb-3 size-8 text-subtle" />
                  <p className="text-sm text-faded">Players type their answer</p>
                  {draft.acceptedAnswer && (
                    <p className="mt-1 text-xs text-subtle">Scoring note: {draft.acceptedAnswer}</p>
                  )}
                </div>
              )}

              {currentQuestion.type === 'emoji' && (
                <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
                  <p className="text-5xl leading-relaxed">{draft.emojiPrompt || '🎯 🎲 🎪'}</p>
                  <p className="mt-4 text-sm text-faded">Players guess from the emoji clue</p>
                  {draft.acceptedAnswer && <p className="mt-1 text-xs text-ok-fg">Answer: {draft.acceptedAnswer}</p>}
                </div>
              )}

              {currentQuestion.type === 'image_guess' && (
                <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
                  <Image className="mx-auto mb-3 size-8 text-subtle" />
                  <p className="text-sm text-faded">Image reveal question</p>
                  {draft.imageUrl && <p className="mt-1 truncate text-xs text-subtle">{draft.imageUrl}</p>}
                  {draft.acceptedAnswer && <p className="mt-1 text-xs text-ok-fg">Answer: {draft.acceptedAnswer}</p>}
                </div>
              )}

              {currentQuestion.type === 'rating' && (
                <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="flex size-12 items-center justify-center rounded-2xl border border-form bg-fill-hi text-lg font-bold text-dim">
                        {n}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-faded">Players rate from 1 to 5</p>
                  {draft.acceptedAnswer && <p className="mt-1 text-xs text-ok-fg">Target: {draft.acceptedAnswer}</p>}
                </div>
              )}

              {currentQuestion.type === 'number_guess' && (
                <div className="rounded-2xl border border-dashed border-edge bg-fill p-8 text-center">
                  <Hash className="mx-auto mb-3 size-8 text-subtle" />
                  <p className="text-sm text-faded">Players guess a number</p>
                  {draft.acceptedAnswer && <p className="mt-1 text-xs text-ok-fg">Answer: {draft.acceptedAnswer}</p>}
                </div>
              )}

              {currentQuestion.type === 'section' && (() => {
                const hasImage = Boolean(draft.imageUrl)
                const layout = hasImage ? (draft.sectionLayout ?? 'cover') : undefined
                const fp = draft.imageFocalPoint ?? { x: 50, y: 50 }
                const fpStyle = { objectPosition: `${fp.x}% ${fp.y}%` }

                // Cover layout
                if (layout === 'cover') {
                  return (
                    <>
                      <img src={draft.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.40)' }} />
                      <div className="absolute inset-0 z-10 flex w-full flex-col items-center justify-center px-12 text-center">
                          <div
                            className={cn(
                              'w-full rounded-2xl border p-4 transition',
                              editingPrompt
                                ? 'border-white/20 bg-white/10'
                                : 'cursor-text border-transparent hover:border-white/20 hover:bg-white/10',
                            )}
                          >
                            <h2
                              key={`section-prompt-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Click to write section title…"
                              className="text-center text-4xl sm:text-5xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-white outline-none drop-shadow-lg empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-white/50"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.prompt || '' }}
                              onFocus={(e) => {
                                setEditingPrompt(true)
                                const el = e.currentTarget
                                requestAnimationFrame(() => {
                                  const range = document.createRange()
                                  range.selectNodeContents(el)
                                  range.collapse(false)
                                  const sel = window.getSelection()
                                  sel?.removeAllRanges()
                                  sel?.addRange(range)
                                })
                              }}
                              onBlur={(e) => {
                                updateDraft({ prompt: e.currentTarget.textContent?.trim() ?? '' })
                                setEditingPrompt(false)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                                if (e.key === 'Escape') { e.currentTarget.blur() }
                              }}
                              onPaste={(e) => {
                                e.preventDefault()
                                document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
                              }}
                            />
                          </div>
                          <div className={cn('mt-3 w-full max-w-2xl rounded-2xl border transition', editingSubtitle ? 'border-white/20 bg-white/10' : 'border-transparent cursor-text hover:border-white/20 hover:bg-white/10')}>
                            <p
                              key={`section-subtitle-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Add a subtitle…"
                              className="px-3 py-1.5 text-center text-lg leading-relaxed text-white/80 outline-none drop-shadow empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-white/40"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.acceptedAnswer || '' }}
                              onFocus={(e) => { setEditingSubtitle(true); const el = e.currentTarget; requestAnimationFrame(() => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }) }}
                              onBlur={(e) => { updateDraft({ acceptedAnswer: e.currentTarget.textContent?.trim() ?? '' }); setEditingSubtitle(false) }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { e.currentTarget.blur() } }}
                              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                            />
                          </div>
                        </div>
                    </>
                  )
                }

                // Image-left layout
                if (layout === 'image-left') {
                  return (
                    <div className="absolute inset-0 flex">
                        <div className="relative w-1/2 shrink-0 overflow-hidden">
                          <img src={draft.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
                        </div>
                        <div className="flex w-1/2 flex-col items-start justify-center px-10">
                          <div className={cn('w-full rounded-2xl border transition', editingPrompt ? 'border-edge bg-fill' : 'cursor-text border-transparent hover:border-edge hover:bg-fill')}>
                            <h2
                              key={`section-prompt-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Click to write section title…"
                              className="px-3 py-2 text-3xl sm:text-4xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.prompt || '' }}
                              onFocus={(e) => { setEditingPrompt(true); const el = e.currentTarget; requestAnimationFrame(() => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }) }}
                              onBlur={(e) => { updateDraft({ prompt: e.currentTarget.textContent?.trim() ?? '' }); setEditingPrompt(false) }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { e.currentTarget.blur() } }}
                              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                            />
                          </div>
                          <div className={cn('mt-2 w-full rounded-2xl border transition', editingSubtitle ? 'border-edge bg-fill' : 'border-transparent cursor-text hover:border-edge hover:bg-fill')}>
                            <p
                              key={`section-subtitle-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Add a subtitle…"
                              className="px-3 py-1.5 text-base leading-relaxed text-lo outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.acceptedAnswer || '' }}
                              onFocus={(e) => { setEditingSubtitle(true); const el = e.currentTarget; requestAnimationFrame(() => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }) }}
                              onBlur={(e) => { updateDraft({ acceptedAnswer: e.currentTarget.textContent?.trim() ?? '' }); setEditingSubtitle(false) }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { e.currentTarget.blur() } }}
                              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                            />
                          </div>
                        </div>
                    </div>
                  )
                }

                // Image-right layout
                if (layout === 'image-right') {
                  return (
                    <div className="absolute inset-0 flex">
                        <div className="flex w-1/2 flex-col items-start justify-center px-10">
                          <div className={cn('w-full rounded-2xl border transition', editingPrompt ? 'border-edge bg-fill' : 'cursor-text border-transparent hover:border-edge hover:bg-fill')}>
                            <h2
                              key={`section-prompt-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Click to write section title…"
                              className="px-3 py-2 text-3xl sm:text-4xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.prompt || '' }}
                              onFocus={(e) => { setEditingPrompt(true); const el = e.currentTarget; requestAnimationFrame(() => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }) }}
                              onBlur={(e) => { updateDraft({ prompt: e.currentTarget.textContent?.trim() ?? '' }); setEditingPrompt(false) }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { e.currentTarget.blur() } }}
                              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                            />
                          </div>
                          <div className={cn('mt-2 w-full rounded-2xl border transition', editingSubtitle ? 'border-edge bg-fill' : 'border-transparent cursor-text hover:border-edge hover:bg-fill')}>
                            <p
                              key={`section-subtitle-${currentQuestion.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              data-placeholder="Add a subtitle…"
                              className="px-3 py-1.5 text-base leading-relaxed text-lo outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: draft.acceptedAnswer || '' }}
                              onFocus={(e) => { setEditingSubtitle(true); const el = e.currentTarget; requestAnimationFrame(() => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }) }}
                              onBlur={(e) => { updateDraft({ acceptedAnswer: e.currentTarget.textContent?.trim() ?? '' }); setEditingSubtitle(false) }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { e.currentTarget.blur() } }}
                              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                            />
                          </div>
                        </div>
                        <div className="relative w-1/2 shrink-0 overflow-hidden">
                          <img src={draft.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
                        </div>
                    </div>
                  )
                }

                // Default: no image, or no layout set yet
                return (
                  <div className="flex min-h-0 w-full shrink flex-col items-center justify-center p-6 xl:p-10 text-center">
                    <div
                      className={cn(
                        'w-full shrink-0 mb-4 rounded-2xl border p-4 transition',
                        editingPrompt
                          ? 'border-edge bg-fill'
                          : 'cursor-text border-transparent hover:border-edge hover:bg-fill',
                      )}
                    >
                      {/* key remounts on slide change so dangerouslySetInnerHTML re-initialises cleanly */}
                      <h2
                        key={`section-prompt-${currentQuestion.id}`}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Click to write section title…"
                        className="text-center text-4xl sm:text-5xl font-[family-name:var(--font-heading)] font-semibold leading-tight text-hi outline-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-subtle"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: draft.prompt || '' }}
                        onFocus={(e) => {
                          setEditingPrompt(true)
                          const el = e.currentTarget
                          requestAnimationFrame(() => {
                            const range = document.createRange()
                            range.selectNodeContents(el)
                            range.collapse(false)
                            const sel = window.getSelection()
                            sel?.removeAllRanges()
                            sel?.addRange(range)
                          })
                        }}
                        onBlur={(e) => {
                          updateDraft({ prompt: e.currentTarget.textContent?.trim() ?? '' })
                          setEditingPrompt(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                          if (e.key === 'Escape') { e.currentTarget.blur() }
                        }}
                        onPaste={(e) => {
                          e.preventDefault()
                          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
                        }}
                      />
                    </div>
                    {draft.acceptedAnswer && (
                      <p className="mt-2 shrink-0 max-w-2xl text-lg text-lo">{draft.acceptedAnswer}</p>
                    )}
                  </div>
                )
              })()}

              </div>

            </div>
          ) : null}
        </main>

        {/* ── RIGHT: properties panel ── */}
        <aside
          className={cn(
            'flex shrink-0 flex-col overflow-hidden border-line bg-page-alt transition-[width,border-width] duration-300 ease-in-out',
            rightPanelOpen ? 'w-72 border-l' : 'w-0 border-l-0',
          )}
        ><div className={cn('flex w-72 flex-1 flex-col overflow-hidden transition-opacity duration-200', rightPanelOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none')}>
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">
                {selectedOptId ? 'Option' : 'Slide settings'}
              </p>
              <button
                aria-label="Close settings panel"
                className="rounded-lg p-1 text-dim transition hover:bg-fill-hi hover:text-lo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setRightPanelOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">

              {/* ── Option mode ── */}
              {selectedOptId && currentQuestion && (draft.type === 'mcq' || draft.type === 'true_false') ? (() => {
                const opt = draft.options.find(o => o.id === selectedOptId)
                if (!opt) return null
                const optIndex = draft.options.findIndex(o => o.id === selectedOptId)
                return (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-edge bg-fill p-3 space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-lo">
                        Option {OPTION_LETTERS[optIndex]}
                      </p>
                      {draft.optionDisplayMode !== 'image' && (
                        <label className="block space-y-1.5 text-xs text-lo">
                          <span>Label</span>
                          <input
                            className="input w-full text-sm"
                            disabled={draft.type === 'true_false'}
                            value={opt.label}
                            placeholder="Option text…"
                            onKeyDown={(e) => handleOptionTab(e, opt.id)}
                            onChange={(e) => updateDraftImmediate({
                              options: draft.options.map(o => o.id === opt.id ? { ...o, label: e.target.value } : o),
                            })}
                          />
                        </label>
                      )}

                      {draft.optionDisplayMode !== 'text' && (
                        <ImageAssetField
                          label="Image"
                          value={opt.imageUrl ?? ''}
                          onCrop={opt.imageUrl ? () => setCropFor(opt.id) : undefined}
                          onChange={(url) => updateDraftImmediate({ options: draft.options.map(o => o.id === opt.id ? { ...o, imageUrl: url } : o) })}
                        />
                      )}
                    </div>

                    <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Correct answer</p>
                      <button
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                          opt.isCorrect
                            ? 'border-ok-line bg-ok-tint text-ok-fg'
                            : 'border-edge bg-fill text-lo hover:border-rim',
                        )}
                        onClick={() => {
                          const isOnlyCorrect = opt.isCorrect && draft.options.filter(o => o.isCorrect).length === 1
                          if (draft.type === 'mcq' && isOnlyCorrect) return // Prevent unchecking the last correct answer

                          updateDraftImmediate({
                            options: draft.options.map(o => 
                              draft.type === 'mcq'
                                ? (o.id === opt.id ? { ...o, isCorrect: !o.isCorrect } : o)
                                : ({ ...o, isCorrect: o.id === opt.id })
                            ),
                          })
                        }}
                      >
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          opt.isCorrect ? 'border-ok-line bg-ok-tint' : 'border-rim',
                        )}>
                          {opt.isCorrect && <Check className="size-3 text-ok-fg" />}
                        </div>
                        {opt.isCorrect ? 'Marked as correct' : 'Mark as correct'}
                      </button>

                      {draft.type === 'mcq' && draft.options.length > 2 && (
                        <button
                          className="flex w-full items-center gap-2 rounded-xl border border-err-line bg-err-tint px-3 py-2 text-sm text-err-fg transition hover:border-err-line hover:bg-err-tint"
                          onClick={() => { updateDraftImmediate({ options: draft.options.filter(o => o.id !== opt.id) }); setSelectedOptId(null) }}
                        >
                          <Trash2 className="size-4" /> Delete option
                        </button>
                      )}
                    </div>

                    <button
                      className="w-full text-xs text-lo transition hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      onClick={() => setSelectedOptId(null)}
                    >
                      ← Back to slide settings
                    </button>
                  </div>
                )
              })() : (

              /* ── Slide mode ── */
              <div className="space-y-3">

                {/* Type picker — dropdown */}
                {(() => {
                  const currentType = TYPE_GROUPS.flatMap(g => g.types).find(t => t.value === draft.type)
                  const CurrentIcon = currentType?.icon
                  return (
                    <div className="relative">
                      <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-lo">Question type</p>
                      <button
                        className="flex w-full items-center gap-2 rounded-xl border border-edge bg-fill px-3 py-2.5 text-left text-sm font-medium text-md transition hover:border-rim hover:bg-fill-lo"
                        onClick={() => setShowTypePicker(v => !v)}
                      >
                        {CurrentIcon && <CurrentIcon className="size-4 shrink-0 text-accent-text" />}
                        <span className="flex-1">{currentType?.label ?? 'Select type'}</span>
                        <ChevronRight className={cn('size-4 text-faded transition-transform', showTypePicker && 'rotate-90')} />
                      </button>
                      {showTypePicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowTypePicker(false)} />
                          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-edge bg-raised p-2 shadow-2xl backdrop-blur-md">
                            {TYPE_GROUPS.map((group) => (
                              <div key={group.label} className="mb-1 last:mb-0">
                                <p className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.12em] text-faded">{group.label}</p>
                                {group.types.map(({ value, label, icon: Icon }) => (
                                  <button
                                    key={value}
                                    className={cn(
                                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition',
                                      draft.type === value
                                        ? 'bg-accent-dim text-accent-text'
                                        : 'text-lo hover:bg-fill-hi hover:text-md',
                                    )}
                                    onClick={() => { updateDraftImmediate(applyTypeChange(draft, value)); setShowTypePicker(false) }}
                                  >
                                    <Icon className="size-4 shrink-0 text-faded" />
                                    {label}
                                    {draft.type === value && <Check className="ml-auto size-3.5 text-accent-text" />}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}

                {/* Option display mode — only for MCQ / True-False */}
                {(draft.type === 'mcq' || draft.type === 'true_false') && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Option display</p>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { value: 'text'       as OptionDisplayMode, label: 'Text',        Icon: Type          },
                        { value: 'image'      as OptionDisplayMode, label: 'Image',       Icon: ImageIcon     },
                        { value: 'text+image' as OptionDisplayMode, label: 'Text+Img',    Icon: LayoutTemplate },
                      ]).map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-medium transition',
                            (draft.optionDisplayMode ?? 'text') === value
                              ? 'border-accent-dim bg-accent-dim text-accent-text'
                              : 'border-line bg-fill text-lo hover:border-edge hover:text-md',
                          )}
                          onClick={() => updateDraftImmediate({ optionDisplayMode: value })}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add option — MCQ only, slide settings mode */}
                {draft.type === 'mcq' && draft.options.length < 10 && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-form py-2.5 text-xs text-faded transition hover:border-rim hover:text-lo"
                    onClick={() => updateDraftImmediate({
                      options: [...draft.options, { id: generateId('opt'), label: '', imageUrl: '', isCorrect: false }],
                    })}
                  >
                    <Plus className="size-3.5" /> Add option
                  </button>
                )}

                {/* Timer + Points */}
                {draft.type !== 'section' && !draft.isDemo && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Timing & scoring</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1.5 text-xs text-lo">
                        <span>Timer (sec)</span>
                        <input
                          className="input w-full" type="number" min={5} max={120}
                          value={draft.timeLimitSeconds}
                          onChange={(e) => updateDraft({ timeLimitSeconds: Number(e.target.value) })}
                        />
                      </label>
                      <label className="space-y-1.5 text-xs text-lo">
                        <span>Points</span>
                        <input
                          className="input w-full" type="number" min={1} max={100}
                          value={draft.points}
                          onChange={(e) => updateDraft({ points: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Demo / Tie-breaker */}
                {draft.type !== 'section' && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Options</p>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm text-lo">
                      <input
                        type="checkbox" className="size-4 accent-[var(--accent)]"
                        checked={draft.isDemo}
                        onChange={(e) => updateDraftImmediate({
                          isDemo: e.target.checked,
                          points: e.target.checked ? 0 : (draft.points > 0 ? draft.points : 10),
                          timeLimitSeconds: e.target.checked ? 0 : (draft.timeLimitSeconds > 0 ? draft.timeLimitSeconds : 20),
                          isTieBreaker: e.target.checked ? false : draft.isTieBreaker,
                        })}
                      />
                      Demo round (no points)
                    </label>
                    <label className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm text-lo',
                      draft.isDemo && 'cursor-not-allowed opacity-40',
                    )}>
                      <input
                        type="checkbox" className="size-4 accent-[var(--accent)]"
                        checked={draft.isTieBreaker} disabled={draft.isDemo}
                        onChange={(e) => updateDraftImmediate({ isTieBreaker: e.target.checked })}
                      />
                      Tie-breaker
                    </label>
                  </div>
                )}

                {/* Type-specific fields */}
                {draft.type === 'short_text' && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Expected Format</p>
                      <div className="relative">
                        <button
                          className="flex w-full items-center justify-between rounded-xl border border-edge bg-fill px-3 py-2.5 text-sm font-medium text-md transition hover:border-rim hover:bg-fill-lo"
                          onClick={() => setShowFormatPicker(v => !v)}
                        >
                          <span className="flex-1 text-left">
                            {draft.shortAnswerType === 'number' ? 'Number' : 'Text'}
                          </span>
                          <ChevronRight className={cn('size-4 text-faded transition-transform', showFormatPicker && 'rotate-90')} />
                        </button>
                        {showFormatPicker && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowFormatPicker(false)} />
                            <div className="absolute left-0 right-0 top-full z-20 mt-1 space-y-1 rounded-2xl border border-edge bg-raised p-2 shadow-[var(--shadow-lg)] backdrop-blur-md">
                              {[
                                { value: 'text',   label: 'Text' },
                                { value: 'number', label: 'Number' },
                              ].map((opt) => {
                                const isSelected = (draft.shortAnswerType ?? 'text') === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    className={cn(
                                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12.5px] font-medium transition',
                                      isSelected
                                        ? 'bg-accent-dim text-accent-text'
                                        : 'text-lo hover:bg-fill-hi hover:text-md',
                                    )}
                                    onClick={() => {
                                      updateDraft({ shortAnswerType: opt.value as 'text' | 'number' })
                                      setShowFormatPicker(false)
                                    }}
                                  >
                                    {isSelected ? <Check className="size-3.5 shrink-0 text-accent-text" /> : <div className="size-3.5 shrink-0" />}
                                    <span className="flex-1">{opt.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {draft.shortAnswerType === 'number' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Min valid</p>
                          <input
                            className="input w-full text-sm" type="number" placeholder="0"
                            value={draft.numberMin ?? ''}
                            onChange={(e) => updateDraft({ numberMin: e.target.value === '' ? undefined : Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Max valid</p>
                          <input
                            className="input w-full text-sm" type="number" placeholder="100"
                            value={draft.numberMax ?? ''}
                            onChange={(e) => updateDraft({ numberMax: e.target.value === '' ? undefined : Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-edge pt-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Scoring note (optional)</p>
                      <input
                        className="input w-full text-sm" placeholder="e.g. Award 5–15 pts for thoughtful answers"
                        value={draft.acceptedAnswer}
                        onChange={(e) => updateDraft({ acceptedAnswer: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {(draft.type === 'emoji' || draft.type === 'image_guess') && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Correct answer</p>
                    <input
                      className="input w-full text-sm" placeholder="e.g. Titanic"
                      value={draft.acceptedAnswer}
                      onChange={(e) => updateDraft({ acceptedAnswer: e.target.value })}
                    />
                    {draft.type === 'emoji' && (
                      <label className="block space-y-1.5 text-xs text-dim">
                        <span>Emoji clue</span>
                        <input
                          className="input w-full text-2xl" placeholder="🚢🧊🚫"
                          value={draft.emojiPrompt}
                          onChange={(e) => updateDraft({ emojiPrompt: e.target.value })}
                        />
                      </label>
                    )}
                  </div>
                )}

                {draft.type === 'rating' && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Target rating (optional)</p>
                    <input
                      className="input w-full text-sm" type="number" min={1} max={5} placeholder="e.g. 4"
                      value={draft.acceptedAnswer}
                      onChange={(e) => updateDraft({ acceptedAnswer: e.target.value })}
                    />
                  </div>
                )}

                {draft.type === 'number_guess' && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Correct number</p>
                    <input
                      className="input w-full text-sm" type="number" placeholder="e.g. 1969"
                      value={draft.acceptedAnswer}
                      onChange={(e) => updateDraft({ acceptedAnswer: e.target.value })}
                    />
                  </div>
                )}

                {draft.type === 'section' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                      <SectionImageField
                        value={draft.imageUrl || ''}
                        focalPoint={draft.imageFocalPoint ?? { x: 50, y: 50 }}
                        onChange={(url) => updateDraft({ imageUrl: url })}
                        onFocalPointChange={(fp) => updateDraftImmediate({ imageFocalPoint: fp })}
                      />
                    </div>
                    {draft.imageUrl && (
                      <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Image layout</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            className={cn(
                              'flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition',
                              draft.sectionLayout === 'cover' || !draft.sectionLayout
                                ? 'border-accent-dim bg-accent-dim text-accent-text'
                                : 'border-edge bg-fill-lo text-lo hover:bg-fill-hi hover:text-hi',
                            )}
                            onClick={() => updateDraftImmediate({ sectionLayout: 'cover' })}
                          >
                            <LayoutTemplate className="size-4" />
                            Cover
                          </button>
                          <button
                            className={cn(
                              'flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition',
                              draft.sectionLayout === 'image-left'
                                ? 'border-accent-dim bg-accent-dim text-accent-text'
                                : 'border-edge bg-fill-lo text-lo hover:bg-fill-hi hover:text-hi',
                            )}
                            onClick={() => updateDraftImmediate({ sectionLayout: 'image-left' })}
                          >
                            <PanelLeft className="size-4" />
                            Img left
                          </button>
                          <button
                            className={cn(
                              'flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition',
                              draft.sectionLayout === 'image-right'
                                ? 'border-accent-dim bg-accent-dim text-accent-text'
                                : 'border-edge bg-fill-lo text-lo hover:bg-fill-hi hover:text-hi',
                            )}
                            onClick={() => updateDraftImmediate({ sectionLayout: 'image-right' })}
                          >
                            <PanelRight className="size-4" />
                            Img right
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Host notes */}
                {draft.type !== 'section' && (
                  <div className="rounded-2xl border border-edge bg-fill p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Host notes</p>
                    <textarea
                      className="input w-full min-h-16 text-sm" placeholder="Talking points, scoring hints…"
                      value={draft.hostNotes}
                      onChange={(e) => updateDraft({ hostNotes: e.target.value })}
                    />
                  </div>
                )}

              </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ MODALS ═══ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          const idx = questions.findIndex(q => q.id === deleteTarget.id)
          deleteQuestion(gameId, deleteTarget.id)
          setSelectedIndex(Math.max(0, idx - 1))
          toast.success('Slide deleted')
          setDeleteTarget(null)
        }}
        title="Delete this slide?"
        description={deleteTarget ? `"${deleteTarget.prompt.slice(0, 60)}${deleteTarget.prompt.length > 60 ? '…' : ''}" will be permanently removed.` : undefined}
        confirmLabel="Delete" cancelLabel="Keep it" variant="danger"
      />

      <Modal open={showPreview && !!previewQuestion} onClose={() => setShowPreview(false)} title="Player preview" size="xl">
        {previewQuestion && (
          <>
            {/* Viewport toggle */}
            <div className="mb-4 flex gap-2">
              <button
                className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition', previewMode === 'desktop' ? 'border-accent-dim bg-accent-dim text-accent-text' : 'border-edge text-lo hover:bg-fill')}
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="size-4" /> Desktop 16∶9
              </button>
              <button
                className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition', previewMode === 'mobile' ? 'border-accent-dim bg-accent-dim text-accent-text' : 'border-edge text-lo hover:bg-fill')}
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="size-4" /> Mobile 9∶16
              </button>
            </div>

            {previewMode === 'desktop' ? (
              /* Desktop: exact canvas replica at 16:9, scaled to fit modal */
              <div
                ref={previewContainerRef}
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                {previewScale > 0 && (
                  <div
                    className="pointer-events-none absolute left-0 top-0"
                    style={{
                      width: 960, height: 540,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <SlidePreviewPane
                      question={previewQuestion}
                      questionNumber={questionNumber}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Mobile: 9:16 portrait — no phone frame, just the content */
              <div className="flex justify-center py-2">
                {(() => {
                  const contentW = 360
                  const contentH = 640
                  const displayW = 288
                  const mScale  = displayW / contentW
                  const displayH = Math.round(contentH * mScale)
                  return (
                    <div
                      className="relative overflow-hidden rounded-[1.5rem] shadow-lg"
                      style={{ width: displayW, height: displayH }}
                    >
                      <div
                        className="pointer-events-none absolute left-0 top-0"
                        style={{
                          width: contentW,
                          height: contentH,
                          transform: `scale(${mScale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <SlidePreviewPaneMobile
                          question={previewQuestion}
                          questionNumber={questionNumber}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={!!copyTarget} onClose={() => setCopyTarget(null)} title="Copy to another game" size="sm">
        {otherGames.length === 0 ? (
          <p className="py-4 text-center text-sm text-dim">No other games. Create one first.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {otherGames.map((g) => (
              <button
                key={g.id}
                className="flex w-full items-center justify-between rounded-2xl border border-line bg-fill px-4 py-3 text-left transition hover:border-accent-dim hover:bg-accent-dim"
                onClick={() => {
                  if (!copyTarget) return
                  saveQuestion(g.id, {
                    type: copyTarget.type, prompt: copyTarget.prompt,
                    emojiPrompt: copyTarget.emojiPrompt ?? '', imageUrl: copyTarget.imageUrl ?? '',
                    acceptedAnswer: copyTarget.acceptedAnswer ?? '', hostNotes: copyTarget.hostNotes ?? '',
                    options: copyTarget.options, timeLimitSeconds: copyTarget.timeLimitSeconds,
                    points: copyTarget.points, isDemo: false, isTieBreaker: false,
                    slideLayout: copyTarget.slideLayout ?? 'auto',
                    optionDisplayMode: copyTarget.optionDisplayMode ?? 'text',
                    imageRevealConfig: copyTarget.imageRevealConfig ?? createQuestionDraft().imageRevealConfig,
                  })
                  toast.success('Copied', `Added to "${g.title}".`)
                  setCopyTarget(null)
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-md">{g.title}</p>
                  <p className="text-xs text-faded">{g.questions.length} questions</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-faded" />
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Crop modal */}
      {cropFor && (() => {
        const opt = draft.options.find(o => o.id === cropFor)
        if (!opt?.imageUrl) return null
        return (
          <ImageCropModal
            open
            src={opt.imageUrl}
            onClose={() => setCropFor(null)}
            onApply={(dataUrl) => {
              updateDraftImmediate({ options: draft.options.map(o => o.id === cropFor ? { ...o, imageUrl: dataUrl } : o) })
              setCropFor(null)
            }}
          />
        )
      })()}
    </div>
  )
}
