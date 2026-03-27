import type { OptionDisplayMode, QuestionOption } from '../types/game'
import { cn } from '../lib/utils'
import { ImageIcon } from 'lucide-react'

interface QuestionOptionCardProps {
  option: QuestionOption
  index: number
  displayMode?: OptionDisplayMode
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
  displayMode = 'text',
  interactive = false,
  selected = false,
  asLabel = false,
  compact = false,
  fillHeight = false,
  revealState = 'neutral',
  onSelect,
}: QuestionOptionCardProps) {
  const hasImage = Boolean(option.imageUrl) && displayMode !== 'text'
  const imageOnly = displayMode === 'image'
  const Wrapper = asLabel ? 'label' : 'div'
  const letter = String.fromCharCode(65 + index)

  const handleClick = interactive && onSelect ? () => onSelect(option.id) : undefined

  if (imageOnly) {
    // Image-only card: fills the grid cell, image covers, letter badge overlay
    return (
      <Wrapper
        className={cn(
          'slide-option relative overflow-hidden',
          fillHeight ? 'h-full' : 'aspect-square',
          interactive ? 'slide-option-interactive cursor-pointer' : '',
          revealState === 'correct'   ? 'border-ok-line  bg-ok-tint  text-hi' : '',
          revealState === 'incorrect' ? 'border-err-line bg-err-tint text-hi' : '',
          revealState === 'selected'  ? 'border-note-line bg-note-tint text-hi' : '',
          selected ? 'ring-2 ring-note-line border-note-line bg-note-tint text-hi shadow-[0_0_0_1px_var(--info-outline)]' : '',
          !(revealState === 'correct' || revealState === 'incorrect' || revealState === 'selected' || selected) ? 'border-line' : '',
        )}
        onClick={handleClick}
      >
        {interactive ? (
          <input checked={selected} className="sr-only" name="answer" type="radio" value={option.id} onChange={() => onSelect?.(option.id)} />
        ) : null}
        {option.imageUrl ? (
          <img src={option.imageUrl} alt={option.label || `Option ${letter}`} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full min-h-[60px] flex-col items-center justify-center gap-2 bg-fill p-3 text-dim">
            <ImageIcon className="size-5 opacity-40" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Letter badge */}
        <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
          {letter}
        </span>
        {/* Correct tick */}
        {revealState === 'correct' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ok-tint/40">
            <div className="flex size-8 items-center justify-center rounded-full bg-ok-fg text-white">✓</div>
          </div>
        )}
      </Wrapper>
    )
  }

  // Text or Text+Image mode — never stretch image for text+image, always keep 1:1
  const useDynamicMediaHeight = hasImage && fillHeight && !compact && displayMode === 'image'

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
        selected ? 'ring-2 ring-note-line border-note-line bg-note-tint text-hi shadow-[0_0_0_1px_var(--info-outline)]' : '',
        revealState === 'correct'   ? 'border-ok-line  bg-ok-tint  text-hi' : '',
        revealState === 'incorrect' ? 'border-err-line bg-err-tint text-hi' : '',
        revealState === 'selected'  ? 'border-note-line bg-note-tint text-hi' : '',
      )}
      onClick={handleClick}
    >
      {interactive ? (
        <input checked={selected} className="sr-only" name="answer" type="radio" value={option.id} onChange={() => onSelect?.(option.id)} />
      ) : null}

      <div className={cn('flex items-center gap-3', hasImage && !compact ? 'order-2' : '')}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rim bg-input-bg text-sm font-semibold text-accent-text">
          {letter}
        </span>
        {displayMode !== 'image' && (
          <span className={cn('leading-7', hasImage ? 'text-base' : '')}>{option.label}</span>
        )}
      </div>

      {hasImage ? (
        <div className={cn('slide-option-media bg-raised', compact ? 'shrink-0' : '', useDynamicMediaHeight ? 'min-h-0 flex-1' : '')}>
          <img
            alt={option.label || `Option ${index + 1}`}
            className={cn(
              'w-full object-contain',
              compact ? 'h-20 sm:h-24' : '',
              useDynamicMediaHeight ? 'h-full min-h-0 object-contain' : 'aspect-square object-contain',
            )}
            src={option.imageUrl}
          />
        </div>
      ) : null}
    </Wrapper>
  )
}
