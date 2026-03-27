import { useMemo, useState } from 'react'
import {
  BookOpen, Coffee, Laugh, Play, Plus, QrCode, RadioTower, Users, Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { coverGradient, formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import { Modal, useToast } from '../components/ui'

// ─── Quick-start chips ────────────────────────────────────────────────────────

const QUICK_STARTS = [
  { label: 'Office trivia',  icon: BookOpen, title: 'Office Trivia'  },
  { label: 'Icebreaker',     icon: Coffee,   title: 'Icebreaker'     },
  { label: 'Team quiz',      icon: Users,    title: 'Team Quiz'      },
  { label: 'Friday fun',     icon: Laugh,    title: 'Friday Fun'     },
]

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { icon: BookOpen, label: 'Build',  description: 'Create a question set in your library.' },
  { icon: QrCode,   label: 'Host',   description: 'Start a room and share the QR code.'    },
  { icon: Zap,      label: 'Play',   description: 'Players join and answer in real time.'   },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HostDashboardPage() {
  const navigate  = useNavigate()
  const { state, hostEmail, createGame, createSession } = useGameStore()
  const toast = useToast()

  const [showCreate,   setShowCreate]  = useState(false)
  const [createTitle,  setCreateTitle] = useState('')
  const [startingRoom, setStartingRoom] = useState<string | null>(null)

  const firstName = hostEmail?.split('@')[0] ?? 'there'

  const stats = [
    { label: 'Question sets', value: state.games.length,                                           icon: BookOpen   },
    { label: 'Open rooms',    value: state.sessions.filter((s) => s.state !== 'completed').length, icon: RadioTower },
    { label: 'Players total', value: state.players.length,                                          icon: Users      },
  ]

  const recentGames = useMemo(
    () =>
      [...state.games]
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
        .slice(0, 3),
    [state.games],
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) return
    const id = createGame(createTitle.trim(), '')
    setCreateTitle('')
    setShowCreate(false)
    navigate(`/host/games/${id}`)
  }

  const handleStartRoom = async (gameId: string) => {
    setStartingRoom(gameId)
    try {
      const sessionId = await createSession(gameId)
      if (!sessionId) { toast.error('Failed to start room', 'Check connection and try again.'); return }
      navigate(`/host/sessions/${sessionId}`)
    } finally {
      setStartingRoom(null)
    }
  }

  return (
    <div className="space-y-7">

      {/* ── Welcome + create ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-hi">
            Welcome back, <span className="text-accent-text">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-dim">What are we playing today?</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="button-primary">
            <Plus className="size-4" />
            New game
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-dim text-accent-text">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-hi">{value}</p>
              <p className="text-xs text-dim">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick-start chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-subtle shrink-0">Quick start:</span>
        {QUICK_STARTS.map(({ label, icon: Icon, title }) => (
          <button
            key={label}
            onClick={() => {
              const id = createGame(title, '')
              navigate(`/host/games/${id}`)
            }}
            className="flex items-center gap-1.5 rounded-full border border-line bg-fill px-3 py-1.5 text-xs text-lo transition hover:border-accent-dim hover:bg-accent-dim hover:text-accent-text"
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Recently edited ── */}
      {recentGames.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-dim">Recently edited</h2>
            <Link to="/host/my-games" className="text-xs text-faded hover:text-lo transition">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recentGames.map((game) => {
              const grad = coverGradient(game.id)
              const hasQuestions = game.questions.length > 0
              const isStarting   = startingRoom === game.id
              return (
                <div
                  key={game.id}
                  className="group panel flex flex-col overflow-hidden p-0 transition hover:border-rim"
                >
                  {/* Cover */}
                  <button
                    onClick={() => navigate(`/host/games/${game.id}`)}
                    className={`relative flex h-36 w-full items-center justify-center bg-gradient-to-br ${grad} transition group-hover:brightness-110`}
                  >
                    <BookOpen className="size-10 text-md" />
                    <span className="absolute bottom-3 right-3 rounded-lg bg-[var(--overlay-sm)] px-2 py-0.5 text-[11px] text-md backdrop-blur-sm">
                      {game.questions.length} question{game.questions.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <button
                      onClick={() => navigate(`/host/games/${game.id}`)}
                      className="line-clamp-1 text-left text-base font-semibold text-md hover:text-hi transition"
                    >
                      {game.title}
                    </button>
                    <p className="text-xs text-faded">
                      Edited {formatDate(game.updatedAt ?? game.createdAt ?? '')}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="button-secondary flex-1 justify-center text-xs"
                        onClick={() => navigate(`/host/games/${game.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="button-primary flex-1 justify-center text-xs disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!hasQuestions || isStarting}
                        onClick={() => handleStartRoom(game.id)}
                      >
                        <Play className="size-3.5" />
                        {isStarting ? 'Starting…' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── How it works — kept at bottom ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-faded">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, label, description }) => (
            <div key={label} className="panel flex items-start gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fill-hi text-dim">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-md">{label}</p>
                <p className="mt-0.5 text-xs leading-5 text-dim">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Create modal ── */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateTitle('') }}
        title="New question set"
        size="sm"
      >
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <input
            className="input w-full"
            placeholder="e.g. Office Trivia, Team Quiz…"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            autoFocus
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="button-ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={!createTitle.trim()}>
              Create & Edit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
