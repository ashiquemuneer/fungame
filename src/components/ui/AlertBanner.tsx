import type { ReactNode } from 'react'

// ─── AlertBanner ─────────────────────────────────────────────────────────────
// Token-aware status banner: error · success · warning · info
// Replaces ~15 inline copy-pasted banners across the app.

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertBannerProps {
  variant: AlertVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  error: {
    bg:     'var(--danger-container)',
    border: 'var(--danger-outline)',
    text:   'var(--danger-foreground)',
    icon:   '✕',
  },
  success: {
    bg:     'var(--success-container)',
    border: 'var(--success-outline)',
    text:   'var(--success-foreground)',
    icon:   '✓',
  },
  warning: {
    bg:     'var(--warning-container)',
    border: 'var(--warning-outline)',
    text:   'var(--warning-foreground)',
    icon:   '⚠',
  },
  info: {
    bg:     'var(--info-container)',
    border: 'var(--info-outline)',
    text:   'var(--info-foreground)',
    icon:   'ℹ',
  },
}

export function AlertBanner({ variant, children, className = '' }: AlertBannerProps) {
  const s = variantStyles[variant]
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${className}`}
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.text,
      }}
    >
      {children}
    </div>
  )
}
