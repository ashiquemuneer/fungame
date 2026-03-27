import type { SlideLayout } from '../types/game'

export function resolveSlideLayout(
  preferredLayout: SlideLayout | undefined,
  optionCount: number,
  hasQuestionImage: boolean,
): 'bottom' | 'right' {
  if (preferredLayout === 'right') {
    return 'right'
  }

  if (preferredLayout === 'bottom') {
    return 'bottom'
  }

  if (hasQuestionImage && optionCount > 0) {
    return 'right'
  }

  return 'bottom'
}

export function getVerticalOptionGridStyle(optionCount: number) {
  const rowCount = Math.max(1, Math.min(optionCount, 5))

  return {
    gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
  }
}
