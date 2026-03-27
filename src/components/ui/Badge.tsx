import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'brand' | 'success' | 'danger' | 'info' | 'warning' | 'purple'
type BadgeSize    = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

// Token-backed variant styles — map to CSS custom properties in tokens.css
const variantStyles: Record<BadgeVariant, { bg: string; border: string; text: string; dot: string }> = {
  default: {
    bg:     'var(--surface-container-high)',
    border: 'var(--outline-default)',
    text:   'var(--text-secondary)',
    dot:    'var(--text-tertiary)',
  },
  brand: {
    bg:     'var(--badge-brand-bg)',
    border: 'var(--badge-brand-border)',
    text:   'var(--badge-brand-text)',
    dot:    'var(--accent)',
  },
  success: {
    bg:     'var(--badge-success-bg)',
    border: 'var(--badge-success-border)',
    text:   'var(--badge-success-text)',
    dot:    'var(--success)',
  },
  danger: {
    bg:     'var(--badge-danger-bg)',
    border: 'var(--badge-danger-border)',
    text:   'var(--badge-danger-text)',
    dot:    'var(--danger)',
  },
  info: {
    bg:     'var(--badge-info-bg)',
    border: 'var(--badge-info-border)',
    text:   'var(--badge-info-text)',
    dot:    'var(--info)',
  },
  warning: {
    bg:     'var(--badge-warning-bg)',
    border: 'var(--badge-warning-border)',
    text:   'var(--badge-warning-text)',
    dot:    'var(--warning)',
  },
  purple: {
    bg:     'var(--info-container)',
    border: 'var(--info-outline)',
    text:   'var(--info-foreground)',
    dot:    'var(--info-foreground)',
  },
}

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] tracking-[0.12em]',
  md: 'px-3 py-1 text-xs tracking-[0.12em]',
}

export function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }: BadgeProps) {
  const s = variantStyles[variant]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase ${sizeClass[size]} ${className}`}
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.text,
      }}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} />}
      {children}
    </span>
  )
}

// ─── Preset badges used across the app ───────────────────────────────────────

export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return (
    <Badge variant={status === 'published' ? 'success' : 'default'} dot>
      {status}
    </Badge>
  )
}

export function SessionStateBadge({ state }: { state: 'lobby' | 'live' | 'paused' | 'completed' }) {
  const map = {
    lobby:     { variant: 'info'    as const, label: 'Lobby'     },
    live:      { variant: 'success' as const, label: 'Live'      },
    paused:    { variant: 'warning' as const, label: 'Paused'    },
    completed: { variant: 'default' as const, label: 'Ended'     },
  }
  const { variant, label } = map[state]
  return <Badge variant={variant} dot>{label}</Badge>
}
