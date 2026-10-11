import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DevSystem } from '@/types/dev'

/** Estadísticas del sistema para el panel de desarrollador. */
export function useDevSystem() {
  return useQuery({
    queryKey: ['dev', 'system'],
    queryFn: async () => {
      const { data } = await api.get<DevSystem>('/dev/system')
      return data
    },
  })
}
