import { useEffect, useRef, useState } from 'react'
import { GripVertical, UserPlus2 } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { MatchRegistration } from '@/types/match'
import type { TeamKey, TeamSlot } from '@/lib/teams'
import { resolveAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// Duración del press-and-hold para revelar el hero (táctil / mouse sostenido).
// El drag táctil arranca a los 300ms (mobile-drag-drop); cualquier movimiento
// >MOVE_THRESHOLD_PX cancela este timer, así que un hold quieto revela la foto
// y un gesto de arrastre mueve la tarjeta.
const PRESS_HOLD_MS = 600
// Movimiento en px que cancela el timer (para no interferir con drag/scroll).
const MOVE_THRESHOLD_PX = 10

interface Props {
  slot: TeamSlot
  isCurrentUser?: boolean
  isNewArrival?: boolean
  enableDnd?: boolean
  onHeroEnter?: (userId: string) => void
  onHeroLeave?: (userId: string) => void
}

const TEAM_GLOW: Record<TeamKey, string> = {
  A: 'group-hover:shadow-[0_0_34px_-12px_var(--team-a)]',
  B: 'group-hover:shadow-[0_0_34px_-12px_var(--team-b)]',
}

const TEAM_RING: Record<TeamKey, string> = {
  A: 'ring-team-a/30',
  B: 'ring-team-b/30',
}

const TEAM_NUMBER: Record<TeamKey, string> = {
  A: 'text-team-a',
  B: 'text-team-b',
}

const CARD_TYPE = 'player-card'
const SLOT_TYPE = 'player-slot'

export type PlayerCardDragData = Record<string | symbol, unknown> & {
  type: typeof CARD_TYPE
  registrationId: string
  fromPosition: number
}

export type PlayerSlotDropData = Record<string | symbol, unknown> & {
  type: typeof SLOT_TYPE
  position: number
}

export function PlayerCardHero({
  slot,
  isCurrentUser,
  isNewArrival,
  enableDnd,
  onHeroEnter,
  onHeroLeave,
}: Props) {
  if (slot.registration) {
    return (
      <FilledPlayerCard
        registration={slot.registration}
        slot={slot}
        isCurrentUser={isCurrentUser}
        isNewArrival={isNewArrival}
        enableDnd={enableDnd}
        onHeroEnter={onHeroEnter}
        onHeroLeave={onHeroLeave}
      />
    )
  }
  return <EmptyPlayerCard slot={slot} enableDnd={enableDnd} />
}

function FilledPlayerCard({
  registration,
  slot,
  isCurrentUser,
  isNewArrival,
  enableDnd,
  onHeroEnter,
  onHeroLeave,
}: {
  registration: MatchRegistration
  slot: TeamSlot
  isCurrentUser?: boolean
  isNewArrival?: boolean
  enableDnd?: boolean
  onHeroEnter?: (userId: string) => void
  onHeroLeave?: (userId: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const { user } = registration
  const displayName = user.jerseyName || user.name.split(' ')[0].toUpperCase()
  // Preferimos la foto de cuerpo entero; si no existe, el avatar; si no, iniciales.
  const cardSrc = resolveAssetUrl(user.heroPhotoUrl) ?? resolveAssetUrl(user.photoUrl)

  useEffect(() => {
    const el = cardRef.current
    if (!el || !onHeroEnter) return

    let timer: number | null = null
    let start: { x: number; y: number } | null = null
    let active = false

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer)
        timer = null
      }
    }
    const fireLeave = () => {
      if (active) {
        active = false
        onHeroLeave?.(user.id)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      start = { x: e.clientX, y: e.clientY }
      clearTimer()
      timer = window.setTimeout(() => {
        active = true
        onHeroEnter(user.id)
      }, PRESS_HOLD_MS)
    }
    const onMove = (e: PointerEvent) => {
      if (!start) return
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        clearTimer()
        fireLeave()
        start = null
      }
    }
    const release = () => {
      clearTimer()
      fireLeave()
      start = null
    }
    const onCtx = (e: MouseEvent) => {
      if (active) e.preventDefault()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)
    el.addEventListener('pointerleave', release)
    el.addEventListener('contextmenu', onCtx)

    return () => {
      clearTimer()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', release)
      el.removeEventListener('pointercancel', release)
      el.removeEventListener('pointerleave', release)
      el.removeEventListener('contextmenu', onCtx)
    }
  }, [user.id, onHeroEnter, onHeroLeave])

  useEffect(() => {
    if (!isNewArrival || !cardRef.current) return
    const tl = gsap.timeline()
    tl.fromTo(
      cardRef.current,
      { scale: 0.4, opacity: 0, rotationY: 180, z: -200 },
      { scale: 1, opacity: 1, rotationY: 0, z: 0, duration: 0.9, ease: 'back.out(1.4)' },
    )
    if (flashRef.current) {
      tl.fromTo(
        flashRef.current,
        { opacity: 0.8 },
        { opacity: 0, duration: 1.4, ease: 'power2.out' },
        0.1,
      )
    }
    return () => {
      tl.kill()
    }
  }, [isNewArrival])

  useGSAP(
    () => {
      const el = cardRef.current
      if (!el || enableDnd) return
      const handleEnter = () => {
        gsap.to(el, {
          scale: 1.05,
          rotationY: 4,
          rotationX: -4,
          duration: 0.35,
          ease: 'power2.out',
        })
      }
      const handleLeave = () => {
        gsap.to(el, {
          scale: 1,
          rotationY: 0,
          rotationX: 0,
          duration: 0.4,
          ease: 'power2.out',
        })
      }
      el.addEventListener('mouseenter', handleEnter)
      el.addEventListener('mouseleave', handleLeave)
      return () => {
        el.removeEventListener('mouseenter', handleEnter)
        el.removeEventListener('mouseleave', handleLeave)
      }
    },
    { scope: cardRef, dependencies: [enableDnd] },
  )

  useEffect(() => {
    if (!enableDnd || !cardRef.current) return
    const el = cardRef.current
    return combine(
      draggable({
        element: el,
        getInitialData: (): PlayerCardDragData => ({
          type: CARD_TYPE,
          registrationId: registration.id,
          fromPosition: slot.position,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => {
          const data = source.data as unknown as PlayerCardDragData
          return data.type === CARD_TYPE && data.fromPosition !== slot.position
        },
        getData: (): PlayerSlotDropData => ({
          type: SLOT_TYPE,
          position: slot.position,
        }),
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: () => setIsOver(false),
      }),
    )
  }, [enableDnd, registration.id, slot.position])

  return (
    <article
      ref={cardRef}
      data-player-card
      style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-pitch to-pitch-deep ring-1 transition-[box-shadow,opacity,transform] duration-200 will-change-transform',
        TEAM_RING[slot.team],
        TEAM_GLOW[slot.team],
        isCurrentUser && 'ring-2 ring-team-a shadow-[0_0_24px_-6px_var(--team-a)]',
        enableDnd && 'cursor-grab select-none active:cursor-grabbing [-webkit-touch-callout:none]',
        !enableDnd && 'select-none [-webkit-touch-callout:none]',
        isDragging && 'scale-95 opacity-40',
        isOver &&
          'scale-[1.04] ring-2 ring-yellow-300 shadow-[0_0_34px_-4px_rgba(253,224,71,0.7)]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-pitch-glow opacity-50" />

      {cardSrc ? (
        <img
          src={cardSrc}
          alt={displayName}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-display text-5xl opacity-50', TEAM_NUMBER[slot.team])}>
            {displayName.slice(0, 2)}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/75 to-transparent" />

      {/* Índice de cupo */}
      <span className="absolute left-1.5 top-1.5 rounded bg-black/40 px-1.5 py-0.5 font-display text-[10px] tracking-widest text-white/60">
        {String(slot.positionInTeam).padStart(2, '0')}
      </span>

      {/* Número */}
      {user.preferredNumber != null && (
        <span
          className={cn(
            'absolute right-1.5 top-1 font-display text-3xl font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]',
            TEAM_NUMBER[slot.team],
          )}
        >
          {user.preferredNumber}
        </span>
      )}

      {/* Handle de drag */}
      {enableDnd && (
        <span
          className="absolute left-1/2 top-1 -translate-x-1/2 text-white/40 transition-colors group-hover:text-white/80"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>
      )}

      {/* Nombre de camiseta */}
      <div className="absolute inset-x-0 bottom-0 p-2 text-center">
        <p className="truncate font-display text-lg leading-tight text-white text-shadow-hero">
          {displayName}
        </p>
        {isCurrentUser && (
          <span className="mt-0.5 inline-block rounded-full bg-team-a px-2 py-0.5 text-[9px] font-black tracking-widest text-team-a-foreground">
            TÚ
          </span>
        )}
      </div>

      {/* Barra inferior del color del equipo */}
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 h-1',
          slot.team === 'A' ? 'bg-team-a' : 'bg-team-b',
        )}
        aria-hidden
      />

      {/* Flash de llegada */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 bg-pitch-glow"
        style={{ opacity: 0 }}
      />
    </article>
  )
}

function EmptyPlayerCard({ slot, enableDnd }: { slot: TeamSlot; enableDnd?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    if (!enableDnd || !cardRef.current) return
    const el = cardRef.current
    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data as unknown as PlayerCardDragData
        return data.type === CARD_TYPE && data.fromPosition !== slot.position
      },
      getData: (): PlayerSlotDropData => ({
        type: SLOT_TYPE,
        position: slot.position,
      }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })
  }, [enableDnd, slot.position])

  const isTeamA = slot.team === 'A'

  return (
    <article
      ref={cardRef}
      data-player-card
      className={cn(
        'relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white/[0.02] transition-all duration-200',
        isTeamA ? 'border-team-a/25' : 'border-team-b/25',
        isOver &&
          'scale-[1.04] border-yellow-300/80 bg-yellow-300/5 shadow-[0_0_34px_-4px_rgba(253,224,71,0.55)]',
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1.5',
          isTeamA ? 'text-team-a/70' : 'text-team-b/70',
        )}
      >
        <UserPlus2 className="size-6" />
        <span className="font-display text-[11px] tracking-widest">
          {isOver ? 'SOLTAR AQUÍ' : 'DISPONIBLE'}
        </span>
      </div>
      <span
        className={cn(
          'absolute left-1.5 top-1.5 font-display text-[10px] tracking-widest',
          isTeamA ? 'text-team-a/40' : 'text-team-b/40',
        )}
      >
        {String(slot.positionInTeam).padStart(2, '0')}
      </span>
    </article>
  )
}
