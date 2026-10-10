import type { CurrentUser, UserRole } from '@/types/auth'

/** admin o supervisor (acceso al panel y edición de partidos). */
export function isManager(user: CurrentUser | null | undefined): boolean {
  return !!user?.roles.some((r) => r === 'admin' || r === 'supervisor')
}

/** solo admin. */
export function isAdmin(user: CurrentUser | null | undefined): boolean {
  return !!user?.roles.includes('admin')
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  usuario: 'Jugador',
}

export const ROLE_SHORT: Record<UserRole, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  usuario: 'Jugador',
}

/** Etiqueta legible para el conjunto de roles del usuario. */
export function rolesLabel(roles: UserRole[] | undefined | null): string {
  if (!roles || roles.length === 0) return 'Sin rol'
  // Mostramos el rol de mayor jerarquía primero.
  const priority: UserRole[] = ['admin', 'supervisor', 'usuario']
  const sorted = [...roles].sort((a, b) => priority.indexOf(a) - priority.indexOf(b))
  return sorted.map((r) => ROLE_LABEL[r]).join(' · ')
}
