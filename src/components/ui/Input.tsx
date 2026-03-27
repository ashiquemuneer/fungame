import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'

// ─── Text Input ──────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center"
              style={{ color: 'var(--text-quaternary)' }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input ${className}`}
            style={{
              ...(icon ? { paddingLeft: '2.5rem' } : {}),
              ...(error ? { borderColor: 'var(--outline-error)' } : {}),
            }}
            {...rest}
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger-foreground)' }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`input min-h-24 resize-y ${className}`}
          style={error ? { borderColor: 'var(--outline-error)' } : undefined}
          {...rest}
        />
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger-foreground)' }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

// ─── Search Input ────────────────────────────────────────────────────────────

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, className = '', value, ...rest }, ref) => {
    return (
      <div className="relative">
        {/* Search icon */}
        <span
          className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center"
          style={{ color: 'var(--text-quaternary)' }}
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
        </span>
        <input
          ref={ref}
          type="search"
          value={value}
          className={`input ${className}`}
          style={{
            paddingLeft: '2.5rem',
            ...(value ? { paddingRight: '2.25rem' } : {}),
          }}
          {...rest}
        />
        {/* Clear button */}
        {value && onClear && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="absolute inset-y-0 right-3 flex items-center rounded transition"
            style={{ color: 'var(--text-quaternary)' }}
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'
