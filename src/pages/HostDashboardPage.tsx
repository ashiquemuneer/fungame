import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CopyPlus,
  Edit3,
  MessageSquare,
  MoreHorizontal,
  Play,
  RadioTower,
  RotateCcw,
  Trash2,
  Users,
  Zap,
  QrCode,
  Lightbulb,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import {
  ConfirmDialog,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  NoGamesEmpty,
  NoSessionsEmpty,
  SessionStateBadge,
  StatusBadge,
  Tooltip,
  useToast,
} from '../components/ui'

// ─── Quick-start chip templates ───────────────────────────────────────────────

const QUICK_STARTS = [
  { label: 'Office trivia',    emoji: '🏢', title: 'Office Trivia',     description: 'Fun facts about our team and workplace.' },
  { label: 'Icebreaker round', emoji: '🧊', title: 'Icebreaker Round',  description: 'Light questions to warm up the room.' },
  { label: 'Team quiz',        emoji: '🏆', title: 'Team Knowledge Quiz', description: 'Test what the team knows.' },
  { label: 'Fun emoji game',   emoji: '😄', title: 'Emoji Challenge',   description: 'Answer with emojis — anything goes.' },
]

// ─── Onboarding strip ─────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { icon: BookOpen,   label: '1. Build',  description: 'Create a question set in your library.' },
  { icon: QrCode,     label: '2. Host',   description: 'Start a room and share the QR code.'    },
  { icon: Zap,        label: '3. Play',   description: 'Players join and answer in real time.'   },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HostDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() ?? ''

  const { state, hostEmail, createGame, deleteGame, createSession, getGame, resetDemo } = useGameStore()
  const toast = useToast()

  // Create game form
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')

  // Delete game confirm
  const [deleteTarget,  setDeleteTarget]  = useState<{ id: string; title: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Start room loading (per game)
  const [startingRoom, setStartingRoom] = useState<string | null>(null)

  // Derived: sessions with game data
  const sessionsWithGame = useMemo(
    () => state.sessions.map((session) => ({ session, game: getGame(session.gameId) })),
    [getGame, state.sessions],
  )

  // Derived: stats
  const stats = [
    { label: 'Question sets', value: state.games.length,                                             icon: BookOpen    },
    { label: 'Open rooms',    value: state.sessions.filter((s) => s.state !== 'completed').length,   icon: RadioTower  },
    { label: 'Players total', value: state.players.length,                                            icon: Users       },
  ]

  // Derived: filtered games for library
  const filteredGames = useMemo(() => {
    if (!searchQuery) return state.games
    return state.games.filter(
      (g) =>
        g.title.toLowerCase().includes(searchQuery) ||
        g.description?.toLowerCase().includes(searchQuery),
    )
  }, [state.games, searchQuery])

  // Derived: recently edited (last 4 by updatedAt)
  const recentGames = useMemo(
    () =>
      [...state.games]
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
        .slice(0, 4),
    [state.games],
  )

  // Helper: start a room for a game
  const handleStartRoom = async (gameId: string) => {
    setStartingRoom(gameId)
    try {
      const sessionId = await createSession(gameId)
      if (!sessionId) { toast.error('Failed to create room', 'Check your connection and try again.'); return }
      navigate(`/host/sessions/${sessionId}`)
    } finally {
      setStartingRoom(null)
    }
  }

  // Greeting name from email
  const firstName = hostEmail?.split('@')[0] ?? 'there'

  return (
    <div className="space-y-6">

      {/* ── Welcome + stats ── */}
      <section>
        <h1 className="text-2xl font-semibold text-white">
          Welcome back, <span className="text-orange-200">{firstName}</span>!
        </h1>
        <p className="mt-1 text-sm text-white/45">Here's what's happening with your games.</p>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="panel flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-300/12 text-orange-200">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="text-xs text-white/45">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recently edited ── */}
      {recentGames.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">Recently edited</h2>
            <button
              onClick={() => document.getElementById('game-library')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs text-white/35 hover:text-white/60 transition"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentGames.map((game) => (
              <Link
                key={game.id}
                to={`/host/games/${game.id}`}
                className="group panel flex flex-col gap-2 p-4 transition hover:border-orange-300/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={game.status} />
                  <span className="text-xs text-white/30">{game.questions.length}q</span>
                </div>
                <p className="line-clamp-2 text-sm font-medium text-white/80 group-hover:text-white transition">
                  {game.title}
                </p>
                <p className="text-[11px] text-white/30">
                  {formatDate(game.updatedAt ?? game.createdAt ?? '')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick-start chips + create form ── */}
      <section className="panel p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/8 text-orange-100">
            <CopyPlus className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Create a game</p>
            <h2 className="text-lg font-semibold text-white">New question set</h2>
          </div>
        </div>

        {/* Quick-start chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_STARTS.map((qs) => (
            <button
              key={qs.label}
              type="button"
              onClick={() => {
                const id = createGame(qs.title, qs.description)
                navigate(`/host/games/${id}`)
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-orange-300/25 hover:bg-orange-300/8 hover:text-orange-200"
            >
              <span>{qs.emoji}</span>
              {qs.label}
            </button>
          ))}
        </div>

        {/* Custom create form */}
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            const id = createGame(title.trim(), description.trim())
            setTitle(''); setDesc('')
            navigate(`/host/games/${id}`)
          }}
        >
          <input
            className="input flex-1"
            placeholder="Game title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="input flex-1"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button className="button-primary shrink-0" type="submit">
            Create game
          </button>
        </form>

        <div className="mt-3 flex justify-end">
          <button className="button-ghost text-xs" type="button" onClick={resetDemo}>
            <RotateCcw className="size-3.5" />
            Reset demo data
          </button>
        </div>
      </section>

      {/* ── How it works strip ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/45">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, label, description }) => (
            <div key={label} className="panel flex items-start gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/6 text-white/40">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-white/45">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Game library ── */}
      <section id="game-library">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Games</p>
            <h2 className="text-xl font-semibold text-white">
              Question library
              {searchQuery && (
                <span className="ml-2 text-sm font-normal text-white/40">
                  — "{searchQuery}" ({filteredGames.length} results)
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Reset demo data" side="left">
              <button onClick={resetDemo} className="button-ghost rounded-xl border border-white/8 px-2.5 py-2">
                <RotateCcw className="size-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredGames.length === 0 ? (
            searchQuery ? (
              <div className="panel flex items-center justify-center py-12 text-white/40">
                <div className="text-center">
                  <Lightbulb className="mx-auto mb-3 size-8 opacity-30" />
                  <p className="text-sm">No games match "{searchQuery}"</p>
                </div>
              </div>
            ) : (
              <NoGamesEmpty
                onCreateGame={() => document.querySelector<HTMLInputElement>('input[placeholder="Game title"]')?.focus()}
              />
            )
          ) : (
            filteredGames.map((game) => {
              const hasQuestions = game.questions.length > 0
              const isStarting   = startingRoom === game.id

              return (
                <div key={game.id} className="panel overflow-hidden p-4">
                  <div className="flex items-start gap-4">
                    {/* Left: game info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{game.title}</h3>
                        <StatusBadge status={game.status} />
                      </div>
                      {game.description && (
                        <p className="line-clamp-1 text-sm text-white/50">{game.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 text-xs ${hasQuestions ? 'text-white/40' : 'text-amber-300'}`}>
                          <MessageSquare className="size-3" />
                          {game.questions.length} question{game.questions.length !== 1 ? 's' : ''}
                          {!hasQuestions && ' — add questions first'}
                        </span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <Link className="button-secondary hidden sm:inline-flex" to={`/host/games/${game.id}`}>
                        <Edit3 className="size-4" />
                        Edit
                      </Link>

                      <Tooltip content={hasQuestions ? 'Start a live room' : 'Add questions first'} side="top">
                        <button
                          className="button-primary disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!hasQuestions || isStarting}
                          onClick={() => handleStartRoom(game.id)}
                        >
                          {isStarting ? (
                            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <Play className="size-4" />
                          )}
                          <span className="hidden sm:inline">Start room</span>
                        </button>
                      </Tooltip>

                      {/* Three-dot context menu */}
                      <DropdownMenu
                        trigger={
                          <button className="button-ghost rounded-full border border-white/10 px-2.5 py-2.5 text-white/50 hover:text-white/80">
                            <MoreHorizontal className="size-4" />
                          </button>
                        }
                        align="right"
                      >
                        <DropdownItem icon={<Edit3 />} onClick={() => navigate(`/host/games/${game.id}`)}>
                          Edit set
                        </DropdownItem>
                        <DropdownItem
                          icon={<Play />}
                          onClick={() => handleStartRoom(game.id)}
                          disabled={!hasQuestions}
                        >
                          Start room
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem
                          icon={<Trash2 />}
                          variant="danger"
                          onClick={() => setDeleteTarget({ id: game.id, title: game.title })}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ── Rooms in motion ── */}
      <section>
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Recent sessions</p>
          <h2 className="text-xl font-semibold text-white">Rooms in motion</h2>
        </div>

        <div className="grid gap-2.5 xl:grid-cols-2">
          {sessionsWithGame.length === 0 ? (
            <NoSessionsEmpty />
          ) : (
            sessionsWithGame.map(({ session, game }) => (
              <div key={session.id} className="panel p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange-200/80">
                      {session.roomCode}
                    </p>
                    <h3 className="mt-2 truncate text-base font-semibold text-white">
                      {game?.title ?? 'Untitled game'}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <SessionStateBadge state={session.state} />
                      <span className="text-xs text-white/35">·</span>
                      <span className="text-xs text-white/45">{formatDate(session.createdAt)}</span>
                    </div>
                  </div>

                  <Link className="button-secondary shrink-0" to={`/host/sessions/${session.id}`}>
                    {session.state === 'live' ? (
                      <><Play className="size-4" />Open</>
                    ) : (
                      <>View<ArrowRight className="size-4" /></>
                    )}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Delete confirm ── */}
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
    </div>
  )
}
