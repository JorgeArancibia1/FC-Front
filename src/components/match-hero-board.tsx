import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  PlayerCardHero,
  type PlayerCardDragData,
  type PlayerSlotDropData,
} from '@/components/player-card-hero'
import { buildTeams, type TeamKey, type TeamSlot } from '@/lib/teams'
import { useReorderRegistrations, type RegistrationAssignment } from '@/lib/api-matches'
import { resolveAssetUrl } from '@/lib/assets'
import type { MatchDetail, MatchPlayer } from '@/types/match'
import { cn } from '@/lib/utils'

interface Props {
  match: MatchDetail
  currentUserId?: string
  canReorder?: boolean
}

export function MatchHeroBoard({ match, currentUserId, canReorder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vsRef = useRef<HTMLSpanElement>(null)
  const vsMobileRef = useRef<HTMLSpanElement>(null)
  const reorder = useReorderRegistrations(match.id)

  const layout = useMemo(
    () => buildTeams(match.registrations, match.requiredPlayers),
    [match.registrations, match.requiredPlayers],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selection = useMemo<{ player: MatchPlayer; team: TeamKey } | null>(() => {
    if (!selectedId) return null
    const inA = layout.teamA.find((s) => s.registration?.user.id === selectedId)
    if (inA?.registration) return { player: inA.registration.user, team: 'A' }
    const inB = layout.teamB.find((s) => s.registration?.user.id === selectedId)
    if (inB?.registration) return { player: inB.registration.user, team: 'B' }
    return null
  }, [selectedId, layout])

  const handleHeroEnter = useCallback((id: string) => setSelectedId(id), [])
  const handleHeroLeave = useCallback(
    (id: string) => setSelectedId((cur) => (cur === id ? null : cur)),
    [],
  )

  // Detección de nuevas llegadas: los ids "frescos" se calculan en un efecto,
  // nunca durante el render (StrictMode renderiza doble en dev y las mutaciones
  // de las refs dentro del useMemo hacían que la animación de llegada nunca
  // disparara: al segundo render el id ya estaba "visto").
  const seenIds = useRef<Set<string>>(new Set())
  const initialMount = useRef(true)
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const currentIds = new Set(match.registrations.map((r) => r.id))
    if (initialMount.current) {
      // Primer render: todo lo que ya está inscripto es "viejo".
      initialMount.current = false
      seenIds.current = currentIds
      return
    }
    const fresh = new Set<string>()
    for (const id of currentIds) {
      if (!seenIds.current.has(id)) fresh.add(id)
    }
    seenIds.current = currentIds
    setNewIds(fresh)
  }, [match.registrations])

  // Stagger inicial
  useEffect(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('[data-player-card]')
    if (cards.length === 0) return
    const tween = gsap.fromTo(
      cards,
      { opacity: 0, scale: 0.75, y: 28, rotationX: -20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotationX: 0,
        stagger: { each: 0.04, from: 'start' },
        duration: 0.65,
        ease: 'back.out(1.4)',
      },
    )
    return () => {
      tween.kill()
    }
  }, [match.id])

  // VS pulsante
  useGSAP(
    () => {
      const tween = (el: Element | null) => {
        if (!el) return null
        return gsap.to(el, {
          scale: 1.12,
          rotation: '+=4',
          duration: 1.2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          transformOrigin: 'center center',
        })
      }
      const t1 = tween(vsRef.current)
      const t2 = tween(vsMobileRef.current)
      return () => {
        t1?.kill()
        t2?.kill()
      }
    },
    { scope: containerRef },
  )

  // Monitor DnD: drop a slot (vacío u ocupado). Swap si ocupado, move si vacío.
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  })
  const reorderRef = useRef(reorder)
  useEffect(() => {
    reorderRef.current = reorder
  })

  useEffect(() => {
    if (!canReorder) return
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0]
        if (!target) return
        const sourceData = source.data as unknown as PlayerCardDragData
        const targetData = target.data as unknown as PlayerSlotDropData
        if (sourceData.type !== 'player-card' || targetData.type !== 'player-slot') return
        if (sourceData.fromPosition === targetData.position) return

        const { teamA, teamB } = layoutRef.current
        const allSlots = [...teamA, ...teamB]
        const targetSlot = allSlots.find((s) => s.position === targetData.position)
        if (!targetSlot) return

        const assignments: RegistrationAssignment[] = [
          { registrationId: sourceData.registrationId, position: targetData.position },
        ]
        // Si el target estaba ocupado, swap (el ocupante va a la posición del source).
        if (targetSlot.registration) {
          assignments.push({
            registrationId: targetSlot.registration.id,
            position: sourceData.fromPosition,
          })
        }

        reorderRef.current.mutate(assignments)
      },
    })
  }, [canReorder])

  return (
    <section
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-emerald-500/15 bg-black/20 backdrop-blur-sm px-4 py-8 md:px-8 md:py-12 overscroll-contain"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]" aria-hidden>
        <div className="absolute inset-y-0 left-1/2 w-px bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full border border-white" />
      </div>

      <header className="relative text-center mb-6 md:mb-10">
        <p className="font-display text-xs tracking-[0.4em] text-emerald-300/70 mb-1">
          ELIGE TU LADO
        </p>
        <h2 className="font-graffiti text-3xl md:text-5xl text-lime-300 drop-shadow-[0_2px_8px_rgba(132,204,22,0.4)]">
          La plantilla
        </h2>
        {canReorder && (
          <p className="text-xs text-emerald-300/70 mt-2">
            Arrastra una tarjeta a cualquier slot (vacío u ocupado) para reordenar.
          </p>
        )}
      </header>

      <div className="relative grid grid-cols-2 gap-3 md:gap-6 items-start">
        <TeamColumn
          team="A"
          slots={layout.teamA}
          slotsPerTeam={layout.slotsPerTeam}
          currentUserId={currentUserId}
          newIds={newIds}
          enableDnd={canReorder}
          onHeroEnter={handleHeroEnter}
          onHeroLeave={handleHeroLeave}
        />

        <div
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          aria-hidden
        >
          <span
            ref={vsRef}
            className="font-graffiti text-6xl text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.6)] inline-block"
            style={{ transform: 'rotate(-6deg)' }}
          >
            VS
          </span>
        </div>

        <TeamColumn
          team="B"
          slots={layout.teamB}
          slotsPerTeam={match.requiredPlayers - layout.slotsPerTeam}
          currentUserId={currentUserId}
          newIds={newIds}
          enableDnd={canReorder}
          onHeroEnter={handleHeroEnter}
          onHeroLeave={handleHeroLeave}
        />
      </div>

      <HeroReveal selection={selection} isCurrentUser={selection?.player.id === currentUserId} />

      <div className="md:hidden flex justify-center my-4">
        <span
          ref={vsMobileRef}
          className="font-graffiti text-4xl text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] inline-block"
          style={{ transform: 'rotate(-4deg)' }}
        >
          VS
        </span>
      </div>
    </section>
  )
}

function TeamColumn({
  team,
  slots,
  slotsPerTeam,
  currentUserId,
  newIds,
  enableDnd,
  onHeroEnter,
  onHeroLeave,
}: {
  team: TeamKey
  slots: TeamSlot[]
  slotsPerTeam: number
  currentUserId?: string
  newIds: Set<string>
  enableDnd?: boolean
  onHeroEnter?: (userId: string) => void
  onHeroLeave?: (userId: string) => void
}) {
  const accent = team === 'A' ? 'text-lime-300' : 'text-sky-300'
  const occupied = slots.filter((s) => s.registration).length

  return (
    <div className="space-y-3 md:space-y-4">
      <header className="text-center mb-1">
        <p className={cn('font-display text-xs tracking-[0.3em] opacity-70', accent)}>EQUIPO</p>
        <p
          className={cn(
            'font-graffiti text-4xl md:text-5xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]',
            accent,
          )}
        >
          {team}
        </p>
        <p className={cn('text-xs font-medium', accent, 'opacity-80')}>
          {occupied} / {slotsPerTeam} jugadores
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {slots.map((slot) => (
          <PlayerCardHero
            key={slot.position}
            slot={slot}
            isCurrentUser={slot.registration?.userId === currentUserId}
            isNewArrival={slot.registration ? newIds.has(slot.registration.id) : false}
            enableDnd={enableDnd}
            onHeroEnter={onHeroEnter}
            onHeroLeave={onHeroLeave}
          />
        ))}
      </div>
    </div>
  )
}

function HeroReveal({
  selection,
  isCurrentUser,
}: {
  selection: { player: MatchPlayer; team: TeamKey } | null
  isCurrentUser: boolean
}) {
  if (!selection) return null
  const { player, team } = selection
  const heroSrc = resolveAssetUrl(player.heroPhotoUrl) ?? '/hero-silhouette.svg'
  const displayName = player.jerseyName || player.name
  const fullName = [player.name, player.lastName].filter(Boolean).join(' ')
  const number = player.preferredNumber
  const isTeamA = team === 'A'

  const card = (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl overflow-hidden',
        'ring-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]',
        'bg-[radial-gradient(circle_at_center,#0d1f14_0%,#050d09_70%,#000_100%)]',
        isTeamA ? 'ring-lime-300/70' : 'ring-sky-300/70',
        isCurrentUser && 'ring-lime-300 shadow-[0_0_50px_-10px_rgba(190,242,100,0.7)]',
      )}
    >
      <img
        key={player.id}
        src={heroSrc}
        alt={displayName}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in duration-300 pointer-events-none"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      {number != null && (
        <span
          className={cn(
            'absolute top-3 right-3 font-display text-4xl md:text-5xl leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]',
            isTeamA ? 'text-lime-300' : 'text-sky-300',
          )}
        >
          #{String(number).padStart(2, '0')}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 text-center">
        <p
          className={cn(
            'font-graffiti text-2xl md:text-3xl tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] uppercase leading-tight',
            isTeamA ? 'text-lime-300' : 'text-sky-300',
          )}
        >
          {displayName}
        </p>
        {player.lastName && (
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mt-1 truncate">
            {fullName}
          </p>
        )}
        {isCurrentUser && (
          <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-lime-300 text-emerald-950">
            TÚ
          </span>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: panel lateral fijo, izquierda o derecha según equipo */}
      <div
        className={cn(
          'hidden md:block fixed top-1/2 -translate-y-1/2 z-40 pointer-events-none',
          'w-[260px] lg:w-[320px] aspect-[9/16]',
          isTeamA ? 'left-4 lg:left-8' : 'right-4 lg:right-8',
          'animate-in fade-in zoom-in-95 duration-200',
          isTeamA ? 'slide-in-from-left-4' : 'slide-in-from-right-4',
        )}
        aria-hidden
      >
        {card}
      </div>

      {/* Mobile: modal centrado */}
      <div
        className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-8 pointer-events-none animate-in fade-in duration-200"
        aria-hidden
      >
        <div className="w-full max-w-[260px] aspect-[9/16] animate-in zoom-in-95 duration-200">
          {card}
        </div>
      </div>
    </>
  )
}
