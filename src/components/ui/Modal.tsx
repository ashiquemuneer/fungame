import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Clicking the backdrop closes the modal. Default: true */
  closeOnBackdrop?: boolean
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-5xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="light-host fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--overlay-lg)] backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative z-10 w-full ${sizeClass[size]} panel p-6 shadow-2xl`}
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Header */}
        {(title || description) && (
          <div className="mb-5">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-hi">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-lo">{description}</p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-lo transition hover:bg-fill-hi hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:outline-offset-1"
          aria-label="Close"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {children}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>,
    document.body,
  )
}
