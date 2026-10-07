import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from './api'
import { authStore } from './auth-store'
import { getApiErrorMessage } from './errors'
import type { CurrentUser } from '@/types/auth'
import type {
  CreateMatchInput,
  MatchDetail,
  MatchListItem,
  UpdateMatchInput,
} from '@/types/match'

const QK = {
  all: ['matches'] as const,
  detail: (id: string) => ['matches', id] as const,
}

export function useMatches() {
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data } = await api.get<MatchListItem[]>('/matches')
      return data
    },
  })
}

// El próximo partido relevante para el usuario: el match con dateTime futuro
// más cercano que no esté cancelado ni finalizado. Si ninguno cumple, devuelve null.
export function useActiveMatch() {
  return useQuery({
    queryKey: ['matches', 'active'],
    queryFn: async () => {
      const { data } = await api.get<MatchListItem[]>('/matches')
      const now = Date.now()
      const upcoming = data
        .filter((m) => m.status !== 'cancelled' && m.status !== 'finished')
        .filter((m) => new Date(m.dateTime).getTime() >= now)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      const next = upcoming[0]
      if (!next) return null
      // Re-fetch del detalle para tener la plantilla completa.
      const { data: detail } = await api.get<MatchDetail>(`/matches/${next.id}`)
      return detail
    },
  })
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: id ? QK.detail(id) : ['matches', 'disabled'],
    queryFn: async () => {
      const { data } = await api.get<MatchDetail>(`/matches/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateMatchInput) => {
      const { data } = await api.post<MatchDetail>('/matches', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all })
    },
  })
}

export function useUpdateMatch(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateMatchInput) => {
      const { data } = await api.patch<MatchDetail>(`/matches/${id}`, input)
      return data
    },
    onSuccess: () => {
      // QK.all es prefijo de QK.detail(id): una sola invalidación alcanza.
      qc.invalidateQueries({ queryKey: QK.all })
    },
  })
}

export function useDeleteMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/matches/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all })
    },
  })
}

// --- Inscripción optimista --------------------------------------------------
// Mientras el server confirma, la plantilla y los contadores reaccionan al
// instante; si falla se revierte el snapshot y en onSettled se refresca todo.

// Devuelve `match` con el usuario agregado (registering) o quitado de la plantilla.
function withRegistration(match: MatchDetail, user: CurrentUser, registering: boolean): MatchDetail {
  const registrations = match.registrations.filter((r) => r.userId !== user.id)
  if (registering) {
    registrations.push({
      // Id sintético: lo reemplaza el refetch de onSettled con el real.
      id: `optimistic-${user.id}`,
      matchId: match.id,
      userId: user.id,
      registeredAt: new Date().toISOString(),
      user: { id: user.id, name: user.name },
    })
  }
  return { ...match, registrations }
}

// Ajusta el contador de inscripciones del listado de partidos (['matches']).
function withRegistrationCount(
  list: MatchListItem[],
  matchId: string,
  delta: number,
): MatchListItem[] {
  return list.map((m) =>
    m.id === matchId
      ? { ...m, _count: { ...m._count, registrations: Math.max(0, m._count.registrations + delta) } }
      : m,
  )
}

// Snapshot de las queries que ven la inscripción: detalle, active y listado.
// QK.all es prefijo de las tres → cancelarlas con esa clave alcanza.
async function snapshotEnrollQueries(qc: QueryClient, matchId: string) {
  await qc.cancelQueries({ queryKey: QK.all })
  return {
    prevDetail: qc.getQueryData<MatchDetail>(QK.detail(matchId)),
    prevActive: qc.getQueryData<MatchDetail | null>(['matches', 'active']),
    prevList: qc.getQueryData<MatchListItem[]>(QK.all),
  }
}

// Aplica el cambio optimista a las tres queries (detalle, active y listado).
function applyEnrollOptimistic(
  qc: QueryClient,
  matchId: string,
  snapshot: {
    prevDetail: MatchDetail | undefined
    prevActive: MatchDetail | null | undefined
    prevList: MatchListItem[] | undefined
  },
  registering: boolean,
) {
  const user = authStore.getUser()
  if (!user) return // Sin usuario no hay nada que inscribir de forma optimista.
  if (snapshot.prevDetail) {
    qc.setQueryData(QK.detail(matchId), withRegistration(snapshot.prevDetail, user, registering))
  }
  if (snapshot.prevActive && snapshot.prevActive.id === matchId) {
    qc.setQueryData(['matches', 'active'], withRegistration(snapshot.prevActive, user, registering))
  }
  if (snapshot.prevList) {
    qc.setQueryData(QK.all, withRegistrationCount(snapshot.prevList, matchId, registering ? 1 : -1))
  }
}

// Rollback: restaura los tres snapshots guardados en onMutate.
function rollbackEnroll(
  qc: QueryClient,
  matchId: string,
  snapshot:
    | {
        prevDetail: MatchDetail | undefined
        prevActive: MatchDetail | null | undefined
        prevList: MatchListItem[] | undefined
      }
    | undefined,
) {
  if (!snapshot) return
  if (snapshot.prevDetail) qc.setQueryData(QK.detail(matchId), snapshot.prevDetail)
  if (snapshot.prevActive) qc.setQueryData(['matches', 'active'], snapshot.prevActive)
  if (snapshot.prevList) qc.setQueryData(QK.all, snapshot.prevList)
}

export function useRegisterToMatch(matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/matches/${matchId}/register`)
      return data
    },
    onMutate: async () => {
      const snapshot = await snapshotEnrollQueries(qc, matchId)
      applyEnrollOptimistic(qc, matchId, snapshot, true)
      return snapshot
    },
    onError: (_err, _vars, ctx) => rollbackEnroll(qc, matchId, ctx),
    onSettled: () => {
      // QK.all cubre detalle, active y listado.
      qc.invalidateQueries({ queryKey: QK.all })
    },
  })
}

export function useUnregisterFromMatch(matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/matches/${matchId}/register`)
    },
    onMutate: async () => {
      const snapshot = await snapshotEnrollQueries(qc, matchId)
      applyEnrollOptimistic(qc, matchId, snapshot, false)
      return snapshot
    },
    onError: (_err, _vars, ctx) => rollbackEnroll(qc, matchId, ctx),
    onSettled: () => {
      // QK.all cubre detalle, active y listado.
      qc.invalidateQueries({ queryKey: QK.all })
    },
  })
}

export interface RegistrationAssignment {
  registrationId: string
  position: number
}

export function useReorderRegistrations(matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (assignments: RegistrationAssignment[]) => {
      await api.patch(`/matches/${matchId}/registrations/reorder`, { assignments })
      return assignments
    },
    onMutate: async (assignments) => {
      await qc.cancelQueries({ queryKey: QK.detail(matchId) })
      await qc.cancelQueries({ queryKey: ['matches', 'active'] })
      const prevDetail = qc.getQueryData<MatchDetail>(QK.detail(matchId))
      const prevActive = qc.getQueryData<MatchDetail | null>(['matches', 'active'])
      const apply = (m: MatchDetail | null | undefined) => {
        if (!m) return m
        const byRegId = new Map(assignments.map((a) => [a.registrationId, a.position]))
        const next = m.registrations.map((r) => {
          const newPos = byRegId.get(r.id)
          return newPos != null ? { ...r, position: newPos } : r
        })
        return { ...m, registrations: next }
      }
      if (prevDetail) qc.setQueryData(QK.detail(matchId), apply(prevDetail))
      if (prevActive) qc.setQueryData(['matches', 'active'], apply(prevActive))
      return { prevDetail, prevActive }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDetail) qc.setQueryData(QK.detail(matchId), ctx.prevDetail)
      if (ctx?.prevActive) qc.setQueryData(['matches', 'active'], ctx.prevActive)
      // El rollback deja el board como estaba; avisamos para que el admin sepa.
      toast.error(getApiErrorMessage(err))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.detail(matchId) })
      qc.invalidateQueries({ queryKey: ['matches', 'active'] })
    },
  })
}
