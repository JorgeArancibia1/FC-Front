import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MousePointerClick, Shuffle } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  PlayerCardHero,
  type PlayerCardDragData,
  type PlayerSlotDropData,
} from '@/components/player-card-hero'
import type { TeamKey, TeamSlot } from '@/lib/teams'
import { buildTeams } from '@/lib/teams'
import { resolveAssetUrl } from '@/lib/assets'
import { useReorderRegistrations, type RegistrationAssignment } from '@/lib/api-matches'
import type { MatchDetail, MatchPlayer } from '@/types/match'
import { cn } from '@/lib/utils'

interface Props {
  match: MatchDetail
  currentUserId?: string
  /** Dev, admin y jugador pueden arrastrar para reordenar los equipos. */
  canReorder?: boolean
  /** Modo inmersivo: cancha de borde a borde y a todo el alto del viewport. */
  fullScreen?: boolean
}

export function MatchHeroBoard({ match, currentUserId, canReorder, fullScreen }: Props) {
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

  // Detección de nuevas llegadas (ver comentario original): los ids "frescos"
  // se calculan en un efecto, nunca durante el render.
  const seenIds = useRef<Set<string>>(new Set())
  const initialMount = useRef(true)
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const currentIds = new Set(match.registrations.map((r) => r.id))
    if (initialMount.current) {
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
        duration: 0.7,
        ease: 'back.out(1.4)',
      },
    )
    return () => {
      tween.kill()
    }
  }, [match.registrations])

  // Pulso del VS
  useGSAP(
    () => {
      const tween = (ref: HTMLSpanElement | null) => {
        if (!ref) return null
        return gsap.to(ref, {
          scale: 1.08,
          duration: 1.6,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
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

  // Refs con el estado más reciente para que el monitor de DnD (registrado una
  // sola vez) lea siempre el layout/mutación actuales sin re-suscribirse.
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  }, [layout])
  const reorderRef = useRef(reorder)
  useEffect(() => {
    reorderRef.current = reorder
  }, [reorder])

  useEffect(() => {
    if (!canReorder) return
    return monitorForElements({
      canMonitor: ({ source }) => source.data.type === 'player-card',
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0]
        if (!target) return
        const sourceData = source.data as unknown as PlayerCardDragData
        const targetData = target.data as unknown as PlayerSlotDropData
        if (sourceData.type !== 'player-card' || targetData.type !== 'player-slot') return

        const from = sourceData.fromPosition
        const to = targetData.position
        if (from === to) return

        const current = layoutRef.current
        const slots = [...current.teamA, ...current.teamB]
        const fromSlot = slots.find((s) => s.position === from)
        const toSlot = slots.find((s) => s.position === to)
        if (!fromSlot || !toSlot) return

        // Intercambio: la tarjeta arrastrada ocupa el slot destino y, si había
        // alguien, esa persona pasa al slot original. Misma lógica de siempre.
        const assignments: RegistrationAssignment[] = []
        if (fromSlot.registration) {
          assignments.push({ registrationId: fromSlot.registration.id, position: to })
        }
        if (toSlot.registration) {
          assignments.push({ registrationId: toSlot.registration.id, position: from })
        }
        if (assignments.length === 0) return
        reorderRef.current.mutate(assignments)
      },
    })
  }, [canReorder])

  // Balancea los equipos al azar: baraja las inscripciones y reparte las
  // primeras posiciones (Equipo A) y el resto (Equipo B). Un solo mutate.
  const handleShuffle = useCallback(() => {
    const players = [...match.registrations]
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[players[i], players[j]] = [players[j], players[i]]
    }
    const assignments: RegistrationAssignment[] = players.map((r, idx) => ({
      registrationId: r.id,
      position: idx + 1,
    }))
    reorder.mutate(assignments)
  }, [match.registrations, reorder])

  return (
    <section
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-pitch-deep/40 backdrop-blur-sm',
        fullScreen
          ? 'flex min-h-[calc(100svh-5rem)] flex-col justify-center px-4 py-6 md:px-8 md:py-10'
          : 'px-4 py-8 md:px-8 md:py-12',
      )}
    >
      {/* Iluminación y textura de estadio */}
      <div className="pointer-events-none absolute inset-0 bg-pitch-glow opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-pitch-stripes opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/[0.06]" />
        <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
      </div>

      <header
        className={cn('relative text-center', fullScreen ? 'mb-4 md:mb-6' : 'mb-6 md:mb-10')}
      >
        <p className="font-display text-xs tracking-[0.45em] text-team-a/70">ELIGE TU LADO</p>
        <h2
          className={cn(
            'font-display leading-none text-white text-shadow-hero',
            fullScreen ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl',
          )}
        >
          La Plantilla
        </h2>
        {canReorder ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-emerald-100/80">
              <MousePointerClick className="size-3.5" />
              Arrastra las tarjetas para reordenar los equipos
            </p>
            <button
              type="button"
              onClick={handleShuffle}
              disabled={reorder.isPending || match.registrations.length < 2}
              className="inline-flex items-center gap-1.5 rounded-full border border-team-a/40 bg-team-a/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-team-a transition-colors hover:bg-team-a/20 disabled:cursor-not-allowed disabled:opacity-50"
              title="Mezcla los jugadores entre los dos equipos al azar"
            >
              <Shuffle className="size-3.5" />
              {reorder.isPending ? 'Repartiendo…' : 'Balancear equipos'}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-emerald-100/60">
            Mantén presionada una tarjeta para ver la foto de cuerpo entero
          </p>
        )}
      </header>

      <div className="relative grid grid-cols-2 items-start gap-3 md:gap-6">
        <TeamColumn
          team="A"
          slots={layout.teamA}
          slotsPerTeam={layout.slotsPerTeam}
          currentUserId={currentUserId}
          newIds={newIds}
          enableDnd={canReorder}
          fullScreen={fullScreen}
          onHeroEnter={handleHeroEnter}
          onHeroLeave={handleHeroLeave}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
          aria-hidden
        >
          <span
            ref={vsRef}
            className="inline-block font-display text-6xl text-white text-shadow-hero"
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
          fullScreen={fullScreen}
          onHeroEnter={handleHeroEnter}
          onHeroLeave={handleHeroLeave}
        />
      </div>

      <HeroReveal selection={selection} isCurrentUser={selection?.player.id === currentUserId} />

      <div className="my-4 flex justify-center md:hidden">
        <span
          ref={vsMobileRef}
          className="inline-block font-display text-4xl text-white text-shadow-hero"
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
  fullScreen,
  onHeroEnter,
  onHeroLeave,
}: {
  team: TeamKey
  slots: TeamSlot[]
  slotsPerTeam: number
  currentUserId?: string
  newIds: Set<string>
  enableDnd?: boolean
  fullScreen?: boolean
  onHeroEnter?: (userId: string) => void
  onHeroLeave?: (userId: string) => void
}) {
  const occupied = slots.filter((s) => s.registration).length
  const isTeamA = team === 'A'

  return (
    <div className="space-y-3 md:space-y-4">
      <header className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-xl',
              isTeamA ? 'bg-team-a text-team-a-foreground' : 'bg-team-b text-team-b-foreground',
            )}
          >
            {team}
          </span>
          <span className="truncate text-sm font-bold text-white">
            Equipo <span className="hidden sm:inline">{isTeamA ? 'A' : 'B'}</span>
          </span>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            isTeamA ? 'bg-team-a/15 text-team-a' : 'bg-team-b/15 text-team-b',
          )}
        >
          {occupied}/{slotsPerTeam}
        </span>
      </header>

      <div
        className={cn(
          'grid gap-2 md:gap-3',
          fullScreen ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2',
        )}
      >
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
        'relative size-full overflow-hidden rounded-2xl ring-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]',
        'bg-[radial-gradient(circle_at_center,#0d1f14_0%,#050d09_70%,#000_100%)]',
        isTeamA ? 'ring-team-a/70' : 'ring-team-b/70',
        isCurrentUser && 'ring-team-a shadow-[0_0_50px_-10px_var(--team-a)]',
      )}
    >
      <img
        key={player.id}
        src={heroSrc}
        alt={displayName}
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full animate-in object-cover object-center fade-in duration-300"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent" />
      {number != null && (
        <span
          className={cn(
            'absolute right-3 top-2 font-display text-5xl leading-none',
            isTeamA ? 'text-team-a' : 'text-team-b',
          )}
        >
          {number}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 text-center">
        <p
          className={cn(
            'truncate font-display text-3xl uppercase leading-none',
            isTeamA ? 'text-team-a' : 'text-team-b',
          )}
        >
          {displayName}
        </p>
        {player.lastName && (
          <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-white/60">
            {fullName}
          </p>
        )}
        {isCurrentUser && (
          <span className="mt-2 inline-block rounded-full bg-team-a px-2 py-0.5 text-[10px] font-black tracking-widest text-team-a-foreground">
            TÚ
          </span>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed top-1/2 z-30 hidden w-56 -translate-y-1/2 md:block lg:w-64',
          'aspect-[9/16]',
          isTeamA ? 'left-4 lg:left-8' : 'right-4 lg:right-8',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        aria-hidden
      >
        {card}
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200 md:hidden"
        aria-hidden
      >
        <div className="aspect-[9/16] w-full max-w-[260px] animate-in zoom-in-95 duration-200">
          {card}
        </div>
      </div>
    </>
  )
}
