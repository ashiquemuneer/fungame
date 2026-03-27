import { ArrowRight, Play, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import { NoSessionsEmpty, SessionStateBadge } from '../components/ui'

export function HostSessionsPage() {
  const { state, getGame, getPlayersForSession } = useGameStore()

  const sessionsWithGame = state.sessions.map((session) => ({
    session,
    game: getGame(session.gameId),
  }))

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold text-hi">Sessions</h1>
        <p className="mt-0.5 text-sm text-dim">
          {state.sessions.length} session{state.sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── List ── */}
      {sessionsWithGame.length === 0 ? (
        <NoSessionsEmpty />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {sessionsWithGame.map(({ session, game }) => {
            const playerCount = getPlayersForSession(session.id).length
            const isLive = session.state === 'live'
            return (
              <div key={session.id} className={`panel p-4 ${isLive ? 'border-accent-dim' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="flex items-center gap-1 rounded-full bg-err-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-err-fg">
                          <span className="size-1.5 animate-pulse rounded-full bg-err-fg" />
                          Live
                        </span>
                      )}
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-text">
                        {session.roomCode}
                      </p>
                    </div>
                    <h2 className="mt-1.5 truncate text-base font-semibold text-hi">
                      {game?.title ?? 'Untitled game'}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <SessionStateBadge state={session.state} />
                      <span className="text-xs text-faded">·</span>
                      <span className="flex items-center gap-1 text-xs text-dim">
                        <Users className="size-3" />
                        {playerCount} player{playerCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-faded">·</span>
                      <span className="text-xs text-dim">{formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                  <Link className="button-secondary shrink-0" to={`/host/sessions/${session.id}`}>
                    {isLive ? (
                      <><Play className="size-4" />Open</>
                    ) : (
                      <>View<ArrowRight className="size-4" /></>
                    )}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
