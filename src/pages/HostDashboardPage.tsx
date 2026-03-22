import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CopyPlus,
  LayoutDashboard,
  MessageSquare,
  MonitorCog,
  Play,
  RadioTower,
  RotateCcw,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import { ConfirmDialog, NoGamesEmpty, NoSessionsEmpty, SessionStateBadge, StatusBadge, Tooltip, useToast } from '../components/ui'

export function HostDashboardPage() {
  const navigate = useNavigate()
  const { state, createGame, deleteGame, createSession, getGame, resetDemo } = useGameStore()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Delete game confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Start room loading state (per game)
  const [startingRoom, setStartingRoom] = useState<string | null>(null)

  const sessionsWithGame = useMemo(
    () =>
      state.sessions.map((session) => ({
        session,
        game: getGame(session.gameId),
      })),
    [getGame, state.sessions],
  )

  const stats = [
    { label: 'Question sets', value: String(state.games.length), icon: LayoutDashboard },
    {
      label: 'Open rooms',
      value: String(state.sessions.filter((session) => session.state !== 'completed').length),
      icon: RadioTower,
    },
    { label: 'Players joined', value: String(state.players.length), icon: Users },
  ]

  return (
    <>
      <div className="space-y-3">
        <section className="panel overflow-hidden">
          <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="border-b border-white/10 p-4 sm:p-5 xl:border-r xl:border-b-0">
              <p className="text-sm uppercase tracking-[0.25em] text-orange-200/70">Host command center</p>
              <h2 className="mt-4 max-w-3xl font-['Sora','Avenir_Next',sans-serif] text-4xl font-semibold leading-tight text-white xl:text-5xl">
                Desktop-first control room for running your office game smoothly.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
                This dashboard is optimized for a larger screen so the host can build rounds, monitor
                live rooms, and jump into the active session without fighting the layout. It still
                collapses cleanly on smaller screens when you need it.
              </p>

              <div className="mt-5 grid gap-2.5 md:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <item.icon className="size-9 rounded-2xl bg-orange-300/15 p-2 text-orange-100" />
                    <p className="mt-4 text-sm text-white/50">{item.label}</p>
                    <p className="mt-2 text-4xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-300/10 p-5 text-sm leading-7 text-orange-50">
                Demo room is seeded with <span className="font-mono">PLAY42</span> so you can test
                the player flow immediately.
              </div>

              <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Host workflow</p>
                <ol className="mt-4 space-y-3 text-sm leading-7 text-white/65">
                  <li>1. Create or refine a question set.</li>
                  <li>2. Launch a room from the game card.</li>
                  <li>3. Share the QR code from the live host session.</li>
                  <li>4. Run scoring and reveal the winner from the host controls.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,_1fr)] 2xl:grid-cols-[320px_minmax(0,_1fr)]">
          <aside className="space-y-3">
            <div className="panel p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-orange-100">
                  <CopyPlus className="size-5" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/45">Create a game</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">New question set</h3>
                </div>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  const gameId = createGame(title.trim(), description.trim())
                  setTitle('')
                  setDescription('')
                  navigate(`/host/games/${gameId}`)
                }}
              >
                <input
                  className="input"
                  placeholder="Game title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
                <textarea
                  className="input min-h-32"
                  placeholder="What kind of fun game are you running?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <div className="grid gap-3">
                  <button className="button-primary w-full justify-center" type="submit">
                    Create game
                  </button>
                  <button className="button-secondary w-full justify-center" type="button" onClick={resetDemo}>
                    <RotateCcw className="size-4" />
                    Reset demo data
                  </button>
                </div>
              </form>
            </div>

            <div className="panel p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/8 text-orange-100">
                  <MonitorCog className="size-5" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/45">Desktop notes</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">Best on a large screen</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-7 text-white/65">
                <p>Use the host side on a laptop or monitor so the game list and live room list stay visible together.</p>
                <p>The player join and answer flow remains mobile-friendly, but host controls are intentionally laid out for desktop first.</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-3">
            {/* ── Question library ── */}
            <div className="panel p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/45">Games</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">Question library</h3>
                </div>
                <p className="max-w-xl text-sm leading-7 text-white/60">
                  Keep this list as your reusable catalog. Each card is optimized for quick scanning,
                  editing, and room launch from a desktop host station.
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                {state.games.length === 0 ? (
                  <NoGamesEmpty
                    onCreateGame={() => {
                      // Focus the title input in the sidebar
                      const input = document.querySelector<HTMLInputElement>('input[placeholder="Game title"]')
                      input?.focus()
                    }}
                  />
                ) : (
                  state.games.map((game) => {
                    const hasQuestions = game.questions.length > 0
                    const isStarting = startingRoom === game.id

                    return (
                      <div
                        key={game.id}
                        className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#121017] p-3.5"
                      >
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,_1fr)_240px] 2xl:grid-cols-[minmax(0,_1fr)_260px]">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h4 className="text-2xl font-semibold text-white">{game.title}</h4>
                              <StatusBadge status={game.status} />
                            </div>
                            <p className="max-w-3xl text-sm leading-7 text-white/65">{game.description}</p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {/* Question count — warns when empty */}
                            <div className={`rounded-2xl border px-4 py-3 ${hasQuestions ? 'border-white/8 bg-white/4' : 'border-amber-300/20 bg-amber-300/8'}`}>
                              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-white/35">
                                <MessageSquare className="size-3" />
                                Questions
                              </p>
                              <p className={`mt-2 text-2xl font-semibold ${hasQuestions ? 'text-white' : 'text-amber-200'}`}>
                                {game.questions.length}
                              </p>
                              {!hasQuestions && (
                                <p className="mt-1 text-[10px] text-amber-200/70">Add questions first</p>
                              )}
                            </div>

                            <Link className="button-secondary w-full min-w-0 justify-center" to={`/host/games/${game.id}`}>
                              Edit set
                            </Link>

                            <div className="flex gap-2">
                              {/* Start room — disabled when no questions */}
                              <Tooltip
                                content={hasQuestions ? 'Start a live room' : 'Add at least one question first'}
                                side="top"
                              >
                                <button
                                  className="button-primary min-w-0 flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-40"
                                  type="button"
                                  disabled={!hasQuestions || isStarting}
                                  onClick={async () => {
                                    setStartingRoom(game.id)
                                    try {
                                      const sessionId = await createSession(game.id)
                                      if (!sessionId) {
                                        toast.error('Failed to create room', 'Check your connection and try again.')
                                        return
                                      }
                                      navigate(`/host/sessions/${sessionId}`)
                                    } finally {
                                      setStartingRoom(null)
                                    }
                                  }}
                                >
                                  {isStarting ? (
                                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                  ) : (
                                    <CopyPlus className="size-4" />
                                  )}
                                  Start room
                                </button>
                              </Tooltip>

                              {/* Delete game */}
                              <Tooltip content="Delete game" side="top">
                                <button
                                  className="button-ghost rounded-full border border-white/10 px-3 py-3 text-white/40 hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300"
                                  type="button"
                                  aria-label="Delete game"
                                  onClick={() => setDeleteTarget({ id: game.id, title: game.title })}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* ── Rooms in motion ── */}
            <div className="panel p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/45">Recent sessions</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">Rooms in motion</h3>
                </div>
                <p className="max-w-xl text-sm leading-7 text-white/60">
                  Use this area as your active operations list while the session screen handles live
                  hosting.
                </p>
              </div>

              <div className="mt-4 grid gap-2.5 2xl:grid-cols-2">
                {sessionsWithGame.length === 0 ? (
                  <NoSessionsEmpty />
                ) : (
                  sessionsWithGame.map(({ session, game }) => (
                    <div key={session.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#121017] p-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-mono text-sm uppercase tracking-[0.35em] text-orange-100">
                            {session.roomCode}
                          </p>
                          <h4 className="mt-3 truncate text-xl font-semibold text-white">
                            {game?.title ?? 'Untitled game'}
                          </h4>
                          <div className="mt-2 flex items-center gap-2">
                            <SessionStateBadge state={session.state} />
                            <span className="text-sm text-white/40">·</span>
                            <span className="text-sm text-white/60">created {formatDate(session.createdAt)}</span>
                          </div>
                        </div>

                        <Link className="button-secondary shrink-0" to={`/host/sessions/${session.id}`}>
                          {session.state === 'live' ? (
                            <>
                              <Play className="size-4" />
                              Open
                            </>
                          ) : (
                            <>
                              View
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Delete game confirm dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => { if (!deleteLoading) setDeleteTarget(null) }}
        onConfirm={async () => {
          if (!deleteTarget) return
          setDeleteLoading(true)
          deleteGame(deleteTarget.id)
          toast.success('Game deleted', `"${deleteTarget.title}" has been removed.`)
          setDeleteLoading(false)
          setDeleteTarget(null)
        }}
        title="Delete this game?"
        description={`"${deleteTarget?.title}" and all its questions will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete game"
        cancelLabel="Keep it"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  )
}
