import type { ImageRevealConfig } from '../types/game'

export function getMaxImageRevealLevel(config: ImageRevealConfig | undefined) {
  const zoom = config?.zoom ?? 2.8
  const revealStep = config?.revealStep ?? 0.45

  return Math.max(0, Math.ceil((zoom - 1) / revealStep))
}

export function getImageRevealScale(
  config: ImageRevealConfig | undefined,
  revealLevel: number,
  showFull: boolean,
) {
  if (showFull) {
    return 1
  }

  const zoom = config?.zoom ?? 2.8
  const revealStep = config?.revealStep ?? 0.45
  return Math.max(1, zoom - revealLevel * revealStep)
}
