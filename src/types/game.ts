export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_text'
  | 'emoji'
  | 'image_guess'
  | 'section'
export type SlideLayout = 'auto' | 'bottom' | 'right'
export type GameStatus = 'draft' | 'published'
export type SessionState = 'lobby' | 'live' | 'paused' | 'completed'

export interface ImageRevealConfig {
  focusX: number
  focusY: number
  zoom: number
  rotation: number
  revealStep: number
}

export interface QuestionOption {
  id: string
  label: string
  imageUrl?: string
  isCorrect: boolean
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  emojiPrompt?: string
  imageUrl?: string
  imageRevealConfig?: ImageRevealConfig
  acceptedAnswer?: string
  slideLayout?: SlideLayout
  timeLimitSeconds: number
  points: number
  isDemo: boolean
  isTieBreaker: boolean
  options: QuestionOption[]
}

export interface Game {
  id: string
  title: string
  description: string
  status: GameStatus
  createdAt: string
  updatedAt: string
  questions: Question[]
}

export interface Session {
  id: string
  gameId: string
  roomCode: string
  state: SessionState
  currentQuestionIndex: number | null
  currentQuestionStartedAt?: string
  pausedRemainingMs?: number
  imageRevealLevel?: number
  revealAnswers: boolean
  leaderboardVisible: boolean
  allowJoin: boolean
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export interface SessionPlayer {
  id: string
  sessionId: string
  displayName: string
  joinedAt: string
  isActive: boolean
  isDisqualified: boolean
}

export interface Answer {
  id: string
  sessionId: string
  questionId: string
  playerId: string
  selectedOptionId?: string
  textAnswer?: string
  playerRevealCount?: number
  submittedAt: string
  isCorrect?: boolean
  awardedPoints: number
  scoredManually: boolean
}

export interface AppState {
  games: Game[]
  sessions: Session[]
  players: SessionPlayer[]
  answers: Answer[]
}

export interface LeaderboardEntry {
  playerId: string
  displayName: string
  totalPoints: number
  rank: number
}

export interface QuestionDraft {
  type: QuestionType
  prompt: string
  emojiPrompt: string
  imageUrl: string
  imageRevealConfig: ImageRevealConfig
  acceptedAnswer: string
  slideLayout: SlideLayout
  timeLimitSeconds: number
  points: number
  isDemo: boolean
  isTieBreaker: boolean
  options: QuestionOption[]
}
