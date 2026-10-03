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

// Duración del press-and-hold para revelar el hero.
const PRESS_HOLD_MS = 5000
// Movimiento en px que cancela el timer (para no interferir con drag).
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
  A: 'shadow-[0_0_24px_-8px_rgba(132,204,22,0.5)]',
  B: 'shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)]',
}

const TEAM_NUMBER: Record<TeamKey, string> = {
  A: 'text-lime-300',
  B: 'text-sky-300',
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
      console.log('[hero] pointerdown', user.id, e.pointerType)
      start = { x: e.clientX, y: e.clientY }
      clearTimer()
      timer = window.setTimeout(() => {
        console.log('[hero] TIMER FIRED', user.id)
        active = true
        onHeroEnter(user.id)
      }, PRESS_HOLD_MS)
    }
    const onMove = (e: PointerEvent) => {
      if (!start) return
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        console.log('[hero] cancelled by move', dx, dy)
        clearTimer()
        fireLeave()
        start = null
      }
    }
    const makeRelease = (label: string) => (e: PointerEvent) => {
      console.log('[hero]', label, user.id, e.pointerType)
      clearTimer()
      fireLeave()
      start = null
    }
    const onUp = makeRelease('pointerup')
    const onCancel = makeRelease('pointercancel')
    const onLeave = makeRelease('pointerleave')
    const onCtx = (e: MouseEvent) => {
      if (active) e.preventDefault()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('contextmenu', onCtx)

    return () => {
      clearTimer()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      el.removeEventListener('pointerleave', onLeave)
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
        'group relative rounded-md overflow-hidden aspect-[3/4] bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-emerald-950 ring-1 ring-emerald-500/15 will-change-transform transition-[box-shadow,opacity,transform] duration-200',
        isCurrentUser && 'ring-2 ring-lime-300 shadow-[0_0_20px_-4px_rgba(190,242,100,0.6)]',
        !isCurrentUser && !isOver && TEAM_GLOW[slot.team],
        enableDnd && 'cursor-grab active:cursor-grabbing select-none [-webkit-touch-callout:none]',
        !enableDnd && 'select-none [-webkit-touch-callout:none]',
        isDragging && 'opacity-40 scale-95',
        isOver &&
          'ring-2 ring-yellow-300 shadow-[0_0_30px_-2px_rgba(253,224,71,0.7)] scale-[1.03]',
      )}
    >
      <div className="absolute inset-0 bg-radial-spotlight pointer-events-none" />

      {user.photoUrl ? (
        <img
          src={resolveAssetUrl(user.photoUrl)}
          alt={displayName}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover contrast-[1.1] [@media(hover:hover)]:grayscale [@media(hover:hover)]:mix-blend-luminosity group-hover:grayscale-0 group-hover:mix-blend-normal transition-all duration-300 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-graffiti text-5xl text-emerald-200/30 group-hover:text-emerald-200/50 transition-colors">
            {displayName.slice(0, 2)}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {user.preferredNumber != null && (
        <span
          className={cn(
            'absolute top-1.5 right-1.5 font-display text-2xl leading-none font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
            TEAM_NUMBER[slot.team],
          )}
        >
          {user.preferredNumber}
        </span>
      )}

      <span className="absolute top-1.5 left-1.5 text-[10px] font-display tracking-widest text-white/40">
        {String(slot.positionInTeam).padStart(2, '0')}
      </span>

      {enableDnd && (
        <span
          className="absolute top-1.5 left-1/2 -translate-x-1/2 text-white/40 group-hover:text-white/80 transition-colors"
          aria-hidden
        >
          <GripVertical className="size-3.5" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 text-center">
        <p
          className={cn(
            'font-graffiti text-base leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] truncate',
            isCurrentUser ? 'text-lime-300' : 'text-white',
          )}
        >
          {displayName}
        </p>
        {isCurrentUser && (
          <p className="text-[9px] font-display tracking-widest text-lime-300/80 mt-0.5">TÚ</p>
        )}
      </div>

      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none opacity-0"
        style={{
          background:
            slot.team === 'A'
              ? 'radial-gradient(circle at center, rgba(190,242,100,0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(125,211,252,0.6) 0%, transparent 70%)',
        }}
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

  const accent = slot.team === 'A' ? 'text-lime-300/60' : 'text-sky-300/60'

  return (
    <article
      ref={cardRef}
      data-player-card
      className={cn(
        'relative rounded-md overflow-hidden aspect-[3/4] bg-gradient-to-br from-emerald-950/60 via-emerald-950/30 to-black/40 border border-dashed border-emerald-500/15 transition-all duration-200',
        isOver &&
          'border-yellow-300/80 bg-yellow-300/5 shadow-[0_0_30px_-2px_rgba(253,224,71,0.6)] scale-[1.03]',
      )}
    >
      <div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-1.5', accent)}>
        <UserPlus2 className="size-6" />
        <span className="text-[10px] font-display tracking-widest">
          {isOver ? 'SOLTAR AQUÍ' : 'LIBRE'}
        </span>
      </div>
      <span className="absolute top-1.5 left-1.5 text-[10px] font-display tracking-widest text-emerald-200/30">
        {String(slot.positionInTeam).padStart(2, '0')}
      </span>
    </article>
  )
}
