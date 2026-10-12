import type { UserRole } from '@/types/auth'

type RoleHolder = { roles: UserRole[] } | null | undefined

/** Cuenta de desarrollador: acceso total + panel de configuración avanzada. */
export function isDeveloper(user: RoleHolder): boolean {
  return !!user?.roles.includes('developer')
}

/** Administrador o desarrollador: gestiona partidos, usuarios e invitaciones. */
export function isAdmin(user: RoleHolder): boolean {
  return !!user?.roles.includes('admin') || isDeveloper(user)
}

/** Alias histórico: "manager" = puede administrar el club. */
export const isManager = isAdmin

export const ROLE_LABEL: Record<UserRole, string> = {
  developer: 'Desarrollador',
  admin: 'Administrador',
  usuario: 'Jugador',
}

export const ROLE_SHORT: Record<UserRole, string> = {
  developer: 'Dev',
  admin: 'Admin',
  usuario: 'Jugador',
}

export function rolesLabel(roles: UserRole[] | null | undefined): string {
  if (!roles || roles.length === 0) return 'Sin rol'
  const order: UserRole[] = ['developer', 'admin', 'usuario']
  return [...roles]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((r) => ROLE_LABEL[r] ?? r)
    .join(' · ')
}
