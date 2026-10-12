import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, CalendarDays, Goal, Shirt, Ticket, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MatchListCard } from '@/components/match-list-card'
import { KickoffTimer } from '@/components/kickoff-timer'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { OnboardingChecklist } from '@/components/onboarding-checklist'
import { InviteFriendsDialog } from '@/components/invite-friends-dialog'
import { ErrorState, PageLoader } from '@/components/ui/feedback'
import { useCurrentUser } from '@/hooks/use-auth'
import { useCreateInvite } from '@/lib/api-invites'
import { useMatches, useMyMatches } from '@/lib/api-matches'
import { useProfile } from '@/lib/api-profile'
import { formatMatchDate } from '@/lib/format'
import { isAdmin } from '@/lib/roles'
import type { MatchListItem } from '@/types/match'

function isUpcoming(match: MatchListItem): boolean {
  return new Date(match.dateTime).getTime() >= Date.now() && match.status !== 'cancelled'
}

export default function UserHome() {
  const user = useCurrentUser()
  const admin = isAdmin(user)
  const mine = useMyMatches()
  const all = useMatches()
  const { data: profile } = useProfile()
  const [inviteMatch, setInviteMatch] = useState<MatchListItem | null>(null)
  const createInvite = useCreateInvite()

  // La invitación se genera en el click que abre el diálogo, no en un useEffect
  // interno: con React StrictMode esa mutación queda con el status en "pending"
  // para siempre y nunca se muestra el link (TanStack/query#9068).
  function openInvite(match: MatchListItem) {
    setInviteMatch(match)
    createInvite.mutate(match.id)
  }

  const myMatches = mine.data ?? []
  const enrolledIds = new Set(myMatches.map((m) => m.id))
  const nextMatch = myMatches.filter(isUpcoming)[0] ?? null
  const openMatches = (all.data ?? [])
    .filter((m) => m.status === 'open' && isUpcoming(m) && !enrolledIds.has(m.id))
    .slice(0, 6)

  const firstName = (user?.name ?? '').split(' ')[0] || 'jugador'

  const registered = nextMatch?._count.registrations ?? 0
  const required = nextMatch?.requiredPlayers ?? 0
  const pct = Math.min(100, (registered / Math.max(1, required)) * 100)
  const free = Math.max(0, required - registered)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">¡Hola, {firstName}!</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Este es tu resumen de partidos en Gol FC.
          </p>
        </div>
        {admin && (
          <Button asChild>
            <Link to="/admin/partidos/nuevo">
              <CalendarPlus /> Crear partido
            </Link>
          </Button>
        )}
      </div>

      {/* Onboarding: primeros pasos para completar el perfil */}
      {profile && (
        <OnboardingChecklist
          photoDone={!!profile.photoUrl}
          jerseyDone={!!profile.jerseyName}
          numberDone={profile.preferredNumber != null}
          matchDone={myMatches.length > 0}
        />
      )}

      {/* Próximo partido — tablero de estadio */}
      {nextMatch && (
        <section className="relative overflow-hidden rounded-2xl bg-pitch-vignette text-white shadow-lg ring-1 ring-black/20 animate-scale-in hover-lift">
          <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-60" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-40" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />
          <div className="relative space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-white/15 backdrop-blur-sm">
                <Goal className="size-3.5" /> Próximo partido
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
                  <CalendarDays className="size-3.5" /> {formatMatchDate(nextMatch.dateTime)}
                </span>
                <KickoffTimer
                  dateTime={nextMatch.dateTime}
                  className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/85 ring-1 ring-white/15 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl uppercase leading-none text-shadow-hero sm:text-4xl">
                {nextMatch.place}
              </h2>
              {nextMatch.notes && (
                <p className="mt-1.5 text-sm text-white/75">{nextMatch.notes}</p>
              )}
            </div>

            {/* Números de ficha */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Inscritos
                </p>
                <p className="mt-0.5 font-black tabular-nums leading-none">
                  {registered}
                  <span className="text-sm font-semibold text-white/60"> / {required}</span>
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Cupos libres
                </p>
                <p className="mt-0.5 font-black tabular-nums leading-none">
                  {free}
                  <span className="text-sm font-semibold text-white/60">
                    {' '}{free === 1 ? 'plaza' : 'plazas'}
                  </span>
                </p>
              </div>
            </div>

            {/* Cupo */}
            <div className="space-y-1.5">
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-team-a to-team-b transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" /> Jugadores confirmados
                </span>
                <span className="tabular-nums">{pct.toFixed(0)}% del cupo</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="secondary" size="sm" className="flex-1">
                <Link to={`/partidos/${nextMatch.id}`}>
                  Ver mi partido <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInvite(nextMatch)}
                className="border-white/20 bg-black/30 text-white hover:border-team-a/60 hover:bg-black/50 hover:text-white"
              >
                <Ticket /> Invitar amigos
              </Button>
              <AddToCalendarButton
                match={nextMatch}
                className="border-white/20 bg-black/30 text-white hover:border-team-a/60 hover:bg-black/50 hover:text-white"
              />
            </div>
          </div>
        </section>
      )}

      {/* Mis partidos */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Shirt className="size-5 text-primary" /> Mis partidos
        </h2>
        {mine.isPending && <PageLoader label="Cargando tus partidos…" />}
        {mine.isError && (
          <ErrorState
            title="No se pudieron cargar tus partidos"
            description={(mine.error as Error)?.message}
          />
        )}
        {!mine.isPending && !mine.isError && myMatches.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no estás inscrito en ningún partido. Explora los partidos abiertos abajo.
            </p>
          </div>
        )}
        {myMatches.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {myMatches.map((m, i) => (
              <div key={m.id} className="stagger-item" style={{ animationDelay: `${i * 100}ms` }}>
                <MatchListCard
                  match={m}
                  to={`/partidos/${m.id}`}
                  enrolled
                  onInvite={() => openInvite(m)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Partidos abiertos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Goal className="size-5 text-primary" /> Partidos abiertos
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/partidos">Ver todos</Link>
          </Button>
        </div>
        {all.isPending && <PageLoader label="Cargando partidos…" />}
        {all.isError && (
          <ErrorState
            title="No se pudieron cargar los partidos"
            description={(all.error as Error)?.message}
          />
        )}
        {!all.isPending && !all.isError && openMatches.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No hay partidos abiertos por ahora. Vuelve más tarde.
            </p>
          </div>
        )}
        {openMatches.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {openMatches.map((m, i) => (
              <div key={m.id} className="stagger-item" style={{ animationDelay: `${i * 100}ms` }}>
                <MatchListCard match={m} to={`/partidos/${m.id}`} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5">
        <span className="absolute inset-x-0 top-0 h-1 grass-underline" aria-hidden />
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Trophy className="size-5" />
          </span>
          <div>
            <h3 className="font-bold">Invita a tus amigos</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Abre cualquiera de tus partidos y usa <strong>Invitar</strong> para compartir un link o
              un código de 6 dígitos. También puedes pedirle un código a quien te invite.
            </p>
          </div>
        </div>
      </section>

      {inviteMatch && (
        <InviteFriendsDialog
          matchId={inviteMatch.id}
          matchPlace={inviteMatch.place}
          create={createInvite}
          onClose={() => setInviteMatch(null)}
        />
      )}
    </div>
  )
}
