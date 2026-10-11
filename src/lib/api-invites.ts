import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type {
  AcceptInviteResult,
  CreatedInvite,
  CreatedPlatformInvite,
  InviteResolution,
  PlatformInviteResolution,
} from '@/types/invite'

/** Genera link + código para invitar a un partido (admin siempre; usuario si está inscrito). */
export function useCreateInvite() {
  return useMutation({
    mutationFn: async (matchId: string) => {
      const { data } = await api.post<CreatedInvite>(`/matches/${matchId}/invites`)
      return data
    },
  })
}

/** Genera link + código para invitar a la plataforma (solo staff). */
export function useCreatePlatformInvite() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CreatedPlatformInvite>('/platform-invites')
      return data
    },
  })
}

/** Resuelve un link de invitación a la plataforma (público). */
export function useResolvePlatformInviteToken(token: string | undefined) {
  return useQuery({
    queryKey: ['platform-invites', 'token', token],
    queryFn: async () => {
      const { data } = await api.get<PlatformInviteResolution>(`/platform-invites/${token}`)
      return data
    },
    enabled: !!token,
    retry: false,
  })
}

/** Resuelve un código de invitación a la plataforma (público) bajo demanda. */
export function useResolvePlatformInviteCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<PlatformInviteResolution>('/platform-invites/code', { code })
      return data
    },
  })
}

/** Resuelve un link de invitación (público). */
export function useResolveInviteToken(token: string | undefined) {
  return useQuery({
    queryKey: ['invites', 'token', token],
    queryFn: async () => {
      const { data } = await api.get<InviteResolution>(`/invites/${token}`)
      return data
    },
    enabled: !!token,
    retry: false,
  })
}

/** Resuelve un código de 6 dígitos (público) bajo demanda. */
export function useResolveInviteCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<InviteResolution>('/invites/code', { code })
      return data
    },
  })
}

/** Acepta la invitación estando autenticado (por token o código). */
export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { token?: string; code?: string }) => {
      const { data } = await api.post<AcceptInviteResult>('/invites/accept', params)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
