import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { useGameStore } from '../state/game-store'
import { useHostAccess } from '../state/host-access'

export function RequireHostAccess() {
  const location = useLocation()
  const { isHostAuthenticated } = useGameStore()
  const { isUnlocked } = useHostAccess()

  const allowed = isSupabaseConfigured ? isHostAuthenticated : isUnlocked

  if (!allowed) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate replace to={`/host/login?next=${next}`} />
  }

  return <Outlet />
}
