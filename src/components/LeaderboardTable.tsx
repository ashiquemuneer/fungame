import { Crown } from 'lucide-react'
import type { LeaderboardEntry } from '../types/game'
import { cn } from '../lib/utils'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  compact?: boolean
  currentPlayerId?: string
}

export function LeaderboardTable({
  entries,
  compact = false,
  currentPlayerId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-rim bg-input-bg px-4 py-6 text-center text-sm text-lo">
        No scores yet. Start the round and collect answers first.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-edge bg-input-bg">
      <table className="min-w-full divide-y divide-edge text-left text-sm">
        <thead className="bg-fill text-lo">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.map((entry) => {
            const isCurrentPlayer = entry.playerId === currentPlayerId

            return (
              <tr
                key={entry.playerId}
                className={cn(
                  'transition',
                  entry.rank === 1 ? 'bg-accent-dim' : 'bg-transparent',
                  isCurrentPlayer ? 'bg-note-tint' : '',
                )}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-fill-lo px-3 py-1">
                    {entry.rank === 1 ? <Crown className="size-4 text-accent-text" /> : null}
                    #{entry.rank}
                  </span>
                </td>
                <td className={cn('px-4 py-3 font-medium', compact ? 'text-sm' : 'text-base')}>
                  <span className="inline-flex items-center gap-2">
                    <span>{entry.displayName}</span>
                    {isCurrentPlayer ? (
                      <span className="rounded-full border border-note-line bg-note-tint px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-note-fg">
                        You
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-accent-text">
                  {entry.totalPoints}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
