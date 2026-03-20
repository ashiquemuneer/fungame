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
      <div className="rounded-3xl border border-dashed border-white/15 bg-black/15 px-4 py-6 text-center text-sm text-white/60">
        No scores yet. Start the round and collect answers first.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/15">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/6 text-white/65">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {entries.map((entry) => {
            const isCurrentPlayer = entry.playerId === currentPlayerId

            return (
              <tr
                key={entry.playerId}
                className={cn(
                  'transition',
                  entry.rank === 1 ? 'bg-orange-300/10' : 'bg-transparent',
                  isCurrentPlayer ? 'bg-sky-300/10' : '',
                )}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/7 px-3 py-1">
                    {entry.rank === 1 ? <Crown className="size-4 text-orange-200" /> : null}
                    #{entry.rank}
                  </span>
                </td>
                <td className={cn('px-4 py-3 font-medium', compact ? 'text-sm' : 'text-base')}>
                  <span className="inline-flex items-center gap-2">
                    <span>{entry.displayName}</span>
                    {isCurrentPlayer ? (
                      <span className="rounded-full border border-sky-300/30 bg-sky-300/12 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-100">
                        You
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-orange-100">
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
