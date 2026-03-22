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
  { to: '/host/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/host/games',     label: 'My Games',      icon: BookOpen         },
  { to: '/host/sessions',  label: 'Sessions',      icon: RadioTower       },
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
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 py-1.5 pl-1.5 pr-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-orange-300 text-xs font-bold text-stone-950">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:block">{hostEmail ?? 'Host'}</span>
        <ChevronDown className="size-3.5 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-[#18141d]/98 py-1 shadow-2xl backdrop-blur-md">
            {hostEmail && (
              <div className="border-b border-white/8 px-4 py-2.5">
                <p className="truncate text-xs text-white/40">{hostEmail}</p>
              </div>
            )}
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-300 transition hover:bg-rose-400/10"
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
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-300 text-stone-950">
          <Trophy className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-200/70">FunGame</p>
          <p className="truncate text-sm font-semibold text-white">Live quiz app</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white/70">
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
                  ? 'bg-orange-300/12 text-orange-200'
                  : 'text-white/55 hover:bg-white/6 hover:text-white/80',
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
        <div className="mx-3 mb-2 rounded-xl border border-white/6 bg-white/4 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Signed in as</p>
          <p className="mt-0.5 truncate text-xs font-medium text-white/60">{hostEmail}</p>
        </div>
      )}

      {/* Bottom links */}
      <div className="space-y-0.5 border-t border-white/8 px-3 py-3">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/40 transition hover:bg-white/6 hover:text-white/65"
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
      navigate(`/host/dashboard?q=${encodeURIComponent(value.trim())}`)
    } else {
      navigate('/host/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen bg-[#09070d] text-white">
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 border-r border-white/8 lg:block xl:w-60">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#120d14] lg:hidden">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/8 bg-[#09070d]/90 px-4 backdrop-blur-md">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 text-white/50 transition hover:text-white/80 lg:hidden"
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
