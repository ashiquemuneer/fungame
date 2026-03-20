import type { QuestionOption } from '../types/game'
import { cn } from '../lib/utils'

interface QuestionOptionCardProps {
  option: QuestionOption
  index: number
  interactive?: boolean
  selected?: boolean
  asLabel?: boolean
  compact?: boolean
  fillHeight?: boolean
  revealState?: 'correct' | 'incorrect' | 'selected' | 'neutral'
  onSelect?: (optionId: string) => void
}

export function QuestionOptionCard({
  option,
  index,
  interactive = false,
  selected = false,
  asLabel = false,
  compact = false,
  fillHeight = false,
  revealState = 'neutral',
  onSelect,
}: QuestionOptionCardProps) {
  const hasImage = Boolean(option.imageUrl)
  const Wrapper = asLabel ? 'label' : 'div'
  const useDynamicMediaHeight = hasImage && fillHeight && !compact

  return (
    <Wrapper
      className={cn(
        'slide-option flex gap-3',
        fillHeight ? 'h-full' : '',
        hasImage
          ? compact
            ? 'items-center p-3'
            : 'flex-col p-3.5 sm:p-4'
          : 'items-center px-4 py-4 text-base sm:text-lg',
        interactive ? 'slide-option-interactive' : '',
        selected ? 'ring-2 ring-sky-300/70 border-sky-300/50 bg-sky-300/16 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.2)]' : '',
        revealState === 'correct' ? 'border-emerald-300/45 bg-emerald-300/14 text-white' : '',
        revealState === 'incorrect' ? 'border-rose-300/40 bg-rose-300/12 text-white/95' : '',
        revealState === 'selected' ? 'border-sky-300/35 bg-sky-300/10 text-white' : '',
      )}
      onClick={
        interactive && onSelect
          ? () => {
              onSelect(option.id)
            }
          : undefined
      }
    >
      {interactive ? (
        <input
          checked={selected}
          className="sr-only"
          name="answer"
          type="radio"
          value={option.id}
          onChange={() => onSelect?.(option.id)}
        />
      ) : null}

      <div className={cn('flex items-center gap-3', hasImage && !compact ? 'order-2' : '')}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-sm font-semibold text-orange-100">
          {String.fromCharCode(65 + index)}
        </span>
        <span className={cn('leading-7', hasImage ? 'text-base' : '')}>
          {option.label}
        </span>
      </div>

      {hasImage ? (
        <div
          className={cn(
            'slide-option-media bg-white/95',
            compact ? 'shrink-0' : '',
            useDynamicMediaHeight ? 'min-h-0 flex-1' : '',
          )}
        >
          <img
            alt={option.label || `Option ${index + 1}`}
            className={cn(
              'w-full object-contain p-2',
              compact ? 'h-20 sm:h-24' : '',
              useDynamicMediaHeight ? 'h-full min-h-0' : 'h-32 sm:h-40 xl:h-44',
            )}
            src={option.imageUrl}
          />
        </div>
      ) : null}
    </Wrapper>
  )
}
