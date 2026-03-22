import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'orange' | 'green' | 'red' | 'blue' | 'yellow' | 'purple'
type BadgeSize    = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/70 border-white/10',
  orange:  'bg-orange-300/12 text-orange-200 border-orange-300/20',
  green:   'bg-emerald-300/12 text-emerald-200 border-emerald-300/20',
  red:     'bg-rose-400/12 text-rose-300 border-rose-400/20',
  blue:    'bg-sky-300/12 text-sky-200 border-sky-300/20',
  yellow:  'bg-amber-300/12 text-amber-200 border-amber-300/20',
  purple:  'bg-violet-400/12 text-violet-300 border-violet-400/20',
}

const dotClass: Record<BadgeVariant, string> = {
  default: 'bg-white/50',
  orange:  'bg-orange-300',
  green:   'bg-emerald-300',
  red:     'bg-rose-400',
  blue:    'bg-sky-300',
  yellow:  'bg-amber-300',
  purple:  'bg-violet-400',
}

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] tracking-[0.15em]',
  md: 'px-3 py-1 text-xs tracking-[0.18em]',
}

export function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase ${variantClass[variant]} ${sizeClass[size]} ${className}`}>
      {dot && <span className={`size-1.5 rounded-full ${dotClass[variant]}`} />}
      {children}
    </span>
  )
}

// ─── Preset badges used across the app ───────────────────────────────────────

export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return (
    <Badge variant={status === 'published' ? 'green' : 'default'} dot>
      {status}
    </Badge>
  )
}

export function SessionStateBadge({ state }: { state: 'lobby' | 'live' | 'paused' | 'completed' }) {
  const map = {
    lobby:     { variant: 'blue'    as const, label: 'Lobby'     },
    live:      { variant: 'green'   as const, label: 'Live'      },
    paused:    { variant: 'yellow'  as const, label: 'Paused'    },
    completed: { variant: 'default' as const, label: 'Ended'     },
  }
  const { variant, label } = map[state]
  return <Badge variant={variant} dot>{label}</Badge>
}
