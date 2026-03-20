import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QuestionOptionCard } from '../components/QuestionOptionCard'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { QuestionSlide } from '../components/QuestionSlide'
import { ImageRevealCanvas } from '../components/ImageRevealCanvas'
import { cn } from '../lib/utils'
import { getVerticalOptionGridStyle, resolveSlideLayout } from '../lib/slide-layout'
import { getQuestionRemainingSeconds } from '../lib/question-timer'
import { useGameStore } from '../state/game-store'

export function PlayPage() {
  const { sessionId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId') ?? ''
  const { getSession, getGame, getPlayersForSession, getAnswersForSessionQuestion, submitAnswer, getLeaderboard } =
    useGameStore()
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [textAnswer, setTextAnswer] = useState('')
  const [revealCount, setRevealCount] = useState(0)
  const [tick, setTick] = useState(() => Date.now())

  const session = getSession(sessionId)
  const game = session ? getGame(session.gameId) : undefined
  const player = getPlayersForSession(sessionId).find((entry) => entry.id === playerId)
  const leaderboard = getLeaderboard(sessionId)

  const currentQuestion =
    session && game && session.currentQuestionIndex !== null
      ? game.questions[session.currentQuestionIndex]
      : undefined

  const currentAnswer = useMemo(() => {
    if (!session || !currentQuestion || !player) {
      return undefined
    }

    return getAnswersForSessionQuestion(session.id, currentQuestion.id).find(
      (answer) => answer.playerId === player.id,
    )
  }, [currentQuestion, getAnswersForSessionQuestion, player, session])

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

  useEffect(() => {
    setRevealCount(0)
  }, [currentQuestion?.id])

  if (!session || !game || !player) {
    return (
      <div className="panel mx-auto max-w-xl p-10 text-center">
        <p className="text-white/70">Player session not found. Join the room again.</p>
        <Link className="button-primary mt-6" to="/join">
          Back to join
        </Link>
      </div>
    )
  }

  if (session.state === 'lobby' || session.currentQuestionIndex === null) {
    return (
      <div className="panel mx-auto max-w-3xl p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-orange-200/70">
          Room {session.roomCode}
        </p>
        <h2 className="mt-4 text-4xl font-semibold text-white">Waiting for the host to start</h2>
        <p className="mt-4 text-white/70">
          You are in as <span className="font-semibold text-white">{player.displayName}</span>.
        </p>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  const hasQuestionImage = Boolean(currentQuestion.imageUrl?.trim())
  const isRevealed = session.revealAnswers
  const correctOptionIds = new Set(
    currentQuestion.options.filter((option) => option.isCorrect).map((option) => option.id),
  )
  const selectedOption = currentQuestion.options.find(
    (option) => option.id === currentAnswer?.selectedOptionId,
  )
  const correctOptions = currentQuestion.options.filter((option) => correctOptionIds.has(option.id))
  const resolvedLayout = resolveSlideLayout(
    currentQuestion.slideLayout,
    currentQuestion.options.length,
    hasQuestionImage,
  )
  const remainingSeconds = getQuestionRemainingSeconds(session, currentQuestion, tick)
  const isTimerExpired =
    currentQuestion.type !== 'section' &&
    !currentQuestion.isDemo &&
    !isRevealed &&
    remainingSeconds <= 0

  if (session.state === 'completed') {
    return (
      <div className="space-y-6">
        <div className="panel p-8 text-center">
          <h2 className="text-4xl font-semibold text-white">Game complete</h2>
          <p className="mt-4 text-white/70">
            Nice work, {player.displayName}. The final leaderboard is ready.
          </p>
          <Link className="button-primary mt-6" to={`/results/${session.id}`}>
            View results
          </Link>
        </div>
        <LeaderboardTable currentPlayerId={player.id} entries={leaderboard} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <QuestionSlide
        audienceLabel={player.displayName}
        metaLabel={
          currentQuestion.type === 'section'
            ? 'Round intro'
            : currentQuestion.isDemo
              ? 'Demo round'
              : currentQuestion.type === 'image_guess'
                ? `${!currentAnswer && !isRevealed ? Math.max(0, Math.floor(currentQuestion.points * (1 - revealCount * 0.3))) : currentQuestion.points} pts · ${remainingSeconds}s`
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
          currentQuestion.type === 'section' ? null : isRevealed ? (
            <div
              className={cn(
                'rounded-[1.8rem] border p-5',
                currentQuestion.type === 'short_text' ||
                  currentQuestion.type === 'emoji' ||
                  currentQuestion.type === 'image_guess'
                  ? currentAnswer && currentAnswer.awardedPoints > 0
                    ? 'border-emerald-300/20 bg-emerald-300/10'
                    : 'border-sky-300/20 bg-sky-300/10'
                  : currentAnswer?.isCorrect
                    ? 'border-emerald-300/20 bg-emerald-300/10'
                    : 'border-rose-300/20 bg-rose-300/10',
              )}
            >
              <p className="text-lg font-semibold text-white">
                {currentQuestion.type === 'short_text'
                  ? currentAnswer && currentAnswer.awardedPoints > 0
                    ? 'Score awarded'
                    : 'Answer revealed'
                  : currentQuestion.type === 'emoji' || currentQuestion.type === 'image_guess'
                    ? currentAnswer
                      ? currentAnswer.isCorrect
                        ? 'Correct answer'
                        : currentAnswer.awardedPoints > 0
                          ? 'Almost correct'
                          : 'Round result'
                      : 'Answer revealed'
                  : currentAnswer
                    ? currentAnswer.isCorrect
                      ? 'Correct answer'
                      : 'Round result'
                    : 'Answer revealed'}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/82">
                {currentQuestion.type === 'short_text'
                  ? currentAnswer
                    ? currentAnswer.awardedPoints > 0
                      ? `You earned ${currentAnswer.awardedPoints} points. ${currentQuestion.acceptedAnswer ?? 'The host reviewed your answer.'}`
                      : `${currentQuestion.isDemo ? 'Demo round. No points were assigned.' : 'No points awarded.'} ${currentQuestion.acceptedAnswer ?? 'The host reviewed your answer.'}`
                    : `Host note: ${currentQuestion.acceptedAnswer ?? 'Manual scoring enabled'}`
                  : currentQuestion.type === 'emoji' || currentQuestion.type === 'image_guess'
                    ? currentAnswer
                      ? currentAnswer.isCorrect
                        ? currentQuestion.isDemo
                          ? 'Nice work. You matched the clue in this demo round.'
                          : `Nice work. You matched the clue and earned ${currentAnswer.awardedPoints} points.`
                        : currentAnswer.awardedPoints > 0
                          ? `You were almost correct. The host awarded ${currentAnswer.awardedPoints} points for your close guess.`
                          : `Your guess was not correct. See the correct answer below.`
                      : `Correct answer: ${currentQuestion.acceptedAnswer ?? 'Not set'}`
                  : currentAnswer
                    ? currentAnswer.isCorrect
                      ? currentQuestion.isDemo
                        ? 'Nice work. You got the demo round right.'
                        : `Nice work. You earned ${currentAnswer.awardedPoints} points.`
                      : `Your answer was not correct.${correctOptionIds.size > 0 ? ' See the correct answer below.' : ''}`
                    : 'You did not submit an answer for this question.'}
              </p>

              {currentAnswer && !currentQuestion.isDemo ? (
                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                  Points earned: {currentAnswer.awardedPoints}
                </div>
              ) : null}

              {currentQuestion.type === 'image_guess' ? (
                <div className="mt-4 grid gap-3">
                  {currentAnswer?.textAnswer ? (
                    <div
                      className={cn(
                        'rounded-[1.2rem] border px-4 py-3',
                        currentAnswer?.isCorrect
                          ? 'border-emerald-300/30 bg-emerald-300/10'
                          : 'border-sky-300/25 bg-sky-300/10',
                      )}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                        {currentAnswer?.isCorrect ? 'Selected answer' : 'Your answer'}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        {currentAnswer.textAnswer}
                      </p>
                    </div>
                  ) : null}

                  {!currentAnswer?.isCorrect ? (
                    <div className="rounded-[1.2rem] border border-emerald-300/30 bg-emerald-300/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                        Correct answer
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        {currentQuestion.acceptedAnswer ?? 'Not set'}
                      </p>
                    </div>
                  ) : null}

                  <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/10 p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                      Full image reveal
                    </p>
                    <ImageRevealCanvas
                      alt="Full reveal"
                      className="mt-3 h-56 sm:h-72"
                      showFull
                      src={currentQuestion.imageUrl}
                    />
                  </div>
                </div>
              ) : currentQuestion.type !== 'short_text' && currentQuestion.type !== 'emoji' ? (
                <div className="mt-4 grid gap-3">
                  {selectedOption ? (
                    <div
                      className={cn(
                        'rounded-[1.2rem] border px-4 py-3',
                        currentAnswer?.isCorrect
                          ? 'border-emerald-300/30 bg-emerald-300/10'
                          : 'border-sky-300/25 bg-sky-300/10',
                      )}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                        {currentAnswer?.isCorrect ? 'Selected answer' : 'Your answer'}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        {selectedOption.label}
                      </p>
                    </div>
                  ) : null}

                  {!currentAnswer?.isCorrect && correctOptions.length > 0 ? (
                    <div className="rounded-[1.2rem] border border-emerald-300/30 bg-emerald-300/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                        Correct answer
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        {correctOptions.map((option) => option.label).join(', ')}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : currentAnswer ? (
            <div className="rounded-[1.8rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
              <p className="text-lg font-semibold text-emerald-50">Answer submitted</p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/80">
                Waiting for the host to reveal scores and move to the next question.
              </p>
            </div>
          ) : isTimerExpired ? (
            <div className="rounded-[1.8rem] border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="text-lg font-semibold text-amber-50">Time is up</p>
              <p className="mt-2 text-sm leading-7 text-amber-50/80">
                Waiting for the host to reveal the answer or move to the next question.
              </p>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                className="button-primary min-w-48"
                disabled={
                  isTimerExpired ||
                  (currentQuestion.type === 'short_text' ||
                  currentQuestion.type === 'emoji' ||
                  currentQuestion.type === 'image_guess'
                    ? !textAnswer.trim()
                    : !selectedOptionId)
                }
                form="player-answer-form"
                type="submit"
              >
                Submit answer
              </button>
            </div>
          )
        }
      >
        {currentQuestion.type === 'section' ? null : !currentAnswer && !isRevealed && !isTimerExpired ? (
          <form
            className="space-y-5"
            id="player-answer-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (isTimerExpired) {
                return
              }

              submitAnswer(session.id, currentQuestion.id, player.id, {
                selectedOptionId: selectedOptionId || undefined,
                textAnswer: textAnswer || undefined,
                playerRevealCount: currentQuestion.type === 'image_guess' ? revealCount : undefined,
              })
              setSelectedOptionId('')
              setTextAnswer('')
            }}
          >
            {currentQuestion.type === 'short_text' ||
            currentQuestion.type === 'emoji' ||
            currentQuestion.type === 'image_guess' ? (
              <div className="space-y-5">
                {currentQuestion.type === 'emoji' ? (
                  <div className="rounded-[1.8rem] border border-white/10 bg-white/4 px-6 py-7 text-center">
                    <p className="text-[4rem] leading-[1.1] sm:text-[5rem] xl:text-[6rem]">
                      {currentQuestion.emojiPrompt?.trim() || '🤔'}
                    </p>
                  </div>
                ) : currentQuestion.type === 'image_guess' ? (
                  <div className="space-y-3">
                    <ImageRevealCanvas
                      alt="Guess image"
                      className="h-64 sm:h-80 xl:h-[25rem]"
                      config={currentQuestion.imageRevealConfig}
                      revealProgress={revealCount * 0.25}
                      src={currentQuestion.imageUrl}
                    />
                    {revealCount < 3 ? (
                      <button
                        className="button-secondary w-full text-sm"
                        type="button"
                        onClick={() => setRevealCount((c) => Math.min(3, c + 1))}
                      >
                        Reveal more · −{Math.floor(currentQuestion.points * 0.3)} pts
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <input
                  className="input rounded-[1.3rem] bg-black/25 px-5 py-4 text-lg"
                  placeholder={
                    currentQuestion.type === 'emoji' || currentQuestion.type === 'image_guess'
                      ? 'Type your guess'
                      : 'Type your answer'
                  }
                  type="text"
                  value={textAnswer}
                  onChange={(event) => setTextAnswer(event.target.value)}
                  required
                />
              </div>
            ) : (
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
                  className={cn(
                    'grid gap-3',
                    resolvedLayout === 'right' ? '' : 'sm:grid-cols-2',
                  )}
                  style={
                    resolvedLayout === 'right'
                      ? getVerticalOptionGridStyle(currentQuestion.options.length)
                      : undefined
                  }
                >
                  {currentQuestion.options.map((option, index) => (
                    <QuestionOptionCard
                      asLabel
                      compact={resolvedLayout === 'right'}
                      fillHeight
                      index={index}
                      interactive
                      key={option.id}
                      option={option}
                      selected={selectedOptionId === option.id}
                      onSelect={setSelectedOptionId}
                    />
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : currentQuestion.type === 'short_text' ||
          currentQuestion.type === 'emoji' ||
          currentQuestion.type === 'image_guess' ? (
          <div className="rounded-[1.8rem] border border-white/10 bg-white/6 px-6 py-5 text-base leading-8 text-white/72">
            {currentQuestion.type === 'emoji' ? (
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/4 px-4 py-5 text-center">
                  <p className="text-[3.5rem] leading-[1.1] sm:text-[4.5rem] xl:text-[5.5rem]">
                    {currentQuestion.emojiPrompt?.trim() || '🤔'}
                  </p>
                </div>
                <p>
                  {currentAnswer?.textAnswer ? `Your answer: ${currentAnswer.textAnswer}` : 'No answer submitted.'}
                </p>
                {isRevealed ? (
                  <p>
                    Correct answer: <span className="font-semibold text-white">{currentQuestion.acceptedAnswer ?? 'Not set'}</span>
                  </p>
                ) : null}
              </div>
            ) : currentQuestion.type === 'image_guess' ? (
              <div className="space-y-4">
                <ImageRevealCanvas
                  alt="Guess image"
                  className="h-56 sm:h-72"
                  config={currentQuestion.imageRevealConfig}
                  revealProgress={isRevealed ? undefined : revealCount * 0.25}
                  showFull={isRevealed}
                  src={currentQuestion.imageUrl}
                />
                <p>
                  {currentAnswer?.textAnswer
                    ? `Your answer: ${currentAnswer.textAnswer}`
                    : 'No answer submitted.'}
                </p>
                {isRevealed ? (
                  <p>
                    Correct answer:{' '}
                    <span className="font-semibold text-white">
                      {currentQuestion.acceptedAnswer ?? 'Not set'}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              currentAnswer?.textAnswer ? `Your answer: ${currentAnswer.textAnswer}` : 'No answer submitted.'
            )}
          </div>
        ) : (
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
                  currentQuestion.imageUrl ? '' : 'hidden',
                )}
              >
                {currentQuestion.imageUrl ? (
                  <img
                    alt="Question visual"
                    className="h-full min-h-48 w-full object-contain p-3"
                    src={currentQuestion.imageUrl}
                  />
                ) : null}
              </div>
            ) : null}

            <div
              className={cn(
                'grid gap-3',
                resolvedLayout === 'right' ? '' : 'sm:grid-cols-2',
              )}
              style={
                resolvedLayout === 'right'
                  ? getVerticalOptionGridStyle(currentQuestion.options.length)
                  : undefined
              }
            >
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer?.selectedOptionId === option.id
                const isCorrect = correctOptionIds.has(option.id)

                const revealState = isRevealed
                  ? isCorrect
                    ? 'correct'
                    : isSelected
                      ? 'incorrect'
                      : 'neutral'
                  : isSelected
                    ? 'selected'
                    : 'neutral'

                return (
                  <QuestionOptionCard
                    compact={resolvedLayout === 'right'}
                    fillHeight
                    index={index}
                    key={option.id}
                    option={option}
                    revealState={revealState}
                    selected={!isRevealed && isSelected}
                  />
                )
              })}
            </div>
          </div>
        )}
      </QuestionSlide>

      {session.leaderboardVisible ? (
        <section className="panel p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Leaderboard</p>
          <div className="mt-4">
            <LeaderboardTable currentPlayerId={player.id} entries={leaderboard} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
