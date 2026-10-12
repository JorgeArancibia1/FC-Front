import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/use-auth'
import { isAdmin } from '@/lib/roles'

// Decide la página por defecto según el rol del usuario logueado.
// Si no hay sesión, manda al login.
export function RedirectByRole() {
  const currentUser = useCurrentUser()

  if (!currentUser) return <Navigate to="/login" replace />

  return <Navigate to={isAdmin(currentUser) ? '/admin' : '/inicio'} replace />
}
