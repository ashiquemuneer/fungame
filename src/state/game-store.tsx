/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createInitialState, createQuestionDraft, generateId, generateRoomCode } from '../lib/mock-data'
import type {
  Answer,
  AppState,
  Game,
  LeaderboardEntry,
  Question,
  QuestionDraft,
  Session,
  SessionPlayer,
} from '../types/game'

const STORAGE_KEY = 'fungame-state-v1'

export interface GameStoreValue {
  state: AppState
  createGame: (title: string, description: string) => string
  updateGameMeta: (gameId: string, patch: Pick<Game, 'title' | 'description' | 'status'>) => void
  saveQuestion: (gameId: string, draft: QuestionDraft, questionId?: string) => void
  deleteQuestion: (gameId: string, questionId: string) => void
  reorderQuestion: (gameId: string, draggedQuestionId: string, targetQuestionId: string) => void
  moveQuestionToEnd: (gameId: string, questionId: string) => void
  createSession: (gameId: string) => string
  startSession: (sessionId: string) => void
  pauseSession: (sessionId: string) => void
  resumeSession: (sessionId: string) => void
  revealMoreImage: (sessionId: string) => void
  endCurrentQuestion: (sessionId: string) => void
  goToNextQuestion: (sessionId: string) => void
  endSession: (sessionId: string) => void
  joinSession: (roomCode: string, displayName: string) => Promise<{ sessionId: string; playerId: string } | null>
  removePlayer: (sessionId: string, playerId: string) => void
  submitAnswer: (
    sessionId: string,
    questionId: string,
    playerId: string,
    payload: { selectedOptionId?: string; textAnswer?: string; playerRevealCount?: number },
  ) => void
  scoreTextAnswer: (answerId: string, awardedPoints: number, isCorrect?: boolean) => void
  resetDemo: () => void
  getGame: (gameId: string) => Game | undefined
  getSession: (sessionId: string) => Session | undefined
  getPlayersForSession: (sessionId: string) => SessionPlayer[]
  getAnswersForSessionQuestion: (sessionId: string, questionId: string) => Answer[]
  getLeaderboard: (sessionId: string) => LeaderboardEntry[]
}

export const GameStoreContext = createContext<GameStoreValue | null>(null)

function parseState() {
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return createInitialState()
  }

  try {
    return JSON.parse(raw) as AppState
  } catch {
    return createInitialState()
  }
}

export function sanitizeDraft(draft: QuestionDraft): QuestionDraft {
  const imageRevealConfig = {
    focusX: Math.max(0, Math.min(100, draft.imageRevealConfig.focusX)),
    focusY: Math.max(0, Math.min(100, draft.imageRevealConfig.focusY)),
    zoom: Math.max(1, Math.min(5, draft.imageRevealConfig.zoom)),
    rotation: Math.max(-180, Math.min(180, draft.imageRevealConfig.rotation)),
    revealStep: Math.max(0.15, Math.min(1.25, draft.imageRevealConfig.revealStep)),
  }

  if (draft.type === 'true_false') {
    return {
      ...draft,
      imageRevealConfig,
      slideLayout: draft.slideLayout ?? 'auto',
      points: draft.isDemo ? 0 : draft.points,
      timeLimitSeconds: draft.isDemo ? 0 : draft.timeLimitSeconds,
      isTieBreaker: draft.isDemo ? false : draft.isTieBreaker,
      options: [
        {
          id: draft.options[0]?.id ?? generateId('opt'),
          label: 'True',
          imageUrl: draft.options[0]?.imageUrl?.trim() || undefined,
          isCorrect: draft.options[0]?.isCorrect ?? true,
        },
        {
          id: draft.options[1]?.id ?? generateId('opt'),
          label: 'False',
          imageUrl: draft.options[1]?.imageUrl?.trim() || undefined,
          isCorrect: draft.options[1]?.isCorrect ?? false,
        },
      ],
    }
  }

  if (draft.type === 'short_text' || draft.type === 'emoji' || draft.type === 'image_guess') {
    return {
      ...draft,
      imageRevealConfig,
      slideLayout: draft.slideLayout ?? 'auto',
      points: draft.isDemo ? 0 : draft.points,
      timeLimitSeconds: draft.isDemo ? 0 : draft.timeLimitSeconds,
      isTieBreaker: draft.isDemo ? false : draft.isTieBreaker,
      options: [],
    }
  }

  if (draft.type === 'section') {
    return {
      ...draft,
      imageRevealConfig,
      slideLayout: draft.slideLayout ?? 'auto',
      options: [],
      points: 0,
      timeLimitSeconds: 0,
      isDemo: false,
      isTieBreaker: false,
    }
  }

  const options = draft.options.length > 0 ? draft.options : createQuestionDraft().options
  const hasCorrect = options.some((option) => option.isCorrect)

  return {
    ...draft,
    imageRevealConfig,
    slideLayout: draft.slideLayout ?? 'auto',
    points: draft.isDemo ? 0 : draft.points,
    timeLimitSeconds: draft.isDemo ? 0 : draft.timeLimitSeconds,
    isTieBreaker: draft.isDemo ? false : draft.isTieBreaker,
    options: options.map((option, index) => ({
      ...option,
      label: option.label.trim(),
      imageUrl: option.imageUrl?.trim() || undefined,
      isCorrect: hasCorrect ? option.isCorrect : index === 0,
    })),
  }
}

function scoreObjectiveAnswer(question: Question, answer: Answer) {
  if (question.type === 'short_text' || question.type === 'section') {
    return answer
  }

  if (question.type === 'image_guess') {
    const normalize = (value: string) => value.trim().toLowerCase()
    const expected = normalize(question.acceptedAnswer ?? '')
    const actual = normalize(answer.textAnswer ?? '')
    const isCorrect = Boolean(expected) && expected === actual
    let awardedPoints = 0

    if (isCorrect && !question.isDemo) {
      const revealCount = answer.playerRevealCount ?? 0
      awardedPoints = Math.max(0, Math.floor(question.points * (1 - revealCount * 0.3)))
    }

    return { ...answer, isCorrect, awardedPoints, scoredManually: false }
  }

  if (question.type === 'emoji') {
    const normalize = (value: string) => value.trim().toLowerCase()
    const expected = normalize(question.acceptedAnswer ?? '')
    const actual = normalize(answer.textAnswer ?? '')
    const isCorrect = Boolean(expected) && expected === actual

    return {
      ...answer,
      isCorrect,
      awardedPoints: isCorrect && !question.isDemo ? question.points : 0,
      scoredManually: false,
    }
  }

  const isCorrect = question.options.some(
    (option) => option.id === answer.selectedOptionId && option.isCorrect,
  )

  return {
    ...answer,
    isCorrect,
    awardedPoints: isCorrect && !question.isDemo ? question.points : 0,
    scoredManually: false,
  }
}

export function GameStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(() =>
    typeof window === 'undefined' ? createInitialState() : parseState(),
  )

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(JSON.parse(event.newValue) as AppState)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const createGame = useCallback((title: string, description: string) => {
    const gameId = generateId('game')
    const now = new Date().toISOString()

    setState((current) => ({
      ...current,
      games: [
        {
          id: gameId,
          title,
          description,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          questions: [],
        },
        ...current.games,
      ],
    }))

    return gameId
  }, [])

  const updateGameMeta = useCallback(
    (gameId: string, patch: Pick<Game, 'title' | 'description' | 'status'>) => {
      setState((current) => ({
        ...current,
        games: current.games.map((game) =>
          game.id === gameId
            ? { ...game, ...patch, updatedAt: new Date().toISOString() }
            : game,
        ),
      }))
    },
    [],
  )

  const saveQuestion = useCallback(
    (gameId: string, draft: QuestionDraft, questionId?: string) => {
      const sanitized = sanitizeDraft(draft)

      setState((current) => ({
        ...current,
        games: current.games.map((game) => {
          if (game.id !== gameId) {
            return game
          }

          const nextQuestion: Question = {
            id: questionId ?? generateId('question'),
            type: sanitized.type,
            prompt: sanitized.prompt.trim(),
            emojiPrompt: sanitized.emojiPrompt.trim() || undefined,
            imageUrl: sanitized.imageUrl.trim() || undefined,
            imageRevealConfig: sanitized.imageRevealConfig,
            acceptedAnswer: sanitized.acceptedAnswer.trim() || undefined,
            slideLayout: sanitized.slideLayout ?? 'auto',
            timeLimitSeconds: sanitized.timeLimitSeconds,
            points: sanitized.points,
            isDemo: sanitized.isDemo,
            isTieBreaker: sanitized.isTieBreaker,
            options: sanitized.options.map((option) => ({
              ...option,
              label: option.label.trim(),
              imageUrl: option.imageUrl?.trim() || undefined,
            })),
          }

          const questions = questionId
            ? game.questions.map((question) =>
                question.id === questionId ? nextQuestion : question,
              )
            : [...game.questions, nextQuestion]

          return {
            ...game,
            questions,
            updatedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [],
  )

  const deleteQuestion = useCallback((gameId: string, questionId: string) => {
    setState((current) => ({
      ...current,
      games: current.games.map((game) =>
        game.id === gameId
          ? {
              ...game,
              questions: game.questions.filter((question) => question.id !== questionId),
              updatedAt: new Date().toISOString(),
            }
          : game,
      ),
    }))
  }, [])

  const reorderQuestion = useCallback(
    (gameId: string, draggedQuestionId: string, targetQuestionId: string) => {
      if (draggedQuestionId === targetQuestionId) {
        return
      }

      setState((current) => ({
        ...current,
        games: current.games.map((game) => {
          if (game.id !== gameId) {
            return game
          }

          const fromIndex = game.questions.findIndex(
            (question) => question.id === draggedQuestionId,
          )
          const toIndex = game.questions.findIndex(
            (question) => question.id === targetQuestionId,
          )

          if (fromIndex === -1 || toIndex === -1) {
            return game
          }

          const nextQuestions = [...game.questions]
          const [movedQuestion] = nextQuestions.splice(fromIndex, 1)
          nextQuestions.splice(toIndex, 0, movedQuestion)

          return {
            ...game,
            questions: nextQuestions,
            updatedAt: new Date().toISOString(),
          }
        }),
      }))
    },
    [],
  )

  const moveQuestionToEnd = useCallback((gameId: string, questionId: string) => {
    setState((current) => ({
      ...current,
      games: current.games.map((game) => {
        if (game.id !== gameId) {
          return game
        }

        const fromIndex = game.questions.findIndex((question) => question.id === questionId)
        if (fromIndex === -1 || fromIndex === game.questions.length - 1) {
          return game
        }

        const nextQuestions = [...game.questions]
        const [movedQuestion] = nextQuestions.splice(fromIndex, 1)
        nextQuestions.push(movedQuestion)

        return {
          ...game,
          questions: nextQuestions,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  }, [])

  const createSession = useCallback((gameId: string) => {
    const sessionId = generateId('session')

    setState((current) => ({
      ...current,
      sessions: [
        {
          id: sessionId,
          gameId,
          roomCode: generateRoomCode(),
          state: 'lobby',
          currentQuestionIndex: null,
          currentQuestionStartedAt: undefined,
          pausedRemainingMs: undefined,
          imageRevealLevel: 0,
          revealAnswers: false,
          leaderboardVisible: false,
          allowJoin: true,
          createdAt: new Date().toISOString(),
        },
        ...current.sessions,
      ],
    }))

    return sessionId
  }, [])

  const startSession = useCallback((sessionId: string) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              state: 'live',
              currentQuestionIndex: session.currentQuestionIndex ?? 0,
              currentQuestionStartedAt: new Date().toISOString(),
              pausedRemainingMs: undefined,
              imageRevealLevel: 0,
              startedAt: session.startedAt ?? new Date().toISOString(),
              revealAnswers: false,
              leaderboardVisible: false,
            }
          : session,
      ),
    }))
  }, [])

  const pauseSession = useCallback((sessionId: string) => {
    setState((current) => {
      const session = current.sessions.find((item) => item.id === sessionId)
      if (!session) {
        return current
      }

      const game = current.games.find((item) => item.id === session.gameId)
      const question =
        typeof session.currentQuestionIndex === 'number'
          ? game?.questions[session.currentQuestionIndex]
          : undefined

      const pausedRemainingMs =
        question && question.type !== 'section' && session.currentQuestionStartedAt
          ? Math.max(
              0,
              question.timeLimitSeconds * 1000 -
                (Date.now() - new Date(session.currentQuestionStartedAt).getTime()),
            )
          : session.pausedRemainingMs

      return {
        ...current,
        sessions: current.sessions.map((item) =>
          item.id === sessionId
            ? { ...item, state: 'paused', pausedRemainingMs }
            : item,
        ),
      }
    })
  }, [])

  const resumeSession = useCallback((sessionId: string) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== sessionId) {
          return session
        }

        let currentQuestionStartedAt = session.currentQuestionStartedAt

        if (typeof session.pausedRemainingMs === 'number' && session.currentQuestionIndex !== null) {
          const game = current.games.find((item) => item.id === session.gameId)
          const question = game?.questions[session.currentQuestionIndex]

          if (game && question && question.type !== 'section') {
            const totalMs = question.timeLimitSeconds * 1000
            const elapsed = totalMs - session.pausedRemainingMs
            currentQuestionStartedAt = new Date(Date.now() - Math.max(0, elapsed)).toISOString()
          }
        }

        return {
          ...session,
          state: 'live',
          currentQuestionStartedAt,
          pausedRemainingMs: undefined,
        }
      }),
    }))
  }, [])

  const revealMoreImage = useCallback((sessionId: string) => {
    setState((current) => {
      const session = current.sessions.find((item) => item.id === sessionId)
      if (!session || session.currentQuestionIndex === null || session.revealAnswers) {
        return current
      }

      const game = current.games.find((item) => item.id === session.gameId)
      const question = game?.questions[session.currentQuestionIndex]
      if (!question || question.type !== 'image_guess') {
        return current
      }

      const zoom = question.imageRevealConfig?.zoom ?? 2.8
      const revealStep = question.imageRevealConfig?.revealStep ?? 0.45
      const maxLevel = Math.max(0, Math.ceil((zoom - 1) / revealStep))
      const nextLevel = Math.min(maxLevel, (session.imageRevealLevel ?? 0) + 1)

      if (nextLevel === (session.imageRevealLevel ?? 0)) {
        return current
      }

      return {
        ...current,
        sessions: current.sessions.map((item) =>
          item.id === sessionId ? { ...item, imageRevealLevel: nextLevel } : item,
        ),
      }
    })
  }, [])

  const endCurrentQuestion = useCallback((sessionId: string) => {
    setState((current) => {
      const session = current.sessions.find((item) => item.id === sessionId)
      if (!session || session.currentQuestionIndex === null) {
        return current
      }

      const game = current.games.find((item) => item.id === session.gameId)
      const question = game?.questions[session.currentQuestionIndex]

      if (!game || !question) {
        return current
      }

      return {
        ...current,
        answers: current.answers.map((answer) =>
          answer.sessionId === sessionId && answer.questionId === question.id
            ? scoreObjectiveAnswer(question, answer)
            : answer,
        ),
        sessions: current.sessions.map((item) =>
          item.id === sessionId
            ? { ...item, revealAnswers: true, leaderboardVisible: true }
            : item,
        ),
      }
    })
  }, [])

  const goToNextQuestion = useCallback((sessionId: string) => {
    setState((current) => {
      const session = current.sessions.find((item) => item.id === sessionId)
      if (!session) {
        return current
      }

      const game = current.games.find((item) => item.id === session.gameId)
      if (!game) {
        return current
      }

      const nextIndex = (session.currentQuestionIndex ?? -1) + 1
      const reachedEnd = nextIndex >= game.questions.length

      return {
        ...current,
        sessions: current.sessions.map((item) => {
          if (item.id !== sessionId) {
            return item
          }

          if (reachedEnd) {
            return {
              ...item,
              state: 'completed',
              leaderboardVisible: true,
              revealAnswers: true,
              currentQuestionIndex: game.questions.length - 1,
              pausedRemainingMs: undefined,
              imageRevealLevel: 0,
              allowJoin: false,
              endedAt: new Date().toISOString(),
            }
          }

          return {
            ...item,
            currentQuestionIndex: nextIndex,
            currentQuestionStartedAt: new Date().toISOString(),
            pausedRemainingMs: undefined,
            imageRevealLevel: 0,
            revealAnswers: false,
            leaderboardVisible: false,
            state: 'live',
          }
        }),
      }
    })
  }, [])

  const endSession = useCallback((sessionId: string) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              state: 'completed',
              allowJoin: false,
              pausedRemainingMs: undefined,
              imageRevealLevel: session.imageRevealLevel ?? 0,
              leaderboardVisible: true,
              revealAnswers: true,
              endedAt: new Date().toISOString(),
            }
          : session,
      ),
    }))
  }, [])

  const joinSession = useCallback(async (roomCode: string, displayName: string) => {
    const normalizedCode = roomCode.trim().toUpperCase()
    const cleanName = displayName.trim()

    if (!normalizedCode || !cleanName) {
      return null
    }

    const session = state.sessions.find(
      (item) => item.roomCode === normalizedCode && item.allowJoin,
    )

    if (!session) {
      return null
    }

    const existingPlayer = state.players.find(
      (player) =>
        player.sessionId === session.id &&
        player.displayName.toLowerCase() === cleanName.toLowerCase(),
    )

    if (existingPlayer) {
      return {
        sessionId: session.id,
        playerId: existingPlayer.id,
      }
    }

    const playerId = generateId('player')

    setState((current) => ({
      ...current,
      players: [
        ...current.players,
        {
          id: playerId,
          sessionId: session.id,
          displayName: cleanName,
          joinedAt: new Date().toISOString(),
          isActive: true,
          isDisqualified: false,
        },
      ],
    }))

    return { sessionId: session.id, playerId }
  }, [state.players, state.sessions])

  const removePlayer = useCallback((sessionId: string, playerId: string) => {
    setState((current) => ({
      ...current,
      players: current.players.filter(
        (player) => !(player.sessionId === sessionId && player.id === playerId),
      ),
      answers: current.answers.filter((answer) => answer.playerId !== playerId),
    }))
  }, [])

  const submitAnswer = useCallback(
    (
      sessionId: string,
      questionId: string,
      playerId: string,
      payload: { selectedOptionId?: string; textAnswer?: string; playerRevealCount?: number },
    ) => {
      setState((current) => {
        const existing = current.answers.find(
          (answer) =>
            answer.sessionId === sessionId &&
            answer.questionId === questionId &&
            answer.playerId === playerId,
        )

        if (existing) {
          return current
        }

        return {
          ...current,
          answers: [
            ...current.answers,
            {
              id: generateId('answer'),
              sessionId,
              questionId,
              playerId,
              selectedOptionId: payload.selectedOptionId,
              textAnswer: payload.textAnswer?.trim(),
              playerRevealCount: payload.playerRevealCount,
              submittedAt: new Date().toISOString(),
              awardedPoints: 0,
              scoredManually: false,
            },
          ],
        }
      })
    },
    [],
  )

  const scoreTextAnswer = useCallback((answerId: string, awardedPoints: number, isCorrect?: boolean) => {
    setState((current) => ({
      ...current,
      answers: current.answers.map((answer) =>
        answer.id === answerId
          ? { ...answer, awardedPoints, isCorrect, scoredManually: true }
          : answer,
      ),
    }))
  }, [])

  const resetDemo = useCallback(() => {
    setState(createInitialState())
  }, [])

  const getGame = useCallback((gameId: string) => state.games.find((game) => game.id === gameId), [state.games])

  const getSession = useCallback(
    (sessionId: string) => state.sessions.find((session) => session.id === sessionId),
    [state.sessions],
  )

  const getPlayersForSession = useCallback(
    (sessionId: string) =>
      state.players
        .filter((player) => player.sessionId === sessionId)
        .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt)),
    [state.players],
  )

  const getAnswersForSessionQuestion = useCallback(
    (sessionId: string, questionId: string) =>
      state.answers.filter(
        (answer) => answer.sessionId === sessionId && answer.questionId === questionId,
      ),
    [state.answers],
  )

  const getLeaderboard = useCallback(
    (sessionId: string) => {
      const players = state.players.filter(
        (player) => player.sessionId === sessionId && !player.isDisqualified,
      )

      const scores = players.map((player) => {
        const totalPoints = state.answers
          .filter((answer) => answer.playerId === player.id)
          .reduce((sum, answer) => sum + answer.awardedPoints, 0)

        return {
          playerId: player.id,
          displayName: player.displayName,
          totalPoints,
        }
      })

      return scores
        .sort((left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName))
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
    },
    [state.answers, state.players],
  )

  const value = useMemo<GameStoreValue>(
    () => ({
      state,
      createGame,
      updateGameMeta,
      saveQuestion,
      deleteQuestion,
      reorderQuestion,
      moveQuestionToEnd,
      createSession,
      startSession,
      pauseSession,
      resumeSession,
      revealMoreImage,
      endCurrentQuestion,
      goToNextQuestion,
      endSession,
      joinSession,
      removePlayer,
      submitAnswer,
      scoreTextAnswer,
      resetDemo,
      getGame,
      getSession,
      getPlayersForSession,
      getAnswersForSessionQuestion,
      getLeaderboard,
    }),
    [
      state,
      createGame,
      updateGameMeta,
      saveQuestion,
      deleteQuestion,
      reorderQuestion,
      moveQuestionToEnd,
      createSession,
      startSession,
      pauseSession,
      resumeSession,
      revealMoreImage,
      endCurrentQuestion,
      goToNextQuestion,
      endSession,
      joinSession,
      removePlayer,
      submitAnswer,
      scoreTextAnswer,
      resetDemo,
      getGame,
      getSession,
      getPlayersForSession,
      getAnswersForSessionQuestion,
      getLeaderboard,
    ],
  )

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}

export function useGameStore() {
  const context = useContext(GameStoreContext)

  if (!context) {
    throw new Error('useGameStore must be used within GameStoreProvider')
  }

  return context
}
