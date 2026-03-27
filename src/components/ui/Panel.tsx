import type { ReactNode } from 'react'

// ─── Panel ───────────────────────────────────────────────────────────────────
// Token-aware surface container.
// Pairs with the `.panel` CSS class in index.css but can work standalone.

interface PanelProps {
  children: ReactNode
  className?: string
  /** Use CSS backdrop-blur (dark mode only, auto-disabled in light) */
  blur?: boolean
}

export function Panel({ children, className = '', blur = true }: PanelProps) {
  return (
    <div
      className={`panel ${blur ? '' : 'backdrop-blur-none'} ${className}`}
    >
      {children}
    </div>
  )
}
