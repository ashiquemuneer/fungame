import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Bell, Copy, HelpCircle, Maximize2, Minimize2, Play, Pause, ScanSearch, SkipForward, Target, Trophy, UserMinus } from 'lucide-react'
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
  const [copied,       setCopied]       = useState(false)
  const [tick,         setTick]         = useState(() => Date.now())
  const [customScores, setCustomScores] = useState<Record<string, string>>({})
  const [fullscreenQr,   setFullscreenQr]   = useState(false)
  const [notifGranted,   setNotifGranted]   = useState(() => Notification?.permission === 'granted')
  const prevPlayerCountRef = useRef(0)
  const autoAdvancedForRef = useRef<string | null>(null)
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
  const slideMetaLabel =
    currentQuestion?.type === 'section'
      ? ''
      : currentQuestion?.isDemo
        ? 'Demo'
        : currentQuestion
          ? `${currentQuestion.points} pts · ${remainingSeconds}s`
          : ''
  const canRevealMoreImage =
    currentQuestion?.type === 'image_guess' &&
    !session?.revealAnswers &&
    (session?.imageRevealLevel ?? 0) <
      getMaxImageRevealLevel(currentQuestion.imageRevealConfig)

  useEffect(() => {
    if (!session || !currentQuestion) return
    if (session.state !== 'live' || session.revealAnswers || currentQuestion.type === 'section') return

    const intervalId = window.setInterval(() => {
      const now = Date.now()
      setTick(now)

      // Auto-advance when timer expires (only for timed, non-demo questions)
      if (
        currentQuestion.timeLimitSeconds > 0 &&
        !currentQuestion.isDemo &&
        autoAdvancedForRef.current !== currentQuestion.id
      ) {
        const remaining = getQuestionRemainingSeconds(session, currentQuestion, now)
        if (remaining <= 0) {
          autoAdvancedForRef.current = currentQuestion.id
          endCurrentQuestion(session.id)
        }
      }
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [currentQuestion, session, endCurrentQuestion])

  // Notify host when a new player joins
  useEffect(() => {
    if (!notifGranted || session?.state !== 'lobby') return
    const count = players.length
    if (count > prevPlayerCountRef.current && prevPlayerCountRef.current > 0) {
      new Notification('Player joined', {
        body: `${players[players.length - 1]?.displayName ?? 'Someone'} joined the room.`,
        icon: '/favicon.ico',
      })
    }
    prevPlayerCountRef.current = count
  }, [players, notifGranted, session?.state])

  if (!session || !game) {
    return (
      <div className="panel p-8 text-center text-lo">Session not found.</div>
    )
  }

  const joinUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${window.location.pathname}#/join?roomCode=${encodeURIComponent(session.roomCode)}`

  return (
    <div className="space-y-3">
      {/* ── Full-screen QR overlay ── */}
      {fullscreenQr && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-page backdrop-blur-sm"
          onClick={() => setFullscreenQr(false)}
        >
          <button
            className="absolute right-6 top-6 button-ghost rounded-full border border-rim px-4 py-2"
            onClick={() => setFullscreenQr(false)}
          >
            <Minimize2 className="size-4" />
            Close
          </button>
          <div className="rounded-[2rem] bg-[var(--primitive-stone-50)] p-8 shadow-[var(--shadow-xl)]">
            {joinUrl && (
              <QRCodeSVG bgColor="#ffffff" fgColor="#111111" level="M" size={320} value={joinUrl} />
            )}
          </div>
          <p className="mt-6 font-mono text-5xl tracking-[0.4em] text-accent-text">{session.roomCode}</p>
          <p className="mt-4 text-sm text-dim">Tap anywhere to close</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="button-ghost -ml-2" to="/host/dashboard">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <h2 className="mt-3 text-3xl font-semibold text-hi">{game.title}</h2>
          <p className="mt-2 text-sm text-lo">
            Room {session.roomCode} · {session.state} · created {formatDate(session.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {session.state === 'lobby' && !notifGranted && 'Notification' in window && (
            <button
              className="button-ghost rounded-full border border-edge"
              title="Enable player join notifications"
              type="button"
              onClick={async () => {
                const result = await Notification.requestPermission()
                setNotifGranted(result === 'granted')
              }}
            >
              <Bell className="size-4" />
              Enable notifications
            </button>
          )}
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
            <p className="text-sm uppercase tracking-[0.12em] text-dim">Lobby</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl bg-input-bg p-5">
                <p className="text-sm text-lo">Share this room code</p>
                <p className="mt-3 font-mono text-4xl tracking-[0.35em] text-accent-text">
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

              <div className="rounded-3xl border border-edge bg-input-bg p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-lo">Scan to join</p>
                    <p className="mt-1 text-sm text-lo">
                      QR opens the join page with the room code filled in.
                    </p>
                  </div>
                  <button
                    className="button-ghost shrink-0 rounded-full border border-edge"
                    title="Full-screen QR"
                    type="button"
                    onClick={() => setFullscreenQr(true)}
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl bg-[var(--primitive-stone-50)] p-4 text-[var(--primitive-stone-900)]">
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
                  {/* eslint-disable-next-line no-restricted-syntax -- Intentional raw dark text on a forced white QR-code background */}
                  <p className="text-center text-xs leading-6 text-[var(--primitive-stone-600)] break-all">
                    {joinUrl}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {players.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-rim bg-input-bg px-4 py-6 text-center text-sm text-lo">
                  No players yet. Open `/join` on another browser tab and use the room code.
                </div>
              ) : null}

              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-edge bg-input-bg px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-hi">{player.displayName}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-faded">
                      Joined {formatDate(player.joinedAt)}
                    </p>
                  </div>

                  <button
                    aria-label={`Remove ${player.displayName}`}
                    className="button-ghost rounded-full border border-edge"
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
              <Trophy className="size-6 text-accent-text" />
              <div>
                <p className="text-sm uppercase tracking-[0.12em] text-dim">Leaderboard</p>
                <p className="text-sm text-lo">Live total points across the session</p>
              </div>
            </div>
            <div className="mt-5">
              <LeaderboardTable entries={leaderboard} compact />
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <p className="text-sm uppercase tracking-[0.12em] text-dim">Game control</p>
          {currentQuestion ? (
            <div className="mt-4 space-y-6">
              <QuestionSlide
                metaLabel={slideMetaLabel}
                question={currentQuestion}
                questionCount={game.questions.length}
                questionNumber={(session.currentQuestionIndex ?? 0) + 1}
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
                      {currentQuestion.type === 'section'
                        ? 'Next slide'
                        : session.revealAnswers
                          ? 'Next question'
                          : 'Skip'}
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
                    <div className="rounded-[1.8rem] border border-edge bg-fill px-6 py-8 text-center">
                      <p className="text-[4rem] leading-[1.1] sm:text-[5rem] xl:text-[6rem]">
                        {currentQuestion.emojiPrompt?.trim() || <HelpCircle className="mx-auto size-12 text-faded" />}
                      </p>
                    </div>
                    <div className="rounded-[1.6rem] border border-edge bg-fill-hi px-6 py-5 text-base leading-8 text-md">
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
                    <div className="rounded-[1.6rem] border border-edge bg-fill-hi px-6 py-5 text-base leading-8 text-md">
                      Correct answer: {currentQuestion.acceptedAnswer ?? 'Not set'}
                    </div>
                  </div>
                ) : currentQuestion.type === 'rating' ? (
                  <div className="rounded-[1.8rem] border border-edge bg-fill-hi px-6 py-5 text-sm text-lo">
                    Rating poll — players pick 1–5. Target: <strong className="text-hi">{currentQuestion.acceptedAnswer || 'none set'}</strong>. Award points manually or exact-match auto-scores.
                  </div>
                ) : currentQuestion.type === 'number_guess' ? (
                  <div className="space-y-3">
                    <div className="rounded-[1.8rem] border border-edge bg-fill-hi px-6 py-5 text-sm text-lo">
                      Correct answer: <strong className="text-hi">{currentQuestion.acceptedAnswer || 'not set'}</strong>
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
                          'min-h-0 overflow-hidden rounded-[1.6rem] border border-edge bg-raised',
                          currentQuestion.imageUrl ? '' : 'flex items-center justify-center bg-fill',
                        )}
                      >
                        {currentQuestion.imageUrl ? (
                          <img
                            alt="Question visual"
                            className="h-full min-h-48 w-full object-contain p-3"
                            src={currentQuestion.imageUrl}
                          />
                        ) : (
                          <p className="px-5 text-center text-sm text-lo">
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
                      {(currentQuestion.type === 'true_false' ? currentQuestion.options.slice(0, 2) : currentQuestion.options).map((option, index) => (
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
                  <div className="rounded-[1.8rem] border border-edge bg-fill-hi px-6 py-5 text-base leading-8 text-md">
                    Host note: {currentQuestion.acceptedAnswer ?? 'Manual scoring enabled'}
                  </div>
                )}
              </QuestionSlide>

              {/* Host notes */}
              {currentQuestion.hostNotes?.trim() && (
                <div className="rounded-[1.6rem] border border-warn-line bg-warn-tint px-5 py-4 text-sm text-warn-fg">
                  <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-warn-fg">Host notes</p>
                  {currentQuestion.hostNotes}
                </div>
              )}

              {currentQuestion.type !== 'section' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-edge bg-input-bg p-5">
                  <p className="text-sm text-lo">Answers submitted</p>
                  <p className="mt-3 text-4xl font-semibold text-hi">{currentAnswers.length}</p>
                </div>
                <div className="rounded-3xl border border-edge bg-input-bg p-5">
                  <p className="text-sm text-lo">Players in room</p>
                  <p className="mt-3 text-4xl font-semibold text-hi">{players.length}</p>
                </div>
              </div>
              ) : null}

              {currentQuestion.type !== 'section' ? (
              <div className="rounded-[2rem] border border-edge bg-input-bg p-5">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-hi">Responses</h4>
                  {currentQuestion.type === 'number_guess' && currentQuestion.acceptedAnswer && (
                    <button
                      className="button-secondary text-xs"
                      type="button"
                      onClick={() => {
                        const target = parseFloat(currentQuestion.acceptedAnswer ?? '')
                        if (isNaN(target)) return
                        const sorted = [...currentAnswers]
                          .filter((a) => a.textAnswer?.trim())
                          .sort((a, b) => Math.abs(parseFloat(a.textAnswer ?? '') - target) - Math.abs(parseFloat(b.textAnswer ?? '') - target))
                        sorted.forEach((a, i) => {
                          const pts = i === 0 ? currentQuestion.points : 0
                          scoreTextAnswer(a.id, pts, i === 0)
                        })
                      }}
                    >
                      <Target className="size-3.5" />
                      Score closest
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {players.map((player) => {
                    const answer = answerLookup.get(player.id)
                    const selectedOption = currentQuestion.options.find(
                      (option) => option.id === answer?.selectedOptionId,
                    )

                    return (
                      <div
                        key={player.id}
                        className="rounded-2xl border border-line bg-fill p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-hi">{player.displayName}</p>
                            <p className="mt-1 text-sm text-lo">
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
                                  className="button-ghost rounded-full border border-edge"
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
            <div className="mt-4 rounded-[2rem] border border-dashed border-rim bg-input-bg px-5 py-10 text-center">
              <p className="text-lo">
                This room is still waiting to start. Press “Start game” when everyone has joined.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
