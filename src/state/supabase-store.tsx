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
    tags: row.tags ?? [],
    isPublic: row.is_public ?? false,
    coverImage: row.cover_image ?? undefined,
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
    summary: row.summary ?? undefined,
  }
}

function mapSessionResult(row: any): import('../types/game').SessionResult {
  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id ?? undefined,
    displayName: row.display_name,
    totalPoints: row.total_points,
    correctCount: row.correct_count,
    questionCount: row.question_count,
    rank: row.rank,
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
// Demo game seeder (runs once when a new host has no games)
// ---------------------------------------------------------------------------

async function seedDemoGame(userId: string): Promise<void> {
  if (!supabase) return

  // Create the game
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .insert({
      host_user_id: userId,
      title: '🚀 Demo: All Question Types',
      description:
        'Try every slide type — section, multiple choice, true/false, short text, emoji, and image reveal.',
      status: 'published',
    })
    .select('id')
    .single()

  if (gameErr || !game) return

  const gameId = game.id

  // Insert all 6 questions
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .insert([
      {
        game_id: gameId, position: 0, type: 'section',
        prompt: '🎉 Welcome to the Demo Quiz!',
        accepted_answer: 'This is a section slide — use it to introduce a round or show a title.',
        slide_layout: 'auto', time_limit_seconds: 0, points: 0,
        is_demo: false, is_tie_breaker: false,
      },
      {
        game_id: gameId, position: 1, type: 'mcq',
        prompt: 'Which planet is known as the Red Planet?',
        slide_layout: 'auto', time_limit_seconds: 20, points: 10,
        is_demo: false, is_tie_breaker: false,
      },
      {
        game_id: gameId, position: 2, type: 'true_false',
        prompt: 'True or False: Honey never expires — scientists found edible honey in 3,000-year-old Egyptian tombs.',
        slide_layout: 'auto', time_limit_seconds: 15, points: 5,
        is_demo: false, is_tie_breaker: false,
      },
      {
        game_id: gameId, position: 3, type: 'short_text',
        prompt: 'Name any programming language invented before 1980.',
        accepted_answer: 'COBOL, FORTRAN, C, Pascal, BASIC, Lisp, Smalltalk, Ada — any valid answer scores points.',
        slide_layout: 'auto', time_limit_seconds: 30, points: 15,
        is_demo: false, is_tie_breaker: false,
      },
      {
        game_id: gameId, position: 4, type: 'emoji',
        prompt: 'What famous movie do these emojis represent?',
        emoji_prompt: '🦁👑🌍',
        accepted_answer: 'The Lion King',
        slide_layout: 'auto', time_limit_seconds: 20, points: 10,
        is_demo: false, is_tie_breaker: false,
      },
      {
        game_id: gameId, position: 5, type: 'image_guess',
        prompt: 'What famous landmark is this? Type your answer.',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/700px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
        image_reveal_config: { focusX: 50, focusY: 40, zoom: 3.5, rotation: 0, revealStep: 0.55 },
        accepted_answer: 'Eiffel Tower',
        slide_layout: 'auto', time_limit_seconds: 30, points: 20,
        is_demo: false, is_tie_breaker: false,
      },
    ])
    .select('id, position')

  if (qErr || !questions) return

  const byPos = new Map(questions.map((q) => [q.position, q.id]))

  // Insert options for MCQ (pos 1) and True/False (pos 2)
  const options: object[] = []
  const mcqId = byPos.get(1)
  const tfId = byPos.get(2)

  if (mcqId) {
    options.push(
      { question_id: mcqId, position: 0, label: 'Mercury', is_correct: false },
      { question_id: mcqId, position: 1, label: 'Mars', is_correct: true },
      { question_id: mcqId, position: 2, label: 'Jupiter', is_correct: false },
      { question_id: mcqId, position: 3, label: 'Venus', is_correct: false },
    )
  }
  if (tfId) {
    options.push(
      { question_id: tfId, position: 0, label: 'True', is_correct: true },
      { question_id: tfId, position: 1, label: 'False', is_correct: false },
    )
  }

  if (options.length > 0) {
    await supabase.from('question_options').insert(options)
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
  if (!supabase) return { games: [], sessions: [], players: [], answers: [], sessionResults: [] }

  // 1. Games I host
  const { data: hostGamesData, error: gamesErr } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('host_user_id', userId)
    .order('created_at', { ascending: false })

  if (gamesErr) console.error('[loadAll] games query failed:', gamesErr)
  console.log('[loadAll] userId:', userId, 'hostGamesData count:', hostGamesData?.length ?? 'null/error')

  // 2. Sessions I host
  const { data: hostSessionData, error: sessionsErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('host_user_id', userId)
    .order('created_at', { ascending: false })

  if (sessionsErr) console.error('[loadAll] sessions query failed:', sessionsErr)

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

  // 1b. Games I collaborate on
  const { data: collabLinks } = await supabase
    .from('game_collaborators')
    .select('game_id')
    .eq('collaborator_user_id', userId)

  const collabGameIds = (collabLinks ?? []).map((r: any) => r.game_id)
  const hostGameIds = new Set(((hostGamesData ?? []) as any[]).map((g) => g.id))
  const newCollabIds = collabGameIds.filter((id: string) => !hostGameIds.has(id))

  let collabGamesData: any[] = []
  if (newCollabIds.length > 0) {
    const { data } = await supabase
      .from('games')
      .select(GAME_SELECT)
      .in('id', newCollabIds)
    collabGamesData = data ?? []
  }

  // 4. Load games for player sessions that I don't already have
  const allOwnedGameIds = new Set([...hostGameIds, ...newCollabIds])
  const missingGameIds = playerSessionData
    .map((s: any) => s.game_id)
    .filter((id: string) => !allOwnedGameIds.has(id))

  let playerGamesData: any[] = []
  if (missingGameIds.length > 0) {
    const { data } = await supabase
      .from('games')
      .select(GAME_SELECT)
      .in('id', missingGameIds)
    playerGamesData = data ?? []
  }

  // 5. Players, answers, and session results for all sessions
  let playerRows: any[] = []
  let answerRows: any[] = []
  let sessionResultRows: any[] = []

  if (allSessionIds.length > 0) {
    const [{ data: pData }, { data: aData }, { data: srData }] = await Promise.all([
      supabase.from('session_players').select('*').in('session_id', allSessionIds),
      supabase.from('answers').select('*').in('session_id', allSessionIds),
      supabase.from('session_results').select('*').in('session_id', allSessionIds),
    ])
    playerRows = pData ?? []
    answerRows = aData ?? []
    sessionResultRows = srData ?? []
  }

  return {
    games: [...(hostGamesData ?? []), ...collabGamesData, ...playerGamesData].map(mapGame),
    sessions: allSessionRows.map(mapSession),
    players: playerRows.map(mapPlayer),
    answers: answerRows.map(mapAnswer),
    sessionResults: sessionResultRows.map(mapSessionResult),
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SupabaseStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>({ games: [], sessions: [], players: [], answers: [], sessionResults: [] })
  const [userId, setUserId] = useState<string | null>(null)
  const stateRef = useRef(state)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hostEmail, setHostEmail] = useState<string | null>(null)
  const [isHostAuthenticated, setIsHostAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Anonymous sign-in on mount (with timeout so corporate firewalls don't hang the app)
  useEffect(() => {
    if (!supabase) return

    async function init() {
      try {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
        const userResult = await Promise.race([
          supabase!.auth.getUser().then((r) => r.data.user),
          timeout,
        ])
        if (userResult?.email) {
          // Email-authenticated host
          setUserId(userResult.id)
          setHostEmail(userResult.email)
          setIsHostAuthenticated(true)
        } else if (userResult?.id) {
          // Anonymous user (player returning to the app)
          setUserId(userResult.id)
        }
        // else: not signed in — host will use login page, player will auth in joinSession
      } catch {
        // network timeout, stay null
      } finally {
        setAuthLoading(false)
      }
    }

    init()
  }, [])

  // Load state once signed in; seed demo game on first host login only
  useEffect(() => {
    if (!userId) return
    loadAll(userId)
      .then(async (loaded) => {
        // Only seed for email-authenticated hosts, never for anonymous players
        if (loaded.games.length === 0 && isHostAuthenticated) {
          await seedDemoGame(userId)
          return loadAll(userId)
        }
        return loaded
      })
      .then(setState)
      .catch((err) => console.error('loadAll failed:', err))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const newGame: Game = {
      id, title, description, status: 'draft',
      tags: [], isPublic: false,
      createdAt: now, updatedAt: now, questions: [],
    }

    setState((c) => ({ ...c, games: [newGame, ...c.games] }))

    supabase.from('games')
      .insert({ id, host_user_id: userId, title, description, status: 'draft', tags: [], is_public: false, created_at: now, updated_at: now })
      .then(({ error }) => { if (error) console.error('createGame:', error) })

    return id
  }, [userId])

  const updateGameMeta = useCallback((
    gameId: string,
    patch: Pick<Game, 'title' | 'description' | 'status'> & Partial<Pick<Game, 'tags' | 'isPublic' | 'coverImage'>>,
  ) => {
    if (!supabase) return
    const now = new Date().toISOString()
    setState((c) => ({
      ...c,
      games: c.games.map((g) => g.id === gameId ? { ...g, ...patch, updatedAt: now } : g),
    }))
    supabase.from('games')
      .update({
        title: patch.title,
        description: patch.description,
        status: patch.status,
        ...(patch.tags !== undefined && { tags: patch.tags }),
        ...(patch.isPublic !== undefined && { is_public: patch.isPublic }),
        ...(patch.coverImage !== undefined && { cover_image: patch.coverImage }),
        updated_at: now,
      })
      .eq('id', gameId)
      .then(({ error }) => { if (error) console.error('updateGameMeta:', error) })
  }, [])

  const deleteGame = useCallback((gameId: string) => {
    if (!supabase) return
    // Optimistic: remove immediately from local state
    setState((c) => ({
      ...c,
      games: c.games.filter((g) => g.id !== gameId),
      sessions: c.sessions.filter((s) => s.gameId !== gameId),
    }))
    // questions/options cascade-delete via DB FK ON DELETE CASCADE
    supabase.from('games').delete().eq('id', gameId)
      .then(({ error }) => { if (error) console.error('deleteGame:', error) })
  }, [])

  const duplicateGame = useCallback((gameId: string): string | null => {
    if (!supabase) return null
    let newId: string | null = null
    setState((c) => {
      const source = c.games.find((g) => g.id === gameId)
      if (!source) return c
      const now = new Date().toISOString()
      newId = crypto.randomUUID()
      const clone = {
        ...source,
        id: newId,
        title: `${source.title} (copy)`,
        status: 'draft' as const,
        createdAt: now,
        updatedAt: now,
        questions: source.questions.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
          options: q.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
        })),
      }
      return { ...c, games: [clone, ...c.games] }
    })
    // Persist clone to DB asynchronously
    const cloned = newId
    if (cloned) {
      setTimeout(async () => {
        const current = stateRef.current.games.find((g) => g.id === cloned)
        if (!current || !supabase) return
        const uid = (await supabase.auth.getUser()).data.user?.id
        if (!uid) return
        await supabase.from('games').insert({
          id: current.id,
          host_user_id: uid,
          title: current.title,
          description: current.description ?? '',
          status: current.status,
          created_at: current.createdAt,
          updated_at: current.updatedAt,
        })
        for (const [pos, q] of current.questions.entries()) {
          await supabase.from('questions').insert({
            id: q.id, game_id: current.id, type: q.type, prompt: q.prompt,
            emoji_prompt: q.emojiPrompt ?? null, image_url: q.imageUrl ?? null,
            accepted_answer: q.acceptedAnswer ?? null, slide_layout: q.slideLayout ?? 'auto',
            time_limit_seconds: q.timeLimitSeconds, points: q.points,
            is_demo: q.isDemo, is_tie_breaker: q.isTieBreaker, position: pos,
            image_reveal_config: q.imageRevealConfig,
          })
          for (const o of q.options) {
            await supabase.from('question_options').insert({
              id: o.id, question_id: q.id, label: o.label,
              image_url: o.imageUrl ?? null, is_correct: o.isCorrect,
            })
          }
        }
      }, 0)
    }
    return newId
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

  const createSession = useCallback(async (gameId: string): Promise<string> => {
    if (!supabase || !userId) return ''
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const roomCode = generateRoomCode()

    const { error } = await supabase.from('sessions').insert({
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
    })

    if (error) {
      console.error('createSession failed:', error)
      return ''
    }

    const newSession: Session = {
      id, gameId, roomCode, state: 'lobby',
      currentQuestionIndex: null, imageRevealLevel: 0,
      revealAnswers: false, leaderboardVisible: false, allowJoin: true, createdAt: now,
    }
    setState((c) => ({ ...c, sessions: [newSession, ...c.sessions] }))
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
    // Optimistically update local state immediately
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
    // Call RPC to write session_results + summary snapshot
    if (supabase) {
      supabase.rpc('finalize_session', { p_session_id: sessionId })
        .then(({ error }) => {
          if (error) console.error('finalize_session rpc:', error)
          else if (userId) loadAll(userId).then(setState)
        })
    }
  }, [patchSession, userId])

  const joinSession = useCallback(async (roomCode: string, displayName: string) => {
    if (!supabase) return null

    try {
      // getUser() validates the token with the server — avoids race with the
      // background signInAnonymously() that runs on mount.
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError || !signInData.user) {
          console.error('joinSession: auth failed', signInError)
          return null
        }
        user = signInData.user
      }

      const { data, error } = await supabase.rpc('join_session', {
        p_room_code: roomCode.trim().toUpperCase(),
        p_display_name: displayName.trim(),
      })

      if (error) {
        console.error('joinSession: RPC error', error.message, error.details, error.hint)
        return null
      }
      if (!data?.[0]) {
        console.error('joinSession: RPC returned no rows')
        return null
      }

      const { session_id: sessionId, player_id: playerId } = data[0]

      // Load state BEFORE setting userId — prevents the userId useEffect from
      // running a concurrent loadAll that races and overwrites this result.
      const newState = await loadAll(user.id)
      setState(newState)
      setUserId(user.id) // set after setState so realtime subscriptions start cleanly

      return { sessionId, playerId }
    } catch (err) {
      console.error('joinSession: unexpected error', err)
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

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return 'Supabase not configured'
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return error.message
    if (data.user) {
      setUserId(data.user.id)
      setHostEmail(data.user.email ?? null)
      setIsHostAuthenticated(true)
    }
    return null
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return 'Supabase not configured'
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return error.message
    if (data.user) {
      setUserId(data.user.id)
      setHostEmail(data.user.email ?? null)
      setIsHostAuthenticated(true)
      // State is loaded by the userId+isHostAuthenticated useEffect — no duplicate loadAll needed
    }
    return null
  }, [])

  const signOutCb = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUserId(null)
    setHostEmail(null)
    setIsHostAuthenticated(false)
    setState({ games: [], sessions: [], players: [], answers: [], sessionResults: [] })
  }, [])

  const inviteCollaborator = useCallback(async (gameId: string, email: string): Promise<string | null> => {
    if (!supabase) return 'Supabase not configured'
    const { error } = await supabase.rpc('invite_collaborator', {
      p_game_id: gameId,
      p_email: email.trim(),
    })
    if (error) return error.message
    return null
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

  const getSessionResults = useCallback(
    (sessionId: string) =>
      (state.sessionResults ?? []).filter((r) => r.sessionId === sessionId),
    [state.sessionResults],
  )

  const value = useMemo<GameStoreValue>(
    () => ({
      state,
      createGame,
      updateGameMeta,
      deleteGame,
      duplicateGame,
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
      getSessionResults,
      signUp,
      signIn,
      signOut: signOutCb,
      inviteCollaborator,
      hostEmail,
      isHostAuthenticated,
      authLoading,
    }),
    [
      state,
      createGame, updateGameMeta, deleteGame, duplicateGame, saveQuestion, duplicateQuestion, deleteQuestion, reorderQuestion, moveQuestionToEnd,
      createSession, startSession, pauseSession, resumeSession, revealMoreImage,
      endCurrentQuestion, goToNextQuestion, endSession, joinSession, removePlayer,
      submitAnswer, scoreTextAnswer, resetDemo,
      getGame, getSession, getPlayersForSession, getAnswersForSessionQuestion, getLeaderboard, getSessionResults,
      signUp, signIn, signOutCb, inviteCollaborator, hostEmail, isHostAuthenticated, authLoading,
    ],
  )

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>
}
