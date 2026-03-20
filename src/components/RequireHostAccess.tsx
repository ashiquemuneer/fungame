import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useHostAccess } from '../state/host-access'

export function RequireHostAccess() {
  const location = useLocation()
  const { isUnlocked } = useHostAccess()

  if (!isUnlocked) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate replace to={`/host/login?next=${next}`} />
  }

  return <Outlet />
}
