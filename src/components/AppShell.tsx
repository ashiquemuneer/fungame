import { LogOut, ShieldCheck, Trophy, WandSparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import { useHostAccess } from '../state/host-access'
import { cn } from '../lib/utils'
import { useLocation } from 'react-router-dom'

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isUnlocked, logout } = useHostAccess()
  const isHostRoute = location.pathname.startsWith('/host')
  const navItems = [
    { to: '/', label: 'Overview' },
    isUnlocked
      ? { to: '/host/dashboard', label: 'Host' }
      : { to: '/host/login', label: 'Host login' },
    { to: '/join', label: 'Join' },
  ]

  return (
    <div
      className={cn(
        'min-h-screen text-white',
        isHostRoute ? 'px-2 py-2 sm:px-2.5 lg:px-3' : 'px-4 py-6 sm:px-6 lg:px-10',
      )}
    >
      <div
        className={cn(
          'mx-auto flex min-h-[calc(100vh-3rem)] flex-col rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6',
          isHostRoute ? 'max-w-[128rem] p-2 sm:p-2.5 lg:p-3' : 'max-w-7xl',
        )}
      >
        <header
          className={cn(
            'panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            isHostRoute ? 'px-2.5 py-2' : 'px-5 py-4',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-300 text-stone-950">
              <Trophy className="size-6" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-orange-200/80">
                FunGame
              </p>
              <h1 className="font-['Sora','Avenir_Next',sans-serif] text-xl font-semibold">
                Live office quiz app
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition',
                      isActive ? 'bg-white text-stone-950' : 'bg-white/6 text-white/75 hover:bg-white/12',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isUnlocked ? (
              <button className="button-ghost rounded-full border border-white/10" type="button" onClick={logout}>
                <LogOut className="size-4" />
                Lock
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                <ShieldCheck className="size-4 text-orange-200" />
                Participants stay out of host pages
              </div>
            )}
          </div>
        </header>

        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-3xl border border-amber-300/25 bg-amber-200/10 px-4 py-3 text-sm text-amber-50">
            <div className="flex items-start gap-3">
              <WandSparkles className="mt-0.5 size-4 shrink-0" />
              <p>
                Running in local mock mode. Add your Supabase keys in `.env` when you are
                ready to replace local storage with the free backend.
              </p>
            </div>
          </div>
        ) : null}

        <main className={cn('flex-1', isHostRoute ? 'mt-2' : 'mt-6')}>{children}</main>
      </div>
    </div>
  )
}
