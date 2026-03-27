export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_text'
  | 'emoji'
  | 'image_guess'
  | 'section'
  | 'rating'
  | 'number_guess'
export type SlideLayout = 'auto' | 'bottom' | 'right'
export type OptionDisplayMode = 'text' | 'image' | 'text+image'
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
  hostNotes?: string
  slideLayout?: SlideLayout
  sectionLayout?: 'cover' | 'image-left' | 'image-right'
  imageFocalPoint?: { x: number; y: number }
  timeLimitSeconds: number
  points: number
  isDemo: boolean
  isTieBreaker: boolean
  isSkipped?: boolean
  shortAnswerType?: 'text' | 'number'
  numberMin?: number
  numberMax?: number
  optionDisplayMode?: OptionDisplayMode
  options: QuestionOption[]
}

export interface Game {
  id: string
  title: string
  description: string
  status: GameStatus
  tags: string[]
  isPublic: boolean
  coverImage?: string
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
  summary?: SessionResultEntry[]
}

export interface SessionResultEntry {
  rank: number
  displayName: string
  totalPoints: number
  correctCount: number
}

export interface SessionResult {
  id: string
  sessionId: string
  playerId?: string
  displayName: string
  totalPoints: number
  correctCount: number
  questionCount: number
  rank: number
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
  sessionResults: SessionResult[]
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
  hostNotes: string
  slideLayout: SlideLayout
  sectionLayout?: 'cover' | 'image-left' | 'image-right'
  imageFocalPoint?: { x: number; y: number }
  timeLimitSeconds: number
  points: number
  isDemo: boolean
  isTieBreaker: boolean
  isSkipped?: boolean
  shortAnswerType?: 'text' | 'number'
  numberMin?: number
  numberMax?: number
  optionDisplayMode: OptionDisplayMode
  options: QuestionOption[]
}
