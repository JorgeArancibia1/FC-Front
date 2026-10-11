import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { authStore } from './auth-store'
import type { CurrentUser, UserRole } from '@/types/auth'

export interface RegisterInput {
  name: string
  lastName?: string
  jerseyName?: string
  preferredNumber?: number
  email: string
  password: string
  role: 'usuario' | 'admin'
  phone?: string
  securityQuestion?: string
  securityAnswer?: string
  platformInviteToken?: string
  platformInviteCode?: string
}

export interface RegisterResult {
  message: string
  user: CurrentUser & { createdAt?: string }
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post<RegisterResult>('/auth/register', input)
      return data
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const { data } = await api.post<{ message: string; devLink?: string }>(
        '/auth/forgot-password',
        input,
      )
      return data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; newPassword: string }) => {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', input)
      return data
    },
  })
}

export interface RecoverEmailInput {
  phone?: string
  securityQuestion?: string
  securityAnswer?: string
}

export function useRecoverEmail() {
  return useMutation({
    mutationFn: async (input: RecoverEmailInput) => {
      const { data } = await api.post<{ message: string; emails: string[] }>(
        '/auth/recover-email',
        input,
      )
      return data
    },
  })
}

export interface ChangeRoleResult {
  message: string
  user: CurrentUser
  token: string
}

/** Cambia el rol propio (jugador ↔ administrador) desde el perfil. */
export function useChangeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (role: Extract<UserRole, 'usuario' | 'admin'>) => {
      const { data } = await api.post<ChangeRoleResult>('/auth/change-role', { role })
      return data
    },
    onSuccess: (data) => {
      const refreshToken = authStore.getRefreshToken() ?? ''
      authStore.setSession(data.token, refreshToken, data.user)
      qc.invalidateQueries()
    },
  })
}
