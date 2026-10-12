import { Link } from 'react-router-dom'
import {
  Calendar,
  Users,
  ArrowRight,
  PlaySquare,
  Clock,
  Trophy,
  Activity,
  UserCheck,
  CalendarPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback'
import { MatchEnrollButton } from '@/components/match-enroll-button'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { KickoffTimer } from '@/components/kickoff-timer'
import { useActiveMatch, useMatches } from '@/lib/api-matches'
import { useUsers } from '@/lib/api-users'
import { useCurrentUser } from '@/hooks/use-auth'
import { isAdmin } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'
import { formatMatchDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const matches = useMatches()
  const users = useUsers({ scope: 'invited' })
  const activeMatch = useActiveMatch()
  const currentUser = useCurrentUser()
  const admin = isAdmin(currentUser)

  const totalMatches = matches.data?.length ?? 0
  const activeMatchesCount =
    matches.data?.filter((m) => m.status === 'open' || m.status === 'closed').length ?? 0
  const activeUsersCount = users.data?.filter((u) => u.status !== 'eliminado').length ?? 0
  const registeredPlayersCount =
    matches.data?.reduce((acc, m) => acc + m._count.registrations, 0) ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Trophy}
        title="Inicio"
        description="Resumen del club y accesos rápidos."
        actions={
          admin ? (
            <Button asChild>
              <Link to="/admin/partidos/nuevo">
                <CalendarPlus /> Nuevo partido
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Próximo partido */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Trophy className="size-4 text-primary" /> Próximo partido
        </h2>

        {activeMatch.isPending && <Skeleton className="h-44 w-full rounded-xl" />}

        {activeMatch.isError && (
          <ErrorState
            title="No se pudo cargar el próximo partido"
            description={getApiErrorMessage(activeMatch.error)}
            onRetry={() => activeMatch.refetch()}
          />
        )}

        {!activeMatch.isPending && !activeMatch.isError && !activeMatch.data && (
          <EmptyState
            icon={Calendar}
            title="No hay partidos programados"
            description="Cuando se cree un partido aparecerá aquí con su estado e inscripciones."
            action={
              admin ? (
                <Button asChild>
                  <Link to="/admin/partidos/nuevo">
                    <CalendarPlus /> Crear partido
                  </Link>
                </Button>
              ) : undefined
            }
          />
        )}

        {activeMatch.data && (
          <section className="dark relative overflow-hidden rounded-2xl border border-white/10 bg-pitch-vignette text-white shadow-lg ring-1 ring-black/20">
            <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-60" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-40" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />
            <div className="relative space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-white/15 backdrop-blur-sm">
                    <Trophy className="size-3.5" /> Próximo partido
                  </span>
                  <h3 className="mt-2 font-display text-3xl uppercase leading-none text-shadow-hero sm:text-4xl">
                    {activeMatch.data.place}
                  </h3>
                </div>
                <MatchStatusBadge
                  status={activeMatch.data.status}
                  className="border-white/20 bg-black/30 backdrop-blur-sm"
                />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" /> {formatMatchDate(activeMatch.data.dateTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  {activeMatch.data.registrations.length} / {activeMatch.data.requiredPlayers}{' '}
                  jugadores
                </span>
                {activeMatch.data.status !== 'finished' &&
                  activeMatch.data.status !== 'cancelled' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 backdrop-blur-sm">
                      <KickoffTimer
                        dateTime={activeMatch.data.dateTime}
                        className="text-[11px] text-white/90"
                      />
                    </span>
                  )}
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-team-a to-team-b transition-[width] duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeMatch.data.registrations.length /
                        Math.max(1, activeMatch.data.requiredPlayers)) *
                        100,
                    )}%`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <MatchEnrollButton match={activeMatch.data} />
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-black/40 text-white hover:border-team-a/60 hover:bg-black/60 hover:text-white"
                >
                  <Link to={`/admin/partidos/${activeMatch.data.id}`}>
                    <Activity /> Ver plantilla
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* Indicadores */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Indicadores
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Trophy}
            label="Partidos totales"
            value={totalMatches}
            loading={matches.isPending}
            accent="text-primary"
          />
          <StatCard
            icon={Activity}
            label="Partidos activos"
            value={activeMatchesCount}
            loading={matches.isPending}
            accent="text-team-b"
          />
          <StatCard
            icon={UserCheck}
            label="Usuarios registrados"
            value={activeUsersCount}
            loading={users.isPending}
            accent="text-violet-500"
          />
          <StatCard
            icon={Users}
            label="Jugadores inscritos"
            value={registeredPlayersCount}
            loading={matches.isPending}
            accent="text-team-a"
          />
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {admin && (
            <QuickCard
              to="/admin/partidos/nuevo"
              icon={CalendarPlus}
              title="Crear partido"
              description="Programa un nuevo encuentro con cupos y notas."
              primary
            />
          )}
          <QuickCard
            to="/admin/partidos"
            icon={Calendar}
            title="Administrar partidos"
            description="Edita, cancela o consulta los partidos del club."
          />
          <QuickCard
            to="/admin/usuarios"
            icon={Users}
            title="Administrar usuarios"
            description="Roles, estados y datos de los jugadores."
          />
          <QuickCard
            to="/inicio"
            icon={PlaySquare}
            title="Vista del jugador"
            description="Explora los partidos y la plantilla en vivo."
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: number
  loading?: boolean
  accent?: string
}) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <span className="absolute inset-x-0 top-0 h-0.5 grass-underline opacity-70" aria-hidden />
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10',
            accent,
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-7 w-12" />
          ) : (
            <p className="text-2xl font-black tabular-nums leading-tight transition-colors group-hover:text-primary">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickCard({
  to,
  icon: Icon,
  title,
  description,
  primary,
}: {
  to: string
  icon: LucideIcon
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
        primary ? 'border-primary/40 hover:border-primary' : 'border-border/70 hover:border-primary/40',
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-2xl transition-colors',
            primary
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary group-hover:bg-primary/15',
          )}
        >
          <Icon className="size-5" />
        </div>
        <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
