// ─── Design System Style Constants ──────────────────────────────────────────
// Bridges CSS custom properties (tokens.css) and Tailwind class usage in JSX.
// Import these instead of hardcoding palette colors in components.

// ── Status containers (bg + border + text) ──────────────────────────────────

export const STATUS_CLASSES = {
  error:   'border-[var(--danger-outline)]  bg-[var(--danger-container)]  text-[var(--danger-foreground)]',
  success: 'border-[var(--success-outline)] bg-[var(--success-container)] text-[var(--success-foreground)]',
  warning: 'border-[var(--warning-outline)] bg-[var(--warning-container)] text-[var(--warning-foreground)]',
  info:    'border-[var(--info-outline)]    bg-[var(--info-container)]    text-[var(--info-foreground)]',
} as const

// ── Accent ──────────────────────────────────────────────────────────────────

export const ACCENT_CLASSES = {
  /** Solid accent fill (buttons, icons) */
  bg:           'bg-[var(--accent)]',
  bgHover:      'hover:bg-[var(--accent-hover)]',
  /** Text in accent color */
  text:         'text-[var(--accent-text)]',
  textHover:    'hover:text-[var(--accent-text-hover)]',
  /** Text on top of accent fill */
  textOnAccent: 'text-[var(--text-on-accent)]',
  /** Low-emphasis accent container (badges, highlights) */
  container:    'bg-[var(--accent-container)] border-[var(--accent-container-border)]',
  /** Muted accent background */
  muted:        'bg-[var(--accent-muted)]',
} as const

// ── Surfaces ────────────────────────────────────────────────────────────────

export const SURFACE_CLASSES = {
  panel:     'bg-[var(--surface)]          border-[var(--outline-default)]',
  raised:    'bg-[var(--surface-raised)]   border-[var(--outline-default)]',
  container: 'bg-[var(--surface-container)]',
  scrim:     'bg-[var(--surface-scrim)]',
} as const

// ── Text hierarchy ──────────────────────────────────────────────────────────

export const TEXT_CLASSES = {
  primary:     'text-[var(--text-primary)]',
  secondary:   'text-[var(--text-secondary)]',
  tertiary:    'text-[var(--text-tertiary)]',
  quaternary:  'text-[var(--text-quaternary)]',
  disabled:    'text-[var(--text-disabled)]',
  placeholder: 'text-[var(--text-placeholder)]',
  onAccent:    'text-[var(--text-on-accent)]',
} as const

// ── Outline / borders ───────────────────────────────────────────────────────

export const OUTLINE_CLASSES = {
  subtle:  'border-[var(--outline-subtle)]',
  default: 'border-[var(--outline-default)]',
  strong:  'border-[var(--outline-strong)]',
  input:   'border-[var(--outline-input)]',
  focus:   'border-[var(--outline-focus)]',
  error:   'border-[var(--outline-error)]',
} as const

// ── GameEditor question colors (intentionally varied per-question) ──────────

export const QUESTION_COLORS = [
  'border-[var(--accent-container-border)] bg-[var(--accent-container)]',
  'border-[var(--info-outline)] bg-[var(--info-container)]',
  'border-[var(--success-outline)] bg-[var(--success-container)]',
  'border-[var(--warning-outline)] bg-[var(--warning-container)]',
  'border-[var(--danger-outline)] bg-[var(--danger-container)]',
  'border-[var(--outline-strong)] bg-[var(--surface-container-high)]',
] as const
