import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Copy, Play, Pause, ScanSearch, SkipForward, Trophy, UserMinus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { ImageRevealCanvas } from '../components/ImageRevealCanvas'
import { getMaxImageRevealLevel } from '../lib/image-reveal'
import { QuestionOptionCard } from '../components/QuestionOptionCard'
import { QuestionSlide } from '../components/QuestionSlide'
import { formatDate, cn } from '../lib/utils'
import { getVerticalOptionGridStyle, resolveSlideLayout } from '../lib/slide-layout'
import { getQuestionRemainingSeconds } from '../lib/question-timer'
import { useGameStore } from '../state/game-store'

export function SessionPage() {
  const navigate = useNavigate()
  const { sessionId = '' } = useParams()
  const [copied, setCopied] = useState(false)
  const [tick, setTick] = useState(() => Date.now())
  const [customScores, setCustomScores] = useState<Record<string, string>>({})
  const {
    getSession,
    getGame,
    getPlayersForSession,
    getAnswersForSessionQuestion,
    getLeaderboard,
    startSession,
    pauseSession,
    resumeSession,
    revealMoreImage,
    endCurrentQuestion,
    goToNextQuestion,
    endSession,
    removePlayer,
    scoreTextAnswer,
  } = useGameStore()

  const session = getSession(sessionId)
  const game = session ? getGame(session.gameId) : undefined
  const players = session ? getPlayersForSession(session.id) : []
  const leaderboard = session ? getLeaderboard(session.id) : []

  const currentQuestion =
    session && game && session.currentQuestionIndex !== null
      ? game.questions[session.currentQuestionIndex]
      : undefined

  const currentAnswers =
    session && currentQuestion
      ? getAnswersForSessionQuestion(session.id, currentQuestion.id)
      : []

  const answerLookup = new Map(currentAnswers.map((answer) => [answer.playerId, answer]))
  const hasQuestionImage = Boolean(currentQuestion?.imageUrl?.trim())
  const resolvedLayout = currentQuestion
    ? resolveSlideLayout(
        currentQuestion.slideLayout,
        currentQuestion.options.length,
        hasQuestionImage,
      )
    : 'bottom'
  const remainingSeconds = session && currentQuestion
    ? getQuestionRemainingSeconds(session, currentQuestion, tick)
    : 0
  const canRevealMoreImage =
    currentQuestion?.type === 'image_guess' &&
    !session?.revealAnswers &&
    (session?.imageRevealLevel ?? 0) <
      getMaxImageRevealLevel(currentQuestion.imageRevealConfig)

  useEffect(() => {
    if (!session || !currentQuestion) {
      return
    }

    if (session.state !== 'live' || session.revealAnswers || currentQuestion.type === 'section') {
      return
    }

    const intervalId = window.setInterval(() => {
      setTick(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [currentQuestion, session])

  if (!session || !game) {
    return (
      <div className="panel p-8 text-center text-white/70">Session not found.</div>
    )
  }

  const joinUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/join?roomCode=${encodeURIComponent(session.roomCode)}`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="button-ghost -ml-2" to="/host/dashboard">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <h2 className="mt-3 text-3xl font-semibold text-white">{game.title}</h2>
          <p className="mt-2 text-sm text-white/60">
            Room {session.roomCode} · {session.state} · created {formatDate(session.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {session.state === 'lobby' ? (
            <button className="button-primary" type="button" onClick={() => startSession(session.id)}>
              <Play className="size-4" />
              Start game
            </button>
          ) : null}

          {session.state === 'live' ? (
            <button className="button-secondary" type="button" onClick={() => pauseSession(session.id)}>
              <Pause className="size-4" />
              Pause
            </button>
          ) : null}

          {session.state === 'paused' ? (
            <button className="button-primary" type="button" onClick={() => resumeSession(session.id)}>
              <Play className="size-4" />
              Resume
            </button>
          ) : null}

          <button
            className="button-secondary"
            type="button"
            onClick={() => {
              endSession(session.id)
              navigate(`/results/${session.id}`)
            }}
          >
            End session
          </button>
        </div>
      </div>

      <section className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="panel p-4">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Lobby</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl bg-black/20 p-5">
                <p className="text-sm text-white/50">Share this room code</p>
                <p className="mt-3 font-mono text-4xl tracking-[0.35em] text-orange-100">
                  {session.roomCode}
                </p>

                <button
                  className="button-secondary mt-5 w-full"
                  type="button"
                  onClick={async () => {
                    if (!joinUrl) {
                      return
                    }

                    await navigator.clipboard.writeText(joinUrl)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  <Copy className="size-4" />
                  {copied ? 'Join link copied' : 'Copy join link'}
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/50">Scan to join</p>
                    <p className="mt-1 text-sm text-white/70">
                      QR opens the join page with the room code filled in.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl bg-white p-4 text-stone-950">
                  {joinUrl ? (
                    <QRCodeSVG
                      bgColor="#ffffff"
                      fgColor="#111111"
                      includeMargin
                      level="M"
                      size={168}
                      value={joinUrl}
                    />
                  ) : null}
                  <p className="text-center text-xs leading-6 text-stone-600 break-all">
                    {joinUrl}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {players.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-black/15 px-4 py-6 text-center text-sm text-white/60">
                  No players yet. Open `/join` on another browser tab and use the room code.
                </div>
              ) : null}

              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{player.displayName}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Joined {formatDate(player.joinedAt)}
                    </p>
                  </div>

                  <button
                    className="button-ghost rounded-full border border-white/10"
                    type="button"
                    onClick={() => removePlayer(session.id, player.id)}
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-3">
              <Trophy className="size-6 text-orange-200" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Leaderboard</p>
                <p className="text-sm text-white/60">Live total points across the session</p>
              </div>
            </div>
            <div className="mt-5">
              <LeaderboardTable entries={leaderboard} compact />
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Game control</p>
          {currentQuestion ? (
            <div className="mt-4 space-y-6">
              <QuestionSlide
                audienceLabel="Presenter view"
                metaLabel={
                  currentQuestion.type === 'section'
                    ? 'Section slide'
                    : currentQuestion.isDemo
                      ? 'Demo round'
                      : `${currentQuestion.points} pts · ${remainingSeconds}s`
                }
                question={currentQuestion}
                questionCount={game.questions.length}
                questionNumber={(session.currentQuestionIndex ?? 0) + 1}
                roomCode={session.roomCode}
                title={game.title}
                hideDefaultQuestionImage={
                  currentQuestion.type === 'image_guess' ||
                  (currentQuestion.type !== 'short_text' && resolvedLayout === 'right')
                }
                footer={
                  <div className="flex flex-wrap gap-3">
                    {currentQuestion.type === 'image_guess' ? (
                      <button
                        className="button-secondary"
                        disabled={!canRevealMoreImage}
                        type="button"
                        onClick={() => revealMoreImage(session.id)}
                      >
                        <ScanSearch className="size-4" />
                        {canRevealMoreImage ? 'Show more image' : 'Fully revealed already'}
                      </button>
                    ) : null}
                    {currentQuestion.type !== 'section' ? (
                      <button className="button-primary" type="button" onClick={() => endCurrentQuestion(session.id)}>
                        Reveal + score round
                      </button>
                    ) : null}
                    <button className="button-secondary" type="button" onClick={() => goToNextQuestion(session.id)}>
                      <SkipForward className="size-4" />
                      {currentQuestion.type === 'section' ? 'Next slide' : 'Next question'}
                    </button>
                    {session.state === 'completed' ? (
                      <Link className="button-secondary" to={`/results/${session.id}`}>
                        Final results
                      </Link>
                    ) : null}
                  </div>
                }
              >
                {currentQuestion.type === 'section' ? null : currentQuestion.type === 'emoji' ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.8rem] border border-white/10 bg-white/4 px-6 py-8 text-center">
                      <p className="text-[3rem] leading-[1.15] sm:text-[4rem] xl:text-[5rem]">
                        {currentQuestion.emojiPrompt?.trim() || '🤔'}
                      </p>
                    </div>
                    <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-6 py-5 text-base leading-8 text-white/72">
                      Correct answer: {currentQuestion.acceptedAnswer ?? 'Not set'}
                    </div>
                  </div>
                ) : currentQuestion.type === 'image_guess' ? (
                  <div className="space-y-4">
                    <ImageRevealCanvas
                      alt="Guess image"
                      className="h-72 sm:h-80 xl:h-[28rem]"
                      config={currentQuestion.imageRevealConfig}
                      revealLevel={session.revealAnswers ? 0 : (session.imageRevealLevel ?? 0)}
                      showFull={session.revealAnswers}
                      src={currentQuestion.imageUrl}
                    />
                    <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-6 py-5 text-base leading-8 text-white/72">
                      Correct answer: {currentQuestion.acceptedAnswer ?? 'Not set'}
                    </div>
                  </div>
                ) : currentQuestion.type !== 'short_text' ? (
                  <div
                    className={cn(
                      'min-h-0',
                      resolvedLayout === 'right'
                        ? 'grid gap-3 lg:grid-cols-[minmax(0,_1fr)_minmax(260px,_34%)]'
                        : '',
                    )}
                  >
                    {resolvedLayout === 'right' ? (
                      <div
                        className={cn(
                          'min-h-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/95',
                          currentQuestion.imageUrl ? '' : 'flex items-center justify-center bg-white/4',
                        )}
                      >
                        {currentQuestion.imageUrl ? (
                          <img
                            alt="Question visual"
                            className="h-full min-h-48 w-full object-contain p-3"
                            src={currentQuestion.imageUrl}
                          />
                        ) : (
                          <p className="px-5 text-center text-sm text-white/60">
                            Add a question image to use this right-panel view.
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div
                      className={cn('grid gap-3', resolvedLayout === 'right' ? '' : 'sm:grid-cols-2')}
                      style={
                        resolvedLayout === 'right'
                          ? getVerticalOptionGridStyle(currentQuestion.options.length)
                          : undefined
                      }
                    >
                      {currentQuestion.options.map((option, index) => (
                        <QuestionOptionCard
                          compact={resolvedLayout === 'right'}
                          fillHeight
                          index={index}
                          key={option.id}
                          option={option}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.8rem] border border-white/10 bg-white/6 px-6 py-5 text-base leading-8 text-white/72">
                    Host note: {currentQuestion.acceptedAnswer ?? 'Manual scoring enabled'}
                  </div>
                )}
              </QuestionSlide>

              {currentQuestion.type !== 'section' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                  <p className="text-sm text-white/50">Answers submitted</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{currentAnswers.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                  <p className="text-sm text-white/50">Players in room</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{players.length}</p>
                </div>
              </div>
              ) : null}

              {currentQuestion.type !== 'section' ? (
              <div className="rounded-[2rem] border border-white/10 bg-black/15 p-5">
                <h4 className="text-lg font-semibold text-white">Responses</h4>
                <div className="mt-4 space-y-3">
                  {players.map((player) => {
                    const answer = answerLookup.get(player.id)
                    const selectedOption = currentQuestion.options.find(
                      (option) => option.id === answer?.selectedOptionId,
                    )

                    return (
                      <div
                        key={player.id}
                        className="rounded-2xl border border-white/8 bg-white/4 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{player.displayName}</p>
                            <p className="mt-1 text-sm text-white/60">
                              {answer
                                ? currentQuestion.type === 'short_text' ||
                                  currentQuestion.type === 'emoji' ||
                                  currentQuestion.type === 'image_guess'
                                  ? answer.textAnswer || 'Submitted'
                                  : selectedOption?.label || 'Submitted'
                                : 'Waiting for answer'}
                            </p>
                          </div>

                          {!currentQuestion.isDemo && (currentQuestion.type === 'short_text' ||
                            currentQuestion.type === 'emoji' ||
                            currentQuestion.type === 'image_guess') && answer ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {[0, Math.ceil(currentQuestion.points / 2), currentQuestion.points].map((points) => (
                                <button
                                  key={points}
                                  className="button-ghost rounded-full border border-white/10"
                                  type="button"
                                  onClick={() => {
                                    scoreTextAnswer(answer.id, points, points > 0)
                                    setCustomScores((current) => ({
                                      ...current,
                                      [answer.id]: String(points),
                                    }))
                                  }}
                                >
                                  {points} pts
                                </button>
                              ))}

                              <input
                                className="input h-11 w-24 rounded-full px-4 py-2 text-sm"
                                inputMode="numeric"
                                max={currentQuestion.points}
                                min={0}
                                placeholder="Custom"
                                type="number"
                                value={customScores[answer.id] ?? ''}
                                onChange={(event) => {
                                  const nextValue = event.target.value
                                  const parsed = Number(nextValue)

                                  if (
                                    nextValue !== '' &&
                                    (!Number.isFinite(parsed) || parsed < 0 || parsed > currentQuestion.points)
                                  ) {
                                    return
                                  }

                                  setCustomScores((current) => ({
                                    ...current,
                                    [answer.id]: nextValue,
                                  }))
                                }}
                              />

                              <button
                                className="button-secondary"
                                type="button"
                                onClick={() => {
                                  const parsed = Number(customScores[answer.id] ?? '')
                                  if (!Number.isFinite(parsed)) {
                                    return
                                  }

                                  const awardedPoints = Math.max(0, Math.min(currentQuestion.points, parsed))
                                  scoreTextAnswer(answer.id, awardedPoints, awardedPoints > 0)
                                }}
                              >
                                Save custom
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-[2rem] border border-dashed border-white/15 bg-black/15 px-5 py-10 text-center">
              <p className="text-white/70">
                This room is still waiting to start. Press “Start game” when everyone has joined.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
