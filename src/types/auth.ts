// Roles del sistema:
// - developer: único email reservado (cristobal@gmail.com). Acceso total + panel avanzado.
// - admin: gestiona partidos y usuarios, invita a cualquier partido.
// - usuario: juega, se inscribe y puede invitar en sus partidos.
export type UserRole = 'developer' | 'admin' | 'usuario'

export interface CurrentUser {
  id: string
  name: string
  email: string
  roles: UserRole[]
  status?: string
}

export interface LoginResponse {
  message: string
  user: CurrentUser
  token: string
  refreshToken: string
}

export interface RefreshResponse {
  message: string
  user: CurrentUser
  token: string
  refreshToken: string
}
