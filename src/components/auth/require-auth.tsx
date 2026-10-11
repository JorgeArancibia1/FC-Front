import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/use-auth'
import { useMatchesRealtime } from '@/hooks/use-matches-realtime'
import type { UserRole } from '@/types/auth'

interface Props {
  roles?: UserRole[]
}

export function RequireAuth({ roles }: Props) {
  const currentUser = useCurrentUser()
  const location = useLocation()

  // Refresco en vivo de la lista/detalle de partidos para toda el área autenticada.
  useMatchesRealtime()

  if (!currentUser) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (roles && roles.length > 0 && !roles.some((r) => currentUser.roles.includes(r))) {
    // Sin permiso: lo mandamos a su página por defecto (evita bucles).
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
