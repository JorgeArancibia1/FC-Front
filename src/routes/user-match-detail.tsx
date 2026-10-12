import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Goal, Info, MapPin, Ticket, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState, PageLoader } from '@/components/ui/feedback'
import { MatchPlantilla } from '@/components/match-plantilla'
import { MatchEnrollButton } from '@/components/match-enroll-button'
import { KickoffTimer } from '@/components/kickoff-timer'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { InviteFriendsDialog } from '@/components/invite-friends-dialog'
import { useCurrentUser } from '@/hooks/use-auth'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { useCreateInvite } from '@/lib/api-invites'
import { useMatch } from '@/lib/api-matches'
import { formatMatchDate } from '@/lib/format'
import { isAdmin } from '@/lib/roles'

export default function UserMatchDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useCurrentUser()
  const { data, isPending, isError, error } = useMatch(id)
  const [inviteOpen, setInviteOpen] = useState(false)
  const createInvite = useCreateInvite()
  useMatchRealtime(id)

  if (!id) return <Navigate to="/partidos" replace />

  const enrolled = !!data?.registrations.some((r) => r.userId === user?.id)
  const canInvite = enrolled || isAdmin(user)
  // Dev, admin y jugador pueden arrastrar las tarjetas para reordenar equipos.
  const canReorder = true

  // Abrir el diálogo es el evento que genera la invitación (no un useEffect
  // dentro del diálogo: con StrictMode el status de la mutación se queda en
  // "pending" y la UI nunca muestra el link — TanStack/query#9068).
  function openInvite() {
    setInviteOpen(true)
    if (id) createInvite.mutate(id)
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/partidos">
          <ArrowLeft /> Volver a partidos
        </Link>
      </Button>

      {isPending && <PageLoader label="Cargando partido…" />}

      {isError && (
        <ErrorState
          title="No se pudo cargar el partido"
          description={(error as Error)?.message ?? 'Error al cargar el partido'}
        />
      )}

      {data && (
        <>
          {/* Ficha del partido — marcador de estadio */}
          <section className="dark relative overflow-hidden rounded-2xl border border-white/10 bg-pitch-vignette text-white shadow-lg ring-1 ring-black/20">
            <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-60" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-40" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />
            <div className="relative space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-white/15 backdrop-blur-sm">
                  <Goal className="size-3.5" /> Detalle del partido
                </span>
                <MatchStatusBadge
                  status={data.status}
                  className="border-white/20 bg-black/30 backdrop-blur-sm"
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-display text-3xl uppercase leading-none text-shadow-hero sm:text-4xl">
                  {data.place}
                </h2>
                <p className="mt-1.5 text-sm text-white/70">Creado por {data.createdBy.name}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" /> {formatMatchDate(data.dateTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {data.place}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" /> {data.registrations.length} / {data.requiredPlayers}{' '}
                  jugadores
                </span>
                {data.status !== 'finished' && data.status !== 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 backdrop-blur-sm">
                    <KickoffTimer dateTime={data.dateTime} className="text-[11px] text-white/90" />
                  </span>
                )}
              </div>

              {/* Cupo de la plantilla */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/75">
                  <span>Cupo de la plantilla</span>
                  <span>
                    {Math.max(0, data.requiredPlayers - data.registrations.length)}{' '}
                    {Math.max(0, data.requiredPlayers - data.registrations.length) === 1
                      ? 'cupo libre'
                      : 'cupos libres'}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-team-a to-team-b transition-[width] duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (data.registrations.length / Math.max(1, data.requiredPlayers)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {data.notes && (
                <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85">
                  <Info className="mt-0.5 size-4 shrink-0 text-team-a" />
                  <span className="whitespace-pre-line">{data.notes}</span>
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <MatchEnrollButton match={data} />
                </div>
                {canInvite && (
                  <Button
                    variant="outline"
                    onClick={openInvite}
                    className="border-white/20 bg-black/30 text-white hover:border-team-a/60 hover:bg-black/40 hover:text-white"
                  >
                    <Ticket /> Invitar amigos
                  </Button>
                )}
                {!canInvite && !isAdmin(user) && (
                  <Button
                    variant="outline"
                    onClick={openInvite}
                    title="Inscríbete para generar un link o código de invitación"
                    className="border-white/20 bg-black/30 text-white hover:border-team-a/60 hover:bg-black/40 hover:text-white"
                  >
                    <Ticket /> Invitar amigos
                  </Button>
                )}
                <AddToCalendarButton
                  match={data}
                  className="border-white/20 bg-black/30 text-white hover:border-team-a/60 hover:bg-black/40 hover:text-white"
                />
              </div>
            </div>
          </section>

          {!enrolled && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5" /> Al pulsar "Invitar amigos", si aún no estás inscrito, el sistema te inscribirá automáticamente para generar el link o código.
            </p>
          )}

          <MatchPlantilla match={data} currentUserId={user?.id} canReorder={canReorder} />
        </>
      )}

      {inviteOpen && data && (
        <InviteFriendsDialog
          matchId={data.id}
          matchPlace={data.place}
          create={createInvite}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  )
}