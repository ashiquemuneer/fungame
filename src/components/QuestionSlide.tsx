import type { ReactNode } from 'react'
import type { Question } from '../types/game'
import { cn } from '../lib/utils'

interface QuestionSlideProps {
  question: Question
  questionNumber: number
  questionCount: number
  roomCode: string
  title: string
  audienceLabel: string
  metaLabel: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
  hideDefaultQuestionImage?: boolean
}

export function QuestionSlide({
  question,
  questionNumber,
  questionCount,
  roomCode,
  title,
  audienceLabel,
  metaLabel,
  children,
  footer,
  className,
  hideDefaultQuestionImage = false,
}: QuestionSlideProps) {
  return (
    <div
      className={cn(
        'slide-surface relative min-h-[calc(100dvh-11rem)] overflow-hidden rounded-[2rem] border border-white/12 p-4 sm:min-h-[42rem] sm:p-5 xl:min-h-[46rem] xl:p-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.32),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-orange-300/10 blur-3xl" />

      <div className="relative flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="slide-chip bg-white/12 text-white/70">{title}</span>
            <span className="slide-chip bg-orange-300/12 text-orange-100">
              Room {roomCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="slide-chip bg-white/8 text-white/60">
              {audienceLabel}
            </span>
            <span className="slide-chip bg-white text-stone-950">{metaLabel}</span>
          </div>
        </div>

        {question.type === 'section' ? (
          <div className="relative flex flex-1 items-center justify-center px-4 text-center">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">
                {`Section ${questionNumber} of ${questionCount}`}
              </p>
              <h2 className="mt-5 font-['Sora','Avenir_Next',sans-serif] text-4xl font-semibold leading-tight text-white sm:text-5xl xl:text-6xl">
                {question.prompt}
              </h2>
              {question.acceptedAnswer ? (
                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/72 sm:text-xl xl:text-2xl">
                  {question.acceptedAnswer}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="relative mt-5 space-y-3.5">
            <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">
              {`Question ${questionNumber} of ${questionCount}`}
            </p>
            <h2 className="max-w-4xl font-['Sora','Avenir_Next',sans-serif] text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">
              {question.prompt}
            </h2>
          </div>
        )}

        {question.imageUrl && !hideDefaultQuestionImage ? (
          <div className="relative mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/95">
            <img
              alt="Question visual"
              className="h-40 w-full object-contain p-3 sm:h-52 xl:h-64"
              src={question.imageUrl}
            />
          </div>
        ) : null}

        {question.type !== 'section' ? <div className="relative mt-4 flex-1">{children}</div> : null}

        {footer ? <div className="relative mt-4">{footer}</div> : null}
      </div>
    </div>
  )
}
