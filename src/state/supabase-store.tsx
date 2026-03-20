/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { supabase } from '../lib/supabase'
import { GameStoreContext, sanitizeDraft, type GameStoreValue } from './game-store'
import { generateRoomCode } from '../lib/mock-data'
import { getMaxImageRevealLevel } from '../lib/image-reveal'
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

// ---------------------------------------------------------------------------
// DB → App mapping
// ---------------------------------------------------------------------------

function mapQuestion(row: any): Question {
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    emojiPrompt: row.emoji_prompt ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageRevealConfig: row.image_reveal_config ?? undefined,
    acceptedAnswer: row.accepted_answer ?? undefined,
    slideLayout: row.slide_layout ?? 'auto',
    timeLimitSeconds: row.time_limit_seconds,
    points: row.points,
    isDemo: row.is_demo ?? false,
    isTieBreaker: row.is_tie_breaker ?? false,
    options: (row.question_options ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((o: any) => ({
        id: o.id,
        label: o.label,
        imageUrl: o.image_url ?? undefined,
        isCorrect: o.is_correct,
      })),
  }
}

function mapGame(row: any): Game {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    questions: (row.questions ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map(mapQuestion),
  }
}

function mapSession(row: any): Session {
  return {
    id: row.id,
    gameId: row.game_id,
    roomCode: row.room_code,
    state: row.state,
    currentQuestionIndex: row.current_question_index ?? null,
    currentQuestionStartedAt: row.current_question_started_at ?? undefined,
    pausedRemainingMs: row.paused_remaining_ms ?? undefined,
    imageRevealLevel: row.image_reveal_level ?? 0,
    revealAnswers: row.reveal_answers,
    leaderboardVisible: row.leaderboard_visible,
    allowJoin: row.allow_join,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
    createdAt: row.created_at,
  }
}

function mapPlayer(row: any): SessionPlayer {
  return {
    id: row.id,
    sessionId: row.session_id,
    displayName: row.display_name,
    joinedAt: row.joined_at,
    isActive: row.is_active,
    isDisqualified: row.is_disqualified,
  }
}

function mapAnswer(row: any): Answer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    playerId: row.player_id,
    selectedOptionId: row.selected_option_id ?? undefined,
    textAnswer: row.text_answer ?? undefined,
    playerRevealCount: row.player_reveal_count ?? undefined,
    submittedAt: row.submitted_at,
    isCorrect: row.is_correct ?? undefined,
    awardedPoints: row.awarded_points ?? 0,
    scoredManually: row.scored_manually,
  }
}

// ---------------------------------------------------------------------------
// Scoring (mirrors game-store logic)
// ---------------------------------------------------------------------------

function scoreAnswer(
  question: Question,
  answer: Answer,
): Pick<Answer, 'isCorrect' | 'awardedPoints' | 'scoredManually'> {
  if (question.type === 'short_text' || question.type === 'section') {
    return { isCorrect: answer.isCorrect, awardedPoints: answer.awardedPoints, scoredManually: answer.scoredManually }
  }

  if (question.type === 'image_guess') {
    const normalize = (v: string) => v.trim().toLowerCase()
    const isCorrect = Boolean(question.acceptedAnswer) &&
      normalize(question.acceptedAnswer!) === normalize(answer.textAnswer ?? '')
    const revealCount = answer.playerRevealCount ?? 0
    const awardedPoints = isCorrect && !question.isDemo
      ? Math.max(0, Math.floor(question.points * (1 - revealCount * 0.3)))
      : 0
    return { isCorrect, awardedPoints, scoredManually: false }
  }

  if (question.type === 'emoji') {
    const normalize = (v: string) => v.trim().toLowerCase()
    const isCorrect = Boolean(question.acceptedAnswer) &&
      normalize(question.acceptedAnswer!) === normalize(answer.textAnswer ?? '')
    return {
      isCorrect,
      awardedPoints: isCorrect && !question.isDemo ? question.points : 0,
      scoredManually: false,
    }
  }

  const isCorrect = question.options.some(
    (o) => o.id === answer.selectedOptionId && o.isCorrect,
  )
  return {
    isCorrect,
    awardedPoints: isCorrect && !question.isDemo ? question.points : 0,
    scoredManually: false,
  }
}

// ---------------------------------------------------------------------------
// Data loader
// ---------------------------------------------------------------------------

const GAME_SELECT = `
  id, host_user_id, title, description, status, created_at, updated_at,
  questions (
    id, game_id, position, type, prompt, emoji_prompt, image_url,
    image_reveal_config, accepted_answer, slide_layout, time_limit_seconds,
    points, is_demo, is_tie_breaker, created_at,
    question_options (id, question_id, position, label, image_url, is_correct)
  )
`.trim()

async function loadAll(userId: string): Promise<AppState> {
  if (!supabase) return { games: [], sessions: [], players: [], answers: [] }

  // 1. Games I host
  const { data: hostGamesData } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('host_user_id', userId)
    .order('created_at', { ascending: false })

  // 2. Sessions I host
  const { data: hostSessionData } = await supabase
    .from('sessions')
    .select('*')
    .eq('host_user_id', userId)
    .order('created_at', { ascending: false })

  // 3. Sessions where I'm a player
  const { data: memberships } = await supabase
    .from('session_players')
    .select('session_id')
    .eq('auth_user_id', userId)

  const playerSessionIds = (memberships ?? []).map((m) => m.session_id)

  let playerSessionData: any[] = []
  if (playerSessionIds.length > 0) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .in('id', playerSessionIds)
    playerSessionData = data ?? []
  }

  // Merge sessions (dedup)
  const sessionMap = new Map<string, any>()
  for (const s of [...(hostSessionData ?? []), ...playerSessionData]) {
    sessionMap.set(s.id, s)
  }
  const allSessionRows = [...sessionMap.values()]
  const allSessionIds = allSessionRows.map((s) => s.id)

  // 4. Load games for player sessions that I don't already have
  const hostGameIds = new Set(((hostGamesData ?? []) as any[]).map((g) => g.id))
  const missingGameIds = playerSessionData
    .map((s) => s.game_id)
    .filter((id) => !hostGameIds.has(id))

  let playerGamesData: any[] = []
  if (missingGameIds.length > 0) {
    const { data } = await supabase
      .from('games')
      .select(GAME_SELECT)
      .in('id', missingGameIds)
    playerGamesData = data ?? []
  }

  // 5. Players and answers for all sessions
  let playerRows: any[] = []
  let answerRows: any[] = []

  if (allSessionIds.length > 0) {
    const [{ data: pData }, { data: aData }] = await Promise.all([
      supabase.from('session_players').select('*').in('session_id', allSessionIds),
      supabase.from('answers').select('*').in('session_id', allSessionIds),
    ])
    playerRows = pData ?? []
    answerRows = aData ?? []
  }

  return {
    games: [...(hostGamesData ?? []), ...playerGamesData].map(mapGame),
    sessions: allSessionRows.map(mapSession),
    players: playerRows.map(mapPlayer),
    answers: answerRows.map(mapAnswer),
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SupabaseStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>({ games: [], sessions: [], players: [], answers: [] })
  const [userId, setUserId] = useState<string | null>(null)
  const stateRef = useRef(state)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Anonymous sign-in on mount
  useEffect(() => {
    if (!supabase) return

    async function init() {
      const { data: { session } } = await supabase!.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        const { data } = await supabase!.auth.signInAnonymously()
        setUserId(data.user?.id ?? null)
      }
    }

    init()
  }, [])

  // Load state once signed in
  useEffect(() => {
    if (!userId) return
    loadAll(userId).then(setState)
  }, [userId])

  // Debounced refresh helper
  const scheduleRefresh = useCallback(() => {
    if (!userId) return
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      loadAll(userId).then(setState)
    }, 250)
  }, [userId])

  // Realtime subscriptions
  useEffect(() => {
    if (!userId || !supabase) return

    const channel = supabase
      .channel('fungame-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, scheduleRefresh)
      .subscribe()

    return () => { supabase!.removeChannel(channel) }
  }, [userId, scheduleRefresh])

  // ---------------------------------------------------------------------------
  // Game mutations
  // ---------------------------------------------------------------------------

  const createGame = useCallback((title: string, description: string): string => {
    if (!supabase || !userId) return ''
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newGame: Game = { id, title, description, status: 'draft', createdAt: now, updatedAt: now, questions: [] }

    setState((c) => ({ ...c, games: [newGame, ...c.games] }))

    supabase.from('games')
      .insert({ id, host_user_id: userId, title, description, status: 'draft', created_at: now, updated_at: now })
      .then(({ error }) => { if (error) console.error('createGame:', error) })

    return id
  }, [userId])

  const updateGameMeta = useCallback((gameId: string, patch: Pick<Game, 'title' | 'description' | 'status'>) => {
    if (!supabase) return
    const now = new Date().toISOString()
    setState((c) => ({
      ...c,
      games: c.games.map((g) => g.id === gameId ? { ...g, ...patch, updatedAt: now } : g),
    }))
    supabase.from('games')
      .update({ title: patch.title, description: patch.description, status: patch.status, updated_at: now })
      .eq('id', gameId)
      .then(({ error }) => { if (error) console.error('updateGameMeta:', error) })
  }, [])

  const saveQuestion = useCallback((gameId: string, draft: QuestionDraft, questionId?: string) => {
    if (!supabase) return
    const sanitized = sanitizeDraft(draft)
    const qId = questionId ?? crypto.randomUUID()
    const now = new Date().toISOString()

    const nextQuestion: import('../types/game').Question = {
      id: qId,
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
      options: sanitized.options.map((o) => ({
        id: o.id,
        label: o.label.trim(),
        imageUrl: o.imageUrl?.trim() || undefined,
        isCorrect: o.isCorrect,
      })),
    }

    setState((c) => ({
      ...c,
      games: c.games.map((g) => {
        if (g.id !== gameId) return g
        const questions = questionId
          ? g.questions.map((q) => (q.id === questionId ? nextQuestion : q))
          : [...g.questions, nextQuestion]
        return { ...g, questions, updatedAt: now }
      }),
    }))

    async function persist() {
      const game = stateRef.current.games.find((g) => g.id === gameId)
      const position = questionId
        ? (game?.questions.findIndex((q) => q.id === questionId) ?? 0)
        : (game?.questions.length ?? 0)

      const { error: qError } = await supabase!.from('questions').upsert({
        id: qId,
        game_id: gameId,
        position,
        type: sanitized.type,
        prompt: sanitized.prompt.trim(),
        emoji_prompt: sanitized.emojiPrompt.trim() || null,
        image_url: sanitized.imageUrl.trim() || null,
        image_reveal_config: sanitized.imageRevealConfig,
        accepted_answer: sanitized.acceptedAnswer.trim() || null,
        slide_layout: sanitized.slideLayout ?? 'auto',
        time_limit_seconds: sanitized.timeLimitSeconds,
        points: sanitized.points,
        is_demo: sanitized.isDemo,
        is_tie_breaker: sanitized.isTieBreaker,
      })
      if (qError) { console.error('saveQuestion upsert:', qError); return }

      await supabase!.from('question_options').delete().eq('question_id', qId)

      if (sanitized.options.length > 0) {
        const { error: oError } = await supabase!.from('question_options').insert(
          sanitized.options.map((opt, idx) => ({
            id: opt.id,
            question_id: qId,
            position: idx,
            label: opt.label.trim(),
            image_url: opt.imageUrl?.trim() || null,
            is_correct: opt.isCorrect,
          })),
        )
        if (oError) console.error('saveQuestion options:', oError)
      }

      await supabase!.from('games').update({ updated_at: now }).eq('id', gameId)
    }

    persist()
  }, [])

  const duplicateQuestion = useCallback((gameId: string, questionId: string) => {
    if (!supabase) return
    const now = new Date().toISOString()

    setState((c) => ({
      ...c,
      games: c.games.map((g) => {
        if (g.id !== gameId) return g
        const idx = g.questions.findIndex((q) => q.id === questionId)
        if (idx === -1) return g
        const original = g.questions[idx]
        const copy: import('../types/game').Question = {
          ...original,
          id: crypto.randomUUID(),
          options: original.options.map((opt) => ({ ...opt, id: crypto.randomUUID() })),
        }
        const questions = [
          ...g.questions.slice(0, idx + 1),
          copy,
          ...g.questions.slice(idx + 1),
        ]
        return { ...g, questions, updatedAt: now }
      }),
    }))

    async function persist() {
      const game = stateRef.current.games.find((g) => g.id === gameId)
      if (!game) return
      const idx = game.questions.findIndex((q) => q.id === questionId)
      if (idx === -1) return
      const copy = game.questions[idx + 1]
      if (!copy) return

      const { error: qError } = await supabase!.from('questions').insert({
        id: copy.id,
        game_id: gameId,
        position: idx + 1,
        type: copy.type,
        prompt: copy.prompt,
        emoji_prompt: copy.emojiPrompt ?? null,
        image_url: copy.imageUrl ?? null,
        image_reveal_config: copy.imageRevealConfig,
        accepted_answer: copy.acceptedAnswer ?? null,
        slide_layout: copy.slideLayout ?? 'auto',
        time_limit_seconds: copy.timeLimitSeconds,
        points: copy.points,
        is_demo: copy.isDemo,
        is_tie_breaker: copy.isTieBreaker,
      })
      if (qError) { console.error('duplicateQuestion:', qError); return }

      if (copy.options.length > 0) {
        await supabase!.from('question_options').insert(
          copy.options.map((opt, i) => ({
            id: opt.id,
            question_id: copy.id,
            position: i,
            label: opt.label,
            image_url: opt.imageUrl ?? null,
            is_correct: opt.isCorrect,
          })),
        )
      }
      await supabase!.from('games').update({ updated_at: now }).eq('id', gameId)
    }

    persist()
  }, [])

  const deleteQuestion = useCallback((gameId: string, questionId: string) => {
    if (!supabase) return
    setState((c) => ({
      ...c,
      games: c.games.map((g) =>
        g.id === gameId
          ? { ...g, questions: g.questions.filter((q) => q.id !== questionId), updatedAt: new Date().toISOString() }
          : g,
      ),
    }))
    supabase.from('questions').delete().eq('id', questionId)
      .then(({ error }) => { if (error) console.error('deleteQuestion:', error) })
  }, [])

  const reorderQuestion = useCallback((gameId: string, draggedId: string, targetId: string) => {
    if (!supabase || draggedId === targetId) return

    setState((c) => ({
      ...c,
      games: c.games.map((g) => {
        if (g.id !== gameId) return g
        const fromIdx = g.questions.findIndex((q) => q.id === draggedId)
        const toIdx = g.questions.findIndex((q) => q.id === targetId)
        if (fromIdx === -1 || toIdx === -1) return g
        const next = [...g.questions]
        const [moved] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, moved)
        // Persist new positions
        next.forEach((q, idx) => {
          supabase!.from('questions').update({ position: idx }).eq('id', q.id)
            .then(({ error }) => { if (error) console.error('reorderQuestion:', error) })
        })
        return { ...g, questions: next, updatedAt: new Date().toISOString() }
      }),
    }))
  }, [])

  const moveQuestionToEnd = useCallback((gameId: string, questionId: string) => {
    if (!supabase) return

    setState((c) => ({
      ...c,
      games: c.games.map((g) => {
        if (g.id !== gameId) return g
        const idx = g.questions.findIndex((q) => q.id === questionId)
        if (idx === -1 || idx === g.questions.length - 1) return g
        const next = [...g.questions]
        const [moved] = next.splice(idx, 1)
        next.push(moved)
        next.forEach((q, i) => {
          supabase!.from('questions').update({ position: i }).eq('id', q.id)
            .then(({ error }) => { if (error) console.error('moveQuestionToEnd:', error) })
        })
        return { ...g, questions: next, updatedAt: new Date().toISOString() }
      }),
    }))
  }, [])

  // ---------------------------------------------------------------------------
  // Session mutations
  // ---------------------------------------------------------------------------

  const createSession = useCallback((gameId: string): string => {
    if (!supabase || !userId) return ''
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const roomCode = generateRoomCode()

    const newSession: Session = {
      id, gameId, roomCode, state: 'lobby',
      currentQuestionIndex: null, imageRevealLevel: 0,
      revealAnswers: false, leaderboardVisible: false, allowJoin: true, createdAt: now,
    }

    setState((c) => ({ ...c, sessions: [newSession, ...c.sessions] }))

    supabase.from('sessions').insert({
      id,
      game_id: gameId,
      host_user_id: userId,
      room_code: roomCode,
      state: 'lobby',
      image_reveal_level: 0,
      reveal_answers: false,
      leaderboard_visible: false,
      allow_join: true,
      created_at: now,
    }).then(({ error }) => { if (error) console.error('createSession:', error) })

    return id
  }, [userId])

  const patchSession = useCallback((sessionId: string, patch: Partial<Session>, dbPatch: Record<string, unknown>) => {
    setState((c) => ({
      ...c,
      sessions: c.sessions.map((s) => s.id === sessionId ? { ...s, ...patch } : s),
    }))
    supabase!.from('sessions').update(dbPatch).eq('id', sessionId)
      .then(({ error }) => { if (error) console.error('patchSession:', error) })
  }, [])

  const startSession = useCallback((sessionId: string) => {
    const now = new Date().toISOString()
    patchSession(sessionId, {
      state: 'live',
      currentQuestionIndex: 0,
      currentQuestionStartedAt: now,
      pausedRemainingMs: undefined,
      imageRevealLevel: 0,
      revealAnswers: false,
      leaderboardVisible: false,
    }, {
      state: 'live',
      current_question_index: 0,
      current_question_started_at: now,
      paused_remaining_ms: null,
      image_reveal_level: 0,
      reveal_answers: false,
      leaderboard_visible: false,
      started_at: now,
    })
  }, [patchSession])

  const pauseSession = useCallback((sessionId: string) => {
    if (!supabase) return
    const session = stateRef.current.sessions.find((s) => s.id === sessionId)
    if (!session) return

    const game = stateRef.current.games.find((g) => g.id === session.gameId)
    const question = typeof session.currentQuestionIndex === 'number'
      ? game?.questions[session.currentQuestionIndex]
      : undefined

    const pausedRemainingMs = question && question.type !== 'section' && session.currentQuestionStartedAt
      ? Math.max(0, question.timeLimitSeconds * 1000 - (Date.now() - new Date(session.currentQuestionStartedAt).getTime()))
      : session.pausedRemainingMs

    patchSession(sessionId, { state: 'paused', pausedRemainingMs }, {
      state: 'paused',
      paused_remaining_ms: pausedRemainingMs ?? null,
    })
  }, [patchSession])

  const resumeSession = useCallback((sessionId: string) => {
    const session = stateRef.current.sessions.find((s) => s.id === sessionId)
    if (!session) return

    let currentQuestionStartedAt = session.currentQuestionStartedAt

    if (typeof session.pausedRemainingMs === 'number' && session.currentQuestionIndex !== null) {
      const game = stateRef.current.games.find((g) => g.id === session.gameId)
      const question = game?.questions[session.currentQuestionIndex]
      if (game && question && question.type !== 'section') {
        const elapsed = question.timeLimitSeconds * 1000 - session.pausedRemainingMs
        currentQuestionStartedAt = new Date(Date.now() - Math.max(0, elapsed)).toISOString()
      }
    }

    patchSession(sessionId, { state: 'live', currentQuestionStartedAt, pausedRemainingMs: undefined }, {
      state: 'live',
      current_question_started_at: currentQuestionStartedAt ?? null,
      paused_remaining_ms: null,
    })
  }, [patchSession])

  const revealMoreImage = useCallback((sessionId: string) => {
    if (!supabase) return
    const session = stateRef.current.sessions.find((s) => s.id === sessionId)
    if (!session || session.currentQuestionIndex === null || session.revealAnswers) return

    const game = stateRef.current.games.find((g) => g.id === session.gameId)
    const question = game?.questions[session.currentQuestionIndex]
    if (!question || question.type !== 'image_guess') return

    const maxLevel = getMaxImageRevealLevel(question.imageRevealConfig)
    const nextLevel = Math.min(maxLevel, (session.imageRevealLevel ?? 0) + 1)
    if (nextLevel === session.imageRevealLevel) return

    patchSession(sessionId, { imageRevealLevel: nextLevel }, { image_reveal_level: nextLevel })
  }, [patchSession])

  const endCurrentQuestion = useCallback(async (sessionId: string) => {
    if (!supabase) return
    const session = stateRef.current.sessions.find((s) => s.id === sessionId)
    if (!session || session.currentQuestionIndex === null) return

    const game = stateRef.current.games.find((g) => g.id === session.gameId)
    const question = game?.questions[session.currentQuestionIndex]
    if (!game || !question) return

    const answers = stateRef.current.answers.filter(
      (a) => a.sessionId === sessionId && a.questionId === question.id,
    )

    // Score all answers
    const scored = answers.map((a) => ({ ...a, ...scoreAnswer(question, a) }))

    // Optimistic local update
    setState((c) => ({
      ...c,
      answers: c.answers.map((a) => {
        const s = scored.find((x) => x.id === a.id)
        return s ?? a
      }),
      sessions: c.sessions.map((s) =>
        s.id === sessionId ? { ...s, revealAnswers: true, leaderboardVisible: true } : s,
      ),
    }))

    // Persist to DB
    await Promise.all(
      scored.map((a) =>
        supabase!.from('answers').update({
          is_correct: a.isCorrect,
          awarded_points: a.awardedPoints,
          scored_manually: a.scoredManually,
        }).eq('id', a.id),
      ),
    )

    await supabase!.from('sessions').update({ reveal_answers: true, leaderboard_visible: true }).eq('id', sessionId)
  }, [])

  const goToNextQuestion = useCallback((sessionId: string) => {
    const session = stateRef.current.sessions.find((s) => s.id === sessionId)
    if (!session) return

    const game = stateRef.current.games.find((g) => g.id === session.gameId)
    if (!game) return

    const nextIndex = (session.currentQuestionIndex ?? -1) + 1
    const reachedEnd = nextIndex >= game.questions.length
    const now = new Date().toISOString()

    if (reachedEnd) {
      patchSession(sessionId, {
        state: 'completed',
        leaderboardVisible: true,
        revealAnswers: true,
        currentQuestionIndex: game.questions.length - 1,
        pausedRemainingMs: undefined,
        imageRevealLevel: 0,
        allowJoin: false,
        endedAt: now,
      }, {
        state: 'completed',
        leaderboard_visible: true,
        reveal_answers: true,
        current_question_index: game.questions.length - 1,
        paused_remaining_ms: null,
        image_reveal_level: 0,
        allow_join: false,
        ended_at: now,
      })
    } else {
      patchSession(sessionId, {
        state: 'live',
        currentQuestionIndex: nextIndex,
        currentQuestionStartedAt: now,
        pausedRemainingMs: undefined,
        imageRevealLevel: 0,
        revealAnswers: false,
        leaderboardVisible: false,
      }, {
        state: 'live',
        current_question_index: nextIndex,
        current_question_started_at: now,
        paused_remaining_ms: null,
        image_reveal_level: 0,
        reveal_answers: false,
        leaderboard_visible: false,
      })
    }
  }, [patchSession])

  const endSession = useCallback((sessionId: string) => {
    const now = new Date().toISOString()
    patchSession(sessionId, {
      state: 'completed',
      allowJoin: false,
      leaderboardVisible: true,
      revealAnswers: true,
      endedAt: now,
    }, {
      state: 'completed',
      allow_join: false,
      leaderboard_visible: true,
      reveal_answers: true,
      ended_at: now,
    })
  }, [patchSession])

  const joinSession = useCallback(async (roomCode: string, displayName: string) => {
    if (!supabase) return null

    try {
      // Ensure signed in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) return null
      }

      const { data, error } = await supabase.rpc('join_session', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_display_name: displayName.trim(),
      })

      if (error || !data?.[0]) return null

      const { session_id: sessionId, player_id: playerId } = data[0]

      // Refresh state so PlayPage can find the session/game
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (uid) {
        setUserId(uid)
        loadAll(uid).then(setState)
      }

      return { sessionId, playerId }
    } catch {
      return null
    }
  }, [])

  const removePlayer = useCallback((sessionId: string, playerId: string) => {
    if (!supabase) return
    setState((c) => ({
      ...c,
      players: c.players.filter((p) => !(p.sessionId === sessionId && p.id === playerId)),
      answers: c.answers.filter((a) => a.playerId !== playerId),
    }))
    supabase.from('session_players').delete().eq('id', playerId)
      .then(({ error }) => { if (error) console.error('removePlayer:', error) })
  }, [])

  const submitAnswer = useCallback((
    sessionId: string,
    questionId: string,
    playerId: string,
    payload: { selectedOptionId?: string; textAnswer?: string; playerRevealCount?: number },
  ) => {
    if (!supabase) return

    const existing = stateRef.current.answers.find(
      (a) => a.sessionId === sessionId && a.questionId === questionId && a.playerId === playerId,
    )
    if (existing) return

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const newAnswer: Answer = {
      id,
      sessionId,
      questionId,
      playerId,
      selectedOptionId: payload.selectedOptionId,
      textAnswer: payload.textAnswer?.trim(),
      playerRevealCount: payload.playerRevealCount,
      submittedAt: now,
      awardedPoints: 0,
      scoredManually: false,
    }

    setState((c) => ({ ...c, answers: [...c.answers, newAnswer] }))

    supabase.from('answers').insert({
      id,
      session_id: sessionId,
      question_id: questionId,
      player_id: playerId,
      selected_option_id: payload.selectedOptionId ?? null,
      text_answer: payload.textAnswer?.trim() ?? null,
      player_reveal_count: payload.playerRevealCount ?? null,
      submitted_at: now,
      awarded_points: 0,
      scored_manually: false,
    }).then(({ error }) => { if (error) console.error('submitAnswer:', error) })
  }, [])

  const scoreTextAnswer = useCallback((answerId: string, awardedPoints: number, isCorrect?: boolean) => {
    if (!supabase) return
    setState((c) => ({
      ...c,
      answers: c.answers.map((a) =>
        a.id === answerId ? { ...a, awardedPoints, isCorrect, scoredManually: true } : a,
      ),
    }))
    supabase.from('answers').update({ awarded_points: awardedPoints, is_correct: isCorrect ?? null, scored_manually: true })
      .eq('id', answerId)
      .then(({ error }) => { if (error) console.error('scoreTextAnswer:', error) })
  }, [])

  const resetDemo = useCallback(() => {
    // No demo in Supabase mode — just reload state
    if (userId) loadAll(userId).then(setState)
  }, [userId])

  // ---------------------------------------------------------------------------
  // Accessors (read from local state — same as mock store)
  // ---------------------------------------------------------------------------

  const getGame = useCallback(
    (gameId: string) => state.games.find((g) => g.id === gameId),
    [state.games],
  )

  const getSession = useCallback(
    (sessionId: string) => state.sessions.find((s) => s.id === sessionId),
    [state.sessions],
  )

  const getPlayersForSession = useCallback(
    (sessionId: string) =>
      state.players
        .filter((p) => p.sessionId === sessionId)
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    [state.players],
  )

  const getAnswersForSessionQuestion = useCallback(
    (sessionId: string, questionId: string) =>
      state.answers.filter((a) => a.sessionId === sessionId && a.questionId === questionId),
    [state.answers],
  )

  const getLeaderboard = useCallback(
    (sessionId: string): LeaderboardEntry[] => {
      const players = state.players.filter((p) => p.sessionId === sessionId && !p.isDisqualified)
      const scores = players.map((p) => ({
        playerId: p.id,
        displayName: p.displayName,
        totalPoints: state.answers
          .filter((a) => a.playerId === p.id)
          .reduce((sum, a) => sum + a.awardedPoints, 0),
      }))
      return scores
        .sort((a, b) => b.totalPoints - a.totalPoints || a.displayName.localeCompare(b.displayName))
        .map((e, idx) => ({ ...e, rank: idx + 1 }))
    },
    [state.answers, state.players],
  )

  const value = useMemo<GameStoreValue>(
    () => ({
      state,
      createGame,
      updateGameMeta,
      saveQuestion,
      duplicateQuestion,
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
      createGame, updateGameMeta, saveQuestion, duplicateQuestion, deleteQuestion, reorderQuestion, moveQuestionToEnd,
      createSession, startSession, pauseSession, resumeSession, revealMoreImage,
      endCurrentQuestion, goToNextQuestion, endSession, joinSession, removePlayer,
      submitAnswer, scoreTextAnswer, resetDemo,
      getGame, getSession, getPlayersForSession, getAnswersForSessionQuestion, getLeaderboard,
    ],
  )

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}
