import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

// ─── Context ──────────────────────────────────────────────────────────────────

interface DropdownCtx {
  close: () => void
}
const Ctx = createContext<DropdownCtx>({ close: () => {} })

// ─── Root ─────────────────────────────────────────────────────────────────────

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const close = useCallback(() => setOpen(false), [])

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
      })
    }
    setOpen((v) => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <Ctx.Provider value={{ close }}>
      <div ref={triggerRef} onClick={toggle} className="inline-flex">
        {trigger}
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[200] min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#18141d]/98 py-1 shadow-2xl backdrop-blur-md"
          style={{
            top: pos.top,
            ...(align === 'right'
              ? { right: `calc(100vw - ${pos.left}px)` }
              : { left: pos.left }),
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

interface DropdownItemProps {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export function DropdownItem({
  icon,
  children,
  onClick,
  variant = 'default',
  disabled = false,
}: DropdownItemProps) {
  const { close } = useContext(Ctx)

  const handleClick = () => {
    if (disabled) return
    close()
    onClick?.()
  }

  const colorClass =
    variant === 'danger'
      ? 'text-rose-300 hover:bg-rose-400/10'
      : 'text-white/80 hover:bg-white/8 hover:text-white'

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${colorClass} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon && <span className="size-4 shrink-0 [&>svg]:size-4">{icon}</span>}
      {children}
    </button>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

export function DropdownSeparator() {
  return <div className="my-1 border-t border-white/8" />
}
