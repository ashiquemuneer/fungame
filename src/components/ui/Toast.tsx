import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number   // ms — 0 = persistent
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error:   (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info:    (title: string, description?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, { border: string; icon: ReactNode }> = {
  success: {
    border: 'border-ok-line',
    icon: <CheckCircle className="size-4 shrink-0 text-ok-fg" />,
  },
  error: {
    border: 'border-err-line',
    icon: <XCircle className="size-4 shrink-0 text-err-fg" />,
  },
  warning: {
    border: 'border-warn-line',
    icon: <AlertCircle className="size-4 shrink-0 text-warn-fg" />,
  },
  info: {
    border: 'border-note-line',
    icon: <Info className="size-4 shrink-0 text-note-fg" />,
  },
}

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { border, icon } = variantStyles[item.variant]
  const duration = item.duration ?? 4000
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (duration === 0) return
    timerRef.current = setTimeout(() => onDismiss(item.id), duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [item.id, duration, onDismiss])

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${border} bg-raised p-4 shadow-xl backdrop-blur-md`}
      style={{ animation: 'toastIn 0.2s ease-out' }}
      role="alert"
    >
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-hi">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-lo">{item.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-lg p-1 text-dim transition hover:bg-fill-hi hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:outline-offset-1"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]) // max 5 visible
  }, [])

  const value: ToastContextValue = {
    toast:   addToast,
    success: (title, description) => addToast({ variant: 'success', title, description }),
    error:   (title, description) => addToast({ variant: 'error',   title, description }),
    warning: (title, description) => addToast({ variant: 'warning', title, description }),
    info:    (title, description) => addToast({ variant: 'info',    title, description }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="light-host pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateX(12px) scale(0.97); }
              to   { opacity: 1; transform: translateX(0)    scale(1);    }
            }
          `}</style>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
