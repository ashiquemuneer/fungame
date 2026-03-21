import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { useGameStore } from '../state/game-store'
import { useHostAccess } from '../state/host-access'

export function RequireHostAccess() {
  const location = useLocation()
  const { isHostAuthenticated, authLoading } = useGameStore()
  const { isUnlocked } = useHostAccess()

  // Wait for Supabase session check to complete before deciding to redirect.
  // Without this, the host gets kicked to login on every page load.
  if (isSupabaseConfigured && authLoading) return null

  const allowed = isSupabaseConfigured ? isHostAuthenticated : isUnlocked

  if (!allowed) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate replace to={`/host/login?next=${next}`} />
  }

  return <Outlet />
}
