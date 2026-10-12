import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { authStore } from '@/lib/auth-store'

// Deriva la URL del WebSocket eliminando el path /api del baseURL HTTP.
function getRealtimeUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return window.location.origin
  return apiUrl.replace(/\/api\/?$/, '')
}

// Socket global compartido (singleton con conteo de referencias): todos los
// consumidores del hook usan la misma conexión, aunque haya guards anidados.
let socket: Socket | null = null
let unsubscribeAuth: (() => void) | null = null
let queryClient: QueryClient | null = null
let consumers = 0

function ensureSocket(qc: QueryClient): void {
  queryClient = qc
  if (socket) return
  const token = authStore.getToken()
  if (!token) return

  const s: Socket = io(`${getRealtimeUrl()}/realtime`, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket', 'polling'],
  })
  socket = s

  s.on('connect', () => s.emit('matches:join'))
  s.on('matches.changed', () => {
    // El prefijo ['matches'] cubre lista, 'mine', 'active' y detalle.
    queryClient?.invalidateQueries({ queryKey: ['matches'] })
  })

  unsubscribeAuth = authStore.subscribe(() => {
    const nuevo = authStore.getToken()
    if (!nuevo) {
      s.disconnect()
      return
    }
    s.auth = { token: `Bearer ${nuevo}` }
    if (!s.connected) s.connect()
  })
}

function releaseSocket(): void {
  consumers -= 1
  if (consumers > 0) return
  unsubscribeAuth?.()
  unsubscribeAuth = null
  socket?.disconnect()
  socket = null
  queryClient = null
}

/**
 * Suscripción global (una por sesión): se une a la sala 'matches' del gateway y
 * refresca la lista/detalle cuando cualquier partido cambia (creado, editado,
 * borrado o cambió su plantilla). Así todo el mundo ve los cambios en vivo sin
 * estar necesariamente dentro del detalle de ese partido.
 */
export function useMatchesRealtime(): void {
  const qc = useQueryClient()

  useEffect(() => {
    consumers += 1
    ensureSocket(qc)
    return () => releaseSocket()
  }, [qc])
}
