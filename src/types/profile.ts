import type { UserRole } from './auth'

export interface Profile {
  id: string
  name: string
  lastName?: string | null
  jerseyName?: string | null
  preferredNumber?: number | null
  photoUrl?: string | null
  heroPhotoUrl?: string | null
  email: string
  phone?: string | null
  securityQuestion?: string | null
  roles: UserRole[]
  status: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  name?: string
  lastName?: string
  jerseyName?: string
  preferredNumber?: number
  photoUrl?: string
  heroPhotoUrl?: string
  phone?: string
  securityQuestion?: string
  securityAnswer?: string
}
