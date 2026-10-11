import { useEffect } from 'react'
import {
  LogOut,
  MapPin,
  Clock,
  Users,
  Loader2,
  Wifi,
  WifiOff,
  TriangleAlert,
  Calendar,
  UserCircle2,
  LayoutDashboard,
  Trophy,
  StickyNote,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InstallButton } from '@/components/install-button'
import { MatchEnrollButton } from '@/components/match-enroll-button'
import { MatchHeroBoard } from '@/components/match-hero-board'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { KickoffTimer } from '@/components/kickoff-timer'
import { UserAvatar } from '@/components/user-avatar'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useMatchRealtime, type RealtimeStatus } from '@/hooks/use-match-realtime'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useActiveMatch } from '@/lib/api-matches'
import { useProfile } from '@/lib/api-profile'
import { isManager } from '@/lib/roles'
import { formatMatchDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const PITCH_DEEP = '#050d09'

export default function PartidoActivo() {
  const user = useCurrentUser()
  const { data: profile } = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: match, isPending, isError, error, refetch } = useActiveMatch()
  const realtimeStatus = useMatchRealtime(match?.id)
  const manager = isManager(user)

  useThemeColor(PITCH_DEEP)

  // Pintamos html+body con el verde oscuro del pitch para que el overscroll de
  // iOS Safari no muestre el blanco del body. Limpiamos al desmontar.
  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor
    const prevBody = document.body.style.backgroundColor
    document.documentElement.style.backgroundColor = PITCH_DEEP
    document.body.style.backgroundColor = PITCH_DEEP
    return () => {
      document.documentElement.style.backgroundColor = prevHtml
      document.body.style.backgroundColor = prevBody
    }
  }, [])

  async function handleLogout() {
    await logout.mutateAsync()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dark min-h-svh bg-pitch-vignette text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              photoUrl={profile?.photoUrl}
              name={profile?.name ?? user?.name}
              className="size-10 rounded-xl"
              fallbackClassName="bg-team-a/15 text-team-a ring-1 ring-team-a/30 text-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl leading-none text-white">
                Próximo partido
              </h1>
              <p className="truncate text-xs text-emerald-100/70">Hola, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <RealtimeIndicator status={realtimeStatus} hidden={!match} />
            <InstallButton
              variant="ghost"
              iconOnlyOnMobile
              className="border-team-a/30 text-emerald-50 hover:bg-team-a/10 hover:text-white"
            />
            {manager && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-emerald-50 hover:bg-team-a/10 hover:text-white"
              >
                <Link to="/admin" title="Volver al panel admin" aria-label="Volver al panel admin">
                  <LayoutDashboard /> <span className="hidden sm:inline">Panel</span>
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-emerald-50 hover:bg-team-a/10 hover:text-white"
            >
              <Link to="/perfil" aria-label="Mi perfil">
                <UserCircle2 /> <span className="hidden sm:inline">Perfil</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="text-emerald-50 hover:bg-team-a/10 hover:text-white"
            >
              <LogOut /> <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {isPending && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-7 animate-spin text-team-a" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/30 bg-black/40 backdrop-blur">
            <CardContent className="space-y-3 py-6 text-sm">
              <p className="font-semibold text-white">No se pudo cargar el partido.</p>
              <p className="text-emerald-100/70">{(error as Error)?.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPending && !isError && !match && (
          <Card className="border-white/10 bg-black/40 backdrop-blur">
            <CardContent className="space-y-3 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-team-a/10 text-team-a">
                <Calendar className="size-7" />
              </div>
              <div>
                <p className="font-semibold text-white">No hay partidos programados</p>
                <p className="text-sm text-emerald-100/70">
                  Cuando el admin cree un partido aparecerá aquí.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {match && (
          <Card className="overflow-hidden border-team-a/20 bg-black/40 backdrop-blur">
            <div className="h-1.5 bg-gradient-to-r from-team-a via-white/70 to-team-b" />
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-team-a/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-team-a/30">
                    <Trophy className="size-3" /> Día de partido
                  </span>
                  <h2 className="flex items-center gap-2 font-display text-2xl uppercase leading-none text-white text-shadow-hero sm:text-3xl">
                    <span className="truncate">{match.place}</span>
                  </h2>
                </div>
                <MatchStatusBadge status={match.status} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-emerald-100/80">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" /> {formatMatchDate(match.dateTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {match.place}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span className="font-bold tabular-nums text-white">
                    {match.registrations.length}
                  </span>{' '}
                  / {match.requiredPlayers} jugadores
                </span>
                {match.status !== 'finished' && match.status !== 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-team-a/30 bg-team-a/10 px-2.5 py-1">
                    <KickoffTimer dateTime={match.dateTime} className="text-[11px] text-team-a" />
                  </span>
                )}
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-team-a to-team-b transition-[width] duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (match.registrations.length / match.requiredPlayers) * 100,
                    )}%`,
                  }}
                />
              </div>

              {match.notes && (
                <p className="flex items-start gap-2 rounded-lg border border-team-a/20 bg-team-a/10 p-3 text-sm text-emerald-50">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-team-a" />
                  {match.notes}
                </p>
              )}

              <MatchEnrollButton match={match} />
            </CardContent>
          </Card>
        )}

        {match && <MatchHeroBoard match={match} currentUserId={user?.id} canReorder={manager} />}
      </main>
    </div>
  )
}

function RealtimeIndicator({
  status,
  hidden,
}: {
  status: RealtimeStatus
  hidden?: boolean
}) {
  if (hidden) return null
  const config = {
    connecting: {
      Icon: Loader2,
      label: 'Conectando',
      className: 'text-emerald-100/70 animate-spin',
    },
    connected: { Icon: Wifi, label: '', className: 'text-team-a' },
    disconnected: { Icon: WifiOff, label: 'Desconectado', className: 'text-destructive' },
    error: { Icon: TriangleAlert, label: 'Error de conexión', className: 'text-destructive' },
  }[status]
  const text = config.label || 'Conectado'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-emerald-100/70"
      role="status"
      title={`Realtime: ${text}`}
      aria-label={`Realtime: ${text}`}
    >
      <config.Icon aria-hidden className={cn('size-3.5', config.className)} />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  )
}
