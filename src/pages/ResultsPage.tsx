import { Crown, Download } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { cn } from '../lib/utils'
import { useHostAccess } from '../state/host-access'
import { useGameStore } from '../state/game-store'

export function ResultsPage() {
  const { sessionId = '' } = useParams()
  const { isUnlocked } = useHostAccess()
  const { getSession, getGame, getLeaderboard, getPlayersForSession, getAnswersForSessionQuestion } =
    useGameStore()
  const session = getSession(sessionId)
  const game = session ? getGame(session.gameId) : undefined
  const leaderboard = getLeaderboard(sessionId)
  const players = getPlayersForSession(sessionId)
  const winner = leaderboard[0]

  const reviewRows = useMemo(() => {
    if (!game) {
      return []
    }

    return players.map((player) => ({
      player,
      items: game.questions
        .filter((question) => question.type !== 'section')
        .map((question, index) => {
          const answer = getAnswersForSessionQuestion(sessionId, question.id).find(
            (entry) => entry.playerId === player.id,
          )

          const selectedOption = question.options.find(
            (option) => option.id === answer?.selectedOptionId,
          )
          const correctOptions = question.options.filter((option) => option.isCorrect)

          const selectedAnswer =
            question.type === 'short_text' ||
            question.type === 'emoji' ||
            question.type === 'image_guess'
              ? answer?.textAnswer?.trim() || 'No answer'
              : selectedOption?.label || 'No answer'

          const correctAnswer =
            question.type === 'short_text' ||
            question.type === 'emoji' ||
            question.type === 'image_guess'
              ? question.acceptedAnswer?.trim() || 'Manual scoring'
              : correctOptions.map((option) => option.label).join(', ') || 'Not set'

          return {
            id: question.id,
            index,
            prompt: question.prompt,
            type: question.type,
            selectedAnswer,
            correctAnswer,
            isCorrect: answer?.isCorrect,
          }
        }),
    }))
  }, [game, getAnswersForSessionQuestion, players, sessionId])

  if (!session || !game) {
    return (
      <div className="panel p-8 text-center text-lo">Results not found.</div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-8 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent text-on-accent">
          <Crown className="size-10" />
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-accent-text">
          Final winner
        </p>
        <h2 className="mt-4 text-5xl font-semibold text-hi">
          {winner?.displayName ?? 'No winner yet'}
        </h2>
        <p className="mt-4 text-lg text-lo">
          {winner ? `${winner.totalPoints} total points in ${game.title}` : 'Start scoring to see the winner.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isUnlocked ? (
            <>
              <Link className="button-primary" to="/host/dashboard">
                Back to dashboard
              </Link>
              <Link className="button-secondary" to={`/host/sessions/${session.id}`}>
                Re-open host controls
              </Link>
              <button
                className="button-secondary"
                type="button"
                onClick={() => {
                  const rows = [
                    ['Rank', 'Player', 'Total Points', 'Correct Answers'],
                    ...leaderboard.map((e) => [e.rank, e.displayName, e.totalPoints, '']),
                  ]
                  const csv = rows.map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${game.title.replace(/[^a-z0-9]/gi, '_')}_results.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="size-4" />
                Export CSV
              </button>
            </>
          ) : (
            <Link className="button-primary" to="/">
              Back to home
            </Link>
          )}
        </div>
      </section>

      <section className="panel p-6">
        <p className="text-sm uppercase tracking-[0.12em] text-dim">Full leaderboard</p>
        <div className="mt-4">
          <LeaderboardTable entries={leaderboard} />
        </div>
      </section>

      {isUnlocked ? (
        <section className="panel p-6">
          <p className="text-sm uppercase tracking-[0.12em] text-dim">Answer review</p>
          <h3 className="mt-2 text-2xl font-semibold text-hi">Selected vs correct answers</h3>
          <div className="mt-5 space-y-4">
            {reviewRows.map(({ player, items }) => (
              <div key={player.id} className="rounded-[1.8rem] border border-edge bg-input-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-3">
                  <div>
                    <p className="text-lg font-semibold text-hi">{player.displayName}</p>
                    <p className="text-sm text-lo">{items.filter((item) => item.isCorrect).length} correct answers</p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[1.3rem] border border-edge bg-input-bg">
                  <table className="min-w-full divide-y divide-edge text-left text-sm">
                    <thead className="bg-fill-hi text-lo">
                      <tr>
                        <th className="px-4 py-3 font-medium">Question</th>
                        <th className="px-4 py-3 font-medium">Selected answer</th>
                        <th className="px-4 py-3 font-medium">Correct answer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {items.map((item) => (
                        <tr key={item.id} className="bg-transparent">
                          <td className="px-4 py-3 align-top">
                            <p className="font-medium text-hi">Q{item.index + 1}. {item.prompt}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-faded">
                              {item.type.replace('_', ' ')}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-sm',
                                item.isCorrect
                                  ? 'bg-ok-tint text-ok-fg'
                                  : 'bg-note-tint text-note-fg',
                              )}
                            >
                              {item.selectedAnswer}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className="inline-flex rounded-full bg-fill-lo px-3 py-1 text-sm text-md">
                              {item.correctAnswer}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
