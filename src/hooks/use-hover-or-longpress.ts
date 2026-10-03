import { useCallback, useEffect, useRef } from 'react'

// Duración del press-and-hold para revelar el hero. Aplica a desktop y mobile.
const PRESS_HOLD_MS = 5000
// Umbral de movimiento — si el puntero se mueve más que esto, se cancela el timer
// (así el drag & drop del admin no dispara el hero por accidente).
const MOVE_THRESHOLD_PX = 10

interface UsePressHoldOptions {
  /** ID del elemento (se reporta al enter). */
  id: string
  /** Se llama cuando el press-and-hold cumple el tiempo. */
  onEnter: (id: string) => void
  /** Se llama cuando se libera / cancela el press. */
  onLeave: (id: string) => void
  /** Si es false, el hook no engancha nada. */
  enabled?: boolean
}

/**
 * Retorna handlers para el elemento raíz de la card. En cualquier dispositivo
 * (desktop o mobile), pointerdown arranca un timer de PRESS_HOLD_MS; si el
 * puntero no se mueve significativamente y no se levanta antes, se dispara
 * onEnter. Al soltar o mover mucho, dispara onLeave.
 *
 * NO usa hover — el hero requiere un gesto deliberado, no un tooltip.
 */
export function useHoverOrLongPress(options: UsePressHoldOptions) {
  const { id, onEnter, onLeave, enabled = true } = options
  const timerRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const fireLeave = useCallback(() => {
    if (activeRef.current) {
      activeRef.current = false
      onLeave(id)
    }
  }, [id, onLeave])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  if (!enabled) {
    return {
      onPointerDown: undefined,
      onPointerMove: undefined,
      onPointerUp: undefined,
      onPointerCancel: undefined,
      onPointerLeave: undefined,
      onContextMenu: undefined,
    }
  }

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      // Solo botón primario (izquierdo) o touch/pen.
      if (e.pointerType === 'mouse' && e.button !== 0) return
      startPosRef.current = { x: e.clientX, y: e.clientY }
      clearTimer()
      timerRef.current = window.setTimeout(() => {
        activeRef.current = true
        onEnter(id)
      }, PRESS_HOLD_MS)
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const start = startPosRef.current
      if (!start) return
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        clearTimer()
        fireLeave()
      }
    },
    onPointerUp: () => {
      clearTimer()
      fireLeave()
    },
    onPointerCancel: () => {
      clearTimer()
      fireLeave()
    },
    onPointerLeave: () => {
      clearTimer()
      fireLeave()
    },
    // Bloquea el menú del sistema (copiar imagen, guardar) durante el press.
    onContextMenu: (e: React.MouseEvent) => {
      if (activeRef.current) e.preventDefault()
    },
  }
}
