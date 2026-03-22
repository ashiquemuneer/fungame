import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary:   'button-primary',
  secondary: 'button-secondary',
  ghost:     'button-ghost',
  danger:    'inline-flex items-center justify-center gap-2 rounded-full bg-rose-500/20 border border-rose-400/30 px-5 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/30 hover:border-rose-400/50 disabled:cursor-not-allowed disabled:opacity-50',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: '',          // default — classes come from variant
  lg: 'px-7 py-4 text-base',
}

const Spinner = () => (
  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, children, className = '', disabled, ...rest }, ref) => {
    const base = variantClass[variant]
    const sz   = sizeClass[size]
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sz} ${className}`.trim()}
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
