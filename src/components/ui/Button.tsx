import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

// primary / secondary / ghost use the CSS classes in index.css which
// already reference token vars.  Danger defines its own token-based style.
const variantClass: Record<Variant, string> = {
  primary:   'button-primary',
  secondary: 'button-secondary',
  ghost:     'button-ghost',
  danger:    'inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
}

// Danger uses token-backed inline styles (not raw Tailwind palette)
const dangerStyle = {
  backgroundColor: 'var(--danger-container)',
  borderColor:     'var(--danger-outline)',
  color:           'var(--danger-foreground)',
} as const

const sizeClass: Record<Size, string> = {
  sm: 'text-xs gap-1.5',
  md: '',
  lg: 'text-base',
}

// Inline styles win over @apply padding in component classes (Tailwind v4 layer order)
const sizeStyle: Record<Size, React.CSSProperties> = {
  sm: { paddingInline: '0.75rem', paddingBlock: '0.375rem' },
  md: {},
  lg: { paddingInline: '1.75rem', paddingBlock: '1rem' },
}

const Spinner = () => (
  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, children, className = '', disabled, style, ...rest }, ref) => {
    const base = variantClass[variant]
    const sz   = sizeClass[size]
    const mergedStyle: CSSProperties = {
      ...(variant === 'danger' ? dangerStyle : {}),
      ...sizeStyle[size],
      ...style,
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sz} ${className}`.trim()}
        style={mergedStyle}
        {...rest}
      >
        {loading ? <Spinner /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  },
)
Button.displayName = 'Button'
