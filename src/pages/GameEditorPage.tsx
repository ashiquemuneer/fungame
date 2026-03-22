import { useMemo, useState } from 'react'
import { ArrowLeft, Copy, PencilLine, Plus, Trash2, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { QuestionForm } from '../components/QuestionForm'
import { cn, formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import { isSupabaseConfigured } from '../lib/supabase'
import { ConfirmDialog, useToast } from '../components/ui'
import type { Question } from '../types/game'

export function GameEditorPage() {
  const { gameId = '' } = useParams()
  const { getGame, updateGameMeta, saveQuestion, duplicateQuestion, deleteQuestion, reorderQuestion, moveQuestionToEnd, inviteCollaborator } =
    useGameStore()
  const toast = useToast()
  const game = getGame(gameId)
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>()
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: 'before' | 'after' } | null>(
    null,
  )
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<Question | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  const orderedQuestions = useMemo(() => [...(game?.questions ?? [])], [game?.questions])

  if (!game) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-white/70">Game not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="button-ghost -ml-2" to="/host/dashboard">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <h2 className="mt-3 text-3xl font-semibold text-white">{game.title}</h2>
          <p className="mt-2 text-sm text-white/60">
            Updated {formatDate(game.updatedAt)} · {game.questions.length} questions
          </p>
        </div>

        <Link className="button-primary" to="/host/dashboard">
          Save and return
        </Link>
      </div>

      <section className="panel p-3">
        <p className="text-sm uppercase tracking-[0.25em] text-white/45">Game settings</p>
        <div className="mt-3.5 grid gap-3 lg:grid-cols-[1fr_0.3fr]">
          <div className="space-y-4">
            <input
              className="input"
              value={game.title}
              onChange={(event) =>
                updateGameMeta(game.id, {
                  title: event.target.value,
                  description: game.description,
                  status: game.status,
                })
              }
            />
            <textarea
              className="input min-h-24"
              value={game.description}
              onChange={(event) =>
                updateGameMeta(game.id, {
                  title: game.title,
                  description: event.target.value,
                  status: game.status,
                })
              }
            />
          </div>

          <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-white/60">Publishing</p>
            <div className="mt-4 space-y-3">
              <button
                className={game.status === 'draft' ? 'button-primary w-full' : 'button-secondary w-full'}
                type="button"
                onClick={() =>
                  updateGameMeta(game.id, {
                    title: game.title,
                    description: game.description,
                    status: 'draft',
                  })
                }
              >
                Keep draft
              </button>
              <button
                className={game.status === 'published' ? 'button-primary w-full' : 'button-secondary w-full'}
                type="button"
                onClick={() =>
                  updateGameMeta(game.id, {
                    title: game.title,
                    description: game.description,
                    status: 'published',
                  })
                }
              >
                Publish game
              </button>
            </div>
          </div>
        </div>
      </section>

      {isSupabaseConfigured && (
        <section className="panel p-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-white/45" />
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Share with partner host</p>
          </div>
          <form
            className="mt-3.5 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setShareError('')
              setShareSuccess('')
              setShareLoading(true)
              const err = await inviteCollaborator(gameId, shareEmail)
              setShareLoading(false)
              if (err) {
                setShareError(err)
              } else {
                setShareSuccess(`Invited ${shareEmail} as a collaborator.`)
                setShareEmail('')
              }
            }}
          >
            <input
              className="input flex-1"
              type="email"
              placeholder="partner@example.com"
              value={shareEmail}
              required
              onChange={(e) => { setShareEmail(e.target.value); setShareError(''); setShareSuccess('') }}
            />
            <button className="button-secondary shrink-0" type="submit" disabled={shareLoading}>
              {shareLoading ? 'Inviting…' : 'Invite'}
            </button>
          </form>
          {shareError && (
            <div className="mt-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-2.5 text-sm text-rose-100">
              {shareError}
            </div>
          )}
          {shareSuccess && (
            <div className="mt-2 rounded-2xl border border-green-300/20 bg-green-300/10 px-4 py-2.5 text-sm text-green-100">
              {shareSuccess}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-2 lg:grid-cols-[220px_minmax(0,_1fr)] xl:grid-cols-[250px_minmax(0,_1fr)] 2xl:grid-cols-[280px_minmax(0,_1fr)]">
        <aside className="panel p-2 lg:sticky lg:top-2 lg:h-fit lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-1.5 pb-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Questions</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Slide navigator</h3>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {orderedQuestions.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-black/15 px-4 py-6 text-center text-sm text-white/60">
                No questions yet. Start by creating your first slide.
              </div>
            ) : null}

            {orderedQuestions.map((question, index) => {
              const isActive = editingQuestion?.id === question.id
              const isDropTarget = dropTarget?.id === question.id

              return (
                <div
                  key={question.id}
                  draggable
                  className={cn(
                    'rounded-[1.25rem] border px-3.5 py-3.5 transition',
                    isActive
                      ? 'border-orange-300/35 bg-orange-300/12'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/6',
                    isDropTarget ? 'ring-1 ring-orange-200/45 ring-offset-0' : '',
                    isDropTarget && dropTarget?.placement === 'before'
                      ? 'shadow-[inset_0_3px_0_rgba(253,186,116,0.8)]'
                      : '',
                    isDropTarget && dropTarget?.placement === 'after'
                      ? 'shadow-[inset_0_-3px_0_rgba(253,186,116,0.8)]'
                      : '',
                  )}
                  onDragEnd={() => {
                    setDraggedQuestionId(null)
                    setDropTarget(null)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (draggedQuestionId && draggedQuestionId !== question.id) {
                      const rect = event.currentTarget.getBoundingClientRect()
                      const placement =
                        event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
                      setDropTarget({ id: question.id, placement })
                    }
                  }}
                  onDragStart={() => {
                    setDraggedQuestionId(question.id)
                    setDropTarget(null)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (draggedQuestionId && draggedQuestionId !== question.id) {
                      if (dropTarget?.placement === 'before') {
                        reorderQuestion(game.id, draggedQuestionId, question.id)
                      } else {
                        const targetIndex = orderedQuestions.findIndex((item) => item.id === question.id)
                        const nextQuestion = orderedQuestions[targetIndex + 1]
                        if (nextQuestion) {
                          reorderQuestion(game.id, draggedQuestionId, nextQuestion.id)
                        } else {
                          moveQuestionToEnd(game.id, draggedQuestionId)
                        }
                      }
                    }
                    setDraggedQuestionId(null)
                    setDropTarget(null)
                  }}
                >
                  <button
                    className="w-full text-left"
                    type="button"
                    onClick={() => setEditingQuestion(question)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/60">
                        Q{index + 1}
                      </span>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/60">
                        {question.type === 'section' ? 'section' : question.type.replace('_', ' ')}
                      </span>
                      {question.isTieBreaker ? (
                        <span className="rounded-full bg-rose-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-rose-100">
                          Tie-breaker
                        </span>
                      ) : null}
                      {question.isDemo ? (
                        <span className="rounded-full bg-sky-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-100">
                          Demo
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 line-clamp-2 text-base font-semibold text-white">
                      {question.prompt}
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      {question.type === 'section'
                        ? 'Section slide'
                        : question.isDemo
                          ? 'Demo round'
                          : `${question.points} pts · ${question.timeLimitSeconds}s`}
                    </p>
                  </button>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="button-ghost grow justify-center rounded-full border border-white/10"
                      type="button"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                    <button
                      className="button-ghost rounded-full border border-white/10"
                      title="Duplicate slide"
                      type="button"
                      onClick={() => duplicateQuestion(game.id, question.id)}
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      className="button-ghost rounded-full border border-white/10 hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300"
                      title="Delete slide"
                      type="button"
                      onClick={() => setDeleteQuestionTarget(question)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              className={cn(
                'w-full rounded-[1.4rem] border px-4 py-4 text-left transition',
                !editingQuestion
                  ? 'border-orange-300/35 bg-orange-300/12'
                  : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/6',
              )}
              type="button"
              onClick={() => setEditingQuestion(undefined)}
              onDragOver={(event) => {
                event.preventDefault()
                setDropTarget(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (!draggedQuestionId) {
                  return
                }

                const draggedIndex = orderedQuestions.findIndex(
                  (question) => question.id === draggedQuestionId,
                )

                if (draggedIndex === -1 || orderedQuestions.length === 0) {
                  return
                }

                moveQuestionToEnd(game.id, draggedQuestionId)

                setDraggedQuestionId(null)
                setDropTarget(null)
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/6">
                  <Plus className="size-4 text-orange-100" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">New slide</p>
                  <p className="mt-1 text-base font-semibold text-white">Add below all slides</p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        <div className="panel p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Question builder</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {editingQuestion ? 'Edit question' : 'Add a new question'}
              </h3>
            </div>
          </div>

          <div className="mt-3">
            <QuestionForm
              initialQuestion={editingQuestion}
              onCancelEdit={() => setEditingQuestion(undefined)}
              onSubmit={(draft) => {
                saveQuestion(game.id, draft, editingQuestion?.id)
                setEditingQuestion(undefined)
              }}
            />
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={!!deleteQuestionTarget}
        onClose={() => setDeleteQuestionTarget(null)}
        onConfirm={() => {
          if (!deleteQuestionTarget) return
          deleteQuestion(game.id, deleteQuestionTarget.id)
          if (editingQuestion?.id === deleteQuestionTarget.id) setEditingQuestion(undefined)
          toast.success('Question deleted')
          setDeleteQuestionTarget(null)
        }}
        title="Delete this question?"
        description={deleteQuestionTarget ? `"${deleteQuestionTarget.prompt.slice(0, 80)}${deleteQuestionTarget.prompt.length > 80 ? '…' : ''}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
      />
    </div>
  )
}
