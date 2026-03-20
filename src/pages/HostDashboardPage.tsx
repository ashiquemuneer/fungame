import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CopyPlus,
  LayoutDashboard,
  MonitorCog,
  Play,
  RadioTower,
  RotateCcw,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'

export function HostDashboardPage() {
  const navigate = useNavigate()
  const { state, createGame, createSession, getGame, resetDemo } = useGameStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

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
              {state.games.map((game) => (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#121017] p-3.5"
                >
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,_1fr)_240px] 2xl:grid-cols-[minmax(0,_1fr)_260px]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-2xl font-semibold text-white">{game.title}</h4>
                        <span className="rounded-full bg-white/7 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/65">
                          {game.status}
                        </span>
                      </div>
                      <p className="max-w-3xl text-sm leading-7 text-white/65">{game.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">Questions</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{game.questions.length}</p>
                      </div>
                      <Link className="button-secondary w-full min-w-0 justify-center" to={`/host/games/${game.id}`}>
                        Edit set
                      </Link>
                      <button
                        className="button-primary w-full min-w-0 justify-center"
                        type="button"
                        onClick={async () => {
                          const sessionId = await createSession(game.id)
                          if (!sessionId) {
                            alert('Failed to create room — check your internet connection and try again.')
                            return
                          }
                          navigate(`/host/sessions/${sessionId}`)
                        }}
                      >
                        <CopyPlus className="size-4" />
                        Start room
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              {sessionsWithGame.map(({ session, game }) => (
                <div key={session.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#121017] p-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm uppercase tracking-[0.35em] text-orange-100">
                        {session.roomCode}
                      </p>
                      <h4 className="mt-3 truncate text-xl font-semibold text-white">
                        {game?.title ?? 'Untitled game'}
                      </h4>
                      <p className="mt-2 text-sm text-white/60">
                        {session.state} · created {formatDate(session.createdAt)}
                      </p>
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
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
