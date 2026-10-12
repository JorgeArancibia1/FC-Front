import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import { authStore } from '@/lib/auth-store'

// Deriva la URL del WebSocket eliminando el path /api del baseURL HTTP.
// Si VITE_API_URL no está, usa el origen actual (Netlify u otro mismo-host).
function getRealtimeUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) return window.location.origin
  return apiUrl.replace(/\/api\/?$/, '')
}

// 'connecting'    → intentando conectar (o reintento en curso)
// 'connected'     → conectado y unido al room
// 'disconnected'  → sin conexión (sin token, sin match, o el server la cerró)
// 'error'         → el intento de conexión fue rechazado (p. ej. JWT vencido);
//                    distinguible de 'disconnected' para no quedar en spinner.
export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface PlayerRegisteredEvent {
  matchId: string
}

interface PlayerUnregisteredEvent {
  matchId: string
  userId: string
}

// Último estado reportado por el socket, tagueado con el matchId para el que
// sirve: si cambia el partido, el estado viejo se ignora en el render.
interface SocketStatus {
  matchId: string
  status: RealtimeStatus
}

// Conecta al namespace /realtime, se une al room del matchId,
// e invalida la query del match cuando llegan eventos de inscripción.
export function useMatchRealtime(matchId: string | undefined): RealtimeStatus {
  const qc = useQueryClient()
  const [socketStatus, setSocketStatus] = useState<SocketStatus | null>(null)

  useEffect(() => {
    if (!matchId) return
    // Copia estrecha: TS no estrecha los parámetros dentro de closures.
    const id: string = matchId
    const token = authStore.getToken()
    // Sin token no hay intento posible: el render deriva 'disconnected'.
    if (!token) return

    const socket: Socket = io(`${getRealtimeUrl()}/realtime`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
    })

    // Todas las transiciones se reportan desde callbacks del sistema externo
    // (socket.io / authStore), nunca sincrónicamente desde el cuerpo del efecto.
    function report(status: RealtimeStatus) {
      setSocketStatus({ matchId: id, status })
    }
    function handleConnect() {
      report('connected')
      socket.emit('match:join', matchId)
    }
    function handleDisconnect() {
      report('disconnected')
    }
    function handleConnectError() {
      // Handshake rechazado (típicamente JWT vencido). No cortamos la
      // reconexión automática: mientras reintenta, el suscriptor de más
      // abajo puede refrescar socket.auth y el próximo intento entra con
      // el token nuevo. El estado 'error' evita el spinner infinito.
      report('error')
    }
    function handleRegistered(evt: PlayerRegisteredEvent) {
      if (evt.matchId !== matchId) return
      // Una sola invalidación con prefijo ['matches'] cubre lista, active y
      // detalle: las 3 llamadas separadas re-disparaban el refetch de las
      // mismas queries y multiplicaban los requests contra el rate limit.
      qc.invalidateQueries({ queryKey: ['matches'] })
    }
    function handleUnregistered(evt: PlayerUnregisteredEvent) {
      if (evt.matchId !== matchId) return
      qc.invalidateQueries({ queryKey: ['matches'] })
    }
    function handleReordered(evt: { matchId: string }) {
      if (evt.matchId !== matchId) return
      qc.invalidateQueries({ queryKey: ['matches'] })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('player.registered', handleRegistered)
    socket.on('player.unregistered', handleUnregistered)
    socket.on('players.reordered', handleReordered)

    // El access token rota cada ~30 min vía refresh (api.ts llama
    // authStore.setSession y eso notifica a los suscriptores). Sin esto el
    // socket nace con un JWT congelado y, al reconectar, el server lo rechaza
    // en un bucle de connect_error. Al cambiar el token: actualizamos
    // socket.auth y reconectamos sólo si no está conectado.
    const unsubscribe = authStore.subscribe(() => {
      const nuevo = authStore.getToken()
      if (!nuevo) {
        // Sesión cerrada (logout o refresh fallido): cortamos la conexión.
        socket.disconnect()
        return
      }
      socket.auth = { token: `Bearer ${nuevo}` }
      if (!socket.connected) {
        report('connecting')
        socket.connect()
      }
    })

    return () => {
      unsubscribe()
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('player.registered', handleRegistered)
      socket.off('player.unregistered', handleUnregistered)
      socket.off('players.reordered', handleReordered)
      // Sin emit('match:leave'): disconnect() cierra el socket y el server
      // limpia la room al detectar la desconexión. Emitir el leave acá era
      // una carrera: el paquete podía perderse contra el cierre del socket.
      socket.disconnect()
    }
  }, [matchId, qc])

  // Estado reportado sólo si corresponde al matchId actual; mientras no haya
  // socket (sin match o sin token) o antes del primer evento, derivamos:
  // 'connecting' sólo cuando realmente hay un intento en curso.
  if (socketStatus && socketStatus.matchId === matchId) return socketStatus.status
  return matchId && authStore.getToken() ? 'connecting' : 'disconnected'
}
