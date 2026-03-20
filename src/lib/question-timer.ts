import type { Question, Session } from '../types/game'

export function getQuestionRemainingSeconds(
  session: Session,
  question: Question | undefined,
  now = Date.now(),
) {
  if (!question || question.type === 'section' || question.isDemo) {
    return 0
  }

  if (session.revealAnswers) {
    return 0
  }

  if (typeof session.pausedRemainingMs === 'number') {
    return Math.max(0, Math.ceil(session.pausedRemainingMs / 1000))
  }

  if (!session.currentQuestionStartedAt) {
    return question.timeLimitSeconds
  }

  const startedAt = new Date(session.currentQuestionStartedAt).getTime()
  const elapsedMs = Math.max(0, now - startedAt)
  const remainingMs = question.timeLimitSeconds * 1000 - elapsedMs

  return Math.max(0, Math.ceil(remainingMs / 1000))
}
