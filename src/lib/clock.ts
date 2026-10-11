import { useSyncExternalStore } from 'react'

// Reloj global compartido: un único `setInterval` alimenta a TODOS los
// temporizadores de la app (aunque haya decenas de tarjetas con cuenta
// regresiva). Solo corre mientras existan suscriptores.

let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function tick(): void {
  now = Date.now()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (timer === null) {
    now = Date.now()
    timer = setInterval(tick, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

function getSnapshot(): number {
  return now
}

/** Hora actual (ms) que se actualiza cada segundo de forma compartida. */
export function useClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
