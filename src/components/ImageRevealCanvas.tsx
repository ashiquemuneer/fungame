import type { ImageRevealConfig } from '../types/game'
import { getImageRevealScale } from '../lib/image-reveal'
import { cn } from '../lib/utils'

interface ImageRevealCanvasProps {
  src?: string
  alt: string
  config?: ImageRevealConfig
  revealLevel?: number
  revealProgress?: number
  showFull?: boolean
  className?: string
  imageClassName?: string
  emptyLabel?: string
}

export function ImageRevealCanvas({
  src,
  alt,
  config,
  revealLevel = 0,
  revealProgress,
  showFull = false,
  className,
  imageClassName,
  emptyLabel = 'Add an image to preview this round.',
}: ImageRevealCanvasProps) {
  if (!src?.trim()) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-[1.6rem] border border-dashed border-[var(--outline-default)] bg-[var(--surface-container)] px-6 py-8 text-center text-sm text-[var(--text-primary)]/55',
          className,
        )}
      >
        {emptyLabel}
      </div>
    )
  }

  const focusX = config?.focusX ?? 50
  const focusY = config?.focusY ?? 50

  let scale: number
  let rotation: number

  if (showFull) {
    scale = 1
    rotation = 0
  } else if (revealProgress !== undefined) {
    const zoom = config?.zoom ?? 2.8
    scale = zoom + revealProgress * (1 - zoom)
    rotation = (config?.rotation ?? 0) * (1 - revealProgress)
  } else {
    scale = getImageRevealScale(config, revealLevel, false)
    rotation = config?.rotation ?? 0
  }

  return (
    <div className={cn('overflow-hidden rounded-[1.6rem] border border-[var(--outline-default)] bg-raised', className)}>
      <img
        alt={alt}
        className={cn(
          'h-full w-full',
          showFull ? 'object-contain p-4' : 'object-cover',
          imageClassName,
        )}
        src={src}
        style={{
          objectPosition: `${focusX}% ${focusY}%`,
          transform: showFull ? undefined : `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  )
}
