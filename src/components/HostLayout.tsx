import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Trophy,
  LayoutDashboard,
  BookOpen,
  RadioTower,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { useGameStore } from '../state/game-store'
import { SearchInput } from './ui'
import { cn } from '../lib/utils'

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const navItems = [
  { to: '/host/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/host/my-games',  label: 'My Games',  icon: BookOpen        },
  { to: '/host/sessions',  label: 'Sessions',  icon: RadioTower      },
]

const bottomItems = [
  { to: '/host/settings', label: 'Settings', icon: Settings  },
  { to: '/',              label: 'Help',     icon: HelpCircle },
]

// ─── Avatar dropdown ──────────────────────────────────────────────────────────

function AvatarDropdown() {
  const [open, setOpen] = useState(false)
  const { hostEmail, signOut } = useGameStore()
  const initial = hostEmail?.[0]?.toUpperCase() ?? 'H'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-edge bg-fill py-1.5 pl-1.5 pr-3 text-sm font-medium text-md transition hover:bg-fill-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">{hostEmail ?? 'Host'}</span>
        <ChevronDown className="size-3.5 text-dim" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-edge bg-raised py-1 shadow-2xl backdrop-blur-md">
            {hostEmail && (
              <div className="border-b border-line px-4 py-2.5">
                <p className="truncate text-xs text-dim">{hostEmail}</p>
              </div>
            )}
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-err-fg transition hover:bg-err-tint"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { hostEmail } = useGameStore()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
          <Trophy className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-text">FunGame</p>
          <p className="truncate text-sm font-semibold text-hi">Live quiz app</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="ml-auto text-dim hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg">
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-accent-dim text-accent-text'
                  : 'text-lo hover:bg-fill hover:text-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Host email divider */}
      {hostEmail && (
        <div className="mx-3 mb-2 rounded-xl border border-line bg-fill px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-dim">Signed in as</p>
          <p className="mt-0.5 truncate text-xs font-medium text-lo">{hostEmail}</p>
        </div>
      )}

      {/* Bottom links */}
      <div className="space-y-0.5 border-t border-line px-3 py-3">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-dim transition hover:bg-fill hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

// ─── HostLayout ───────────────────────────────────────────────────────────────

export function HostLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/host/my-games?q=${encodeURIComponent(value.trim())}`)
    } else {
      navigate('/host/my-games')
    }
  }

  return (
    <div className="light-host flex min-h-screen bg-page text-hi">
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 border-r border-line lg:block xl:w-60">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--overlay-lg)] backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-edge bg-page-up lg:hidden">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-page px-4 backdrop-blur-md">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 text-lo transition hover:text-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search games…"
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AvatarDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
