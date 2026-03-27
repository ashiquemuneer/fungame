import type { ReactNode } from 'react'
import type { Question } from '../types/game'
import { cn } from '../lib/utils'

interface QuestionSlideProps {
  question: Question
  questionNumber: number
  questionCount: number
  metaLabel: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
  hideDefaultQuestionImage?: boolean
  /** When true, fills its container height instead of using viewport-based min-h. */
  fillContainer?: boolean
}

export function QuestionSlide({
  question,
  questionNumber,
  questionCount,
  metaLabel,
  children,
  footer,
  className,
  hideDefaultQuestionImage = false,
  fillContainer = false,
}: QuestionSlideProps) {
  return (
    <div
      className={cn(
        'slide-surface relative overflow-hidden rounded-[2rem] border border-edge p-3 sm:p-4 xl:p-5',
        fillContainer
          ? 'h-full min-h-0'
          : 'min-h-[calc(100dvh-11rem)] sm:min-h-[42rem] xl:min-h-[46rem]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,var(--slide-glow-warm),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full bg-note-tint blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-accent-dim blur-3xl" />

      <div className="relative flex h-full flex-col">
        {question.type !== 'section' ? (
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span
              className="slide-chip bg-fill-hi text-lo"
              title={`Question ${questionNumber} of ${questionCount}`}
            >
              {`Q${questionNumber}`}
            </span>
            <span className="slide-chip bg-raised text-on-accent">{metaLabel}</span>
          </div>
        ) : null}

        {question.type === 'section' ? (() => {
          const hasImage = Boolean(question.imageUrl)
          const layout = hasImage ? (question.sectionLayout ?? 'cover') : undefined
          const fp = question.imageFocalPoint ?? { x: 50, y: 50 }
          const fpStyle = { objectPosition: `${fp.x}% ${fp.y}%` }

          if (layout === 'cover') {
            return (
              <div className="relative flex flex-1 overflow-hidden">
                <img src={question.imageUrl} className="absolute inset-0 h-full w-full object-cover" style={fpStyle} alt="" />
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.40)' }} />
                <div className="relative z-10 flex w-full flex-col items-center justify-center px-12 text-center">
                  <h2 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-white drop-shadow-lg sm:text-5xl xl:text-6xl">
                    {question.prompt}
                  </h2>
                  {question.acceptedAnswer ? (
                    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/80 drop-shadow sm:text-xl xl:text-2xl">
                      {question.acceptedAnswer}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          }

          if (layout === 'image-left') {
            return (
              <div className="flex flex-1 overflow-hidden rounded-[1.5rem]">
                <div className="w-1/2 shrink-0 overflow-hidden">
                  <img src={question.imageUrl} className="h-full w-full object-cover" style={fpStyle} alt="" />
                </div>
                <div className="flex w-1/2 flex-col items-start justify-center px-10">
                  <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-hi sm:text-4xl xl:text-5xl">
                    {question.prompt}
                  </h2>
                  {question.acceptedAnswer ? (
                    <p className="mt-3 text-base text-lo">
                      {question.acceptedAnswer}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          }

          if (layout === 'image-right') {
            return (
              <div className="flex flex-1 overflow-hidden rounded-[1.5rem]">
                <div className="flex w-1/2 flex-col items-start justify-center px-10">
                  <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-hi sm:text-4xl xl:text-5xl">
                    {question.prompt}
                  </h2>
                  {question.acceptedAnswer ? (
                    <p className="mt-3 text-base text-lo">
                      {question.acceptedAnswer}
                    </p>
                  ) : null}
                </div>
                <div className="w-1/2 shrink-0 overflow-hidden">
                  <img src={question.imageUrl} className="h-full w-full object-cover" style={fpStyle} alt="" />
                </div>
              </div>
            )
          }

          // Default: no image (centered layout)
          return (
            <div className="relative flex flex-1 items-center justify-center px-4 text-center">
              <div className="max-w-4xl">
                <h2 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight text-hi sm:text-5xl xl:text-6xl">
                  {question.prompt}
                </h2>
                {question.acceptedAnswer ? (
                  <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-md sm:text-xl xl:text-2xl">
                    {question.acceptedAnswer}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })() : (
          <div className="relative mt-4">
            <h2 className="max-w-4xl font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-hi sm:text-4xl xl:text-5xl">
              {question.prompt}
            </h2>
          </div>
        )}

        {question.imageUrl && !hideDefaultQuestionImage && question.type !== 'section' ? (
          <div className="relative mt-3 overflow-hidden rounded-[1.5rem] border border-edge bg-raised">
            <img
              alt="Question visual"
              className="h-40 w-full object-contain p-3 sm:h-52 xl:h-64"
              src={question.imageUrl}
            />
          </div>
        ) : null}

        {question.type !== 'section' ? <div className="relative mt-3 flex-1">{children}</div> : null}

        {footer ? <div className="relative mt-3">{footer}</div> : null}
      </div>
    </div>
  )
}
