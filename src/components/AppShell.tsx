import { LayoutDashboard, LogIn, LogOut, Trophy, WandSparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { useHostAccess } from '../state/host-access'
import { useGameStore } from '../state/game-store'
import { cn } from '../lib/utils'

export function AppShell({ children }: PropsWithChildren) {
  const { isUnlocked, logout } = useHostAccess()
  const { isHostAuthenticated, signOut } = useGameStore()

  const isLoggedIn = isSupabaseConfigured ? isHostAuthenticated : isUnlocked

  return (
    <div className="min-h-screen px-4 py-6 text-hi sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col rounded-[2rem] border border-edge bg-input-bg p-4 shadow-[var(--shadow-panel)] backdrop-blur sm:p-6">

        {/* ── Header ── */}
        <header className="panel flex items-center justify-between px-5 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent text-on-accent">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-text">FunGame</p>
              <p className="font-[family-name:var(--font-heading)] text-sm font-semibold leading-none text-hi">
                Live quiz app
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            <NavLink
              to="/join"
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  isActive ? 'bg-raised text-on-accent' : 'bg-fill text-lo hover:bg-fill-hi',
                )
              }
            >
              Join game
            </NavLink>

            {isLoggedIn ? (
              <>
                <NavLink
                  to="/host/dashboard"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition',
                      isActive ? 'bg-raised text-on-accent' : 'bg-fill text-lo hover:bg-fill-hi',
                    )
                  }
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </NavLink>
                <button
                  className="flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-sm text-dim transition hover:border-rim hover:text-md"
                  onClick={() => isSupabaseConfigured ? signOut() : logout()}
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/host/login"
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent"
              >
                <LogIn className="size-4" />
                Sign in
              </Link>
            )}
          </nav>
        </header>

        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-3xl border border-warn-line bg-warn-tint px-4 py-3 text-sm text-warn-fg">
            <div className="flex items-start gap-3">
              <WandSparkles className="mt-0.5 size-4 shrink-0" />
              <p>
                Running in local mock mode. Add your Supabase keys in <code>.env</code> to enable real auth and persistence.
              </p>
            </div>
          </div>
        ) : null}

        <main className="mt-6 flex-1">{children}</main>
      </div>
    </div>
  )
}
