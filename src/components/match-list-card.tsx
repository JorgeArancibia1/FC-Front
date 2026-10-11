import { Link } from 'react-router-dom'
import { CalendarDays, Goal, Ticket, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { KickoffTimer } from '@/components/kickoff-timer'
import { formatMatchDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MatchListItem } from '@/types/match'

interface Props {
  match: MatchListItem
  to: string
  /** Muestra el botón para invitar amigos (solo si el usuario puede). */
  onInvite?: () => void
  /** El usuario está inscrito: cambia el texto del botón. */
  enrolled?: boolean
}

export function MatchListCard({ match, to, onInvite, enrolled }: Props) {
  const registered = match._count.registrations
  const pct = Math.min(100, (registered / Math.max(1, match.requiredPlayers)) * 100)
  const full = registered >= match.requiredPlayers
  const free = Math.max(0, match.requiredPlayers - registered)

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md',
        enrolled ? 'border-team-a/40 hover:border-team-a/60' : 'border-border/70 hover:border-primary/30',
      )}
    >
      {/* Franja lateral: césped normal, degradado A→B si ya estás inscrito */}
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1.5',
          enrolled ? 'bg-gradient-to-b from-team-a to-team-b' : 'bg-grass',
        )}
        aria-hidden
      />
      <CardContent className="space-y-3 p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={to}
              className="flex items-center gap-1.5 text-base font-bold hover:text-primary"
            >
              <Goal className="size-4 shrink-0 text-primary" />
              <span className="truncate">{match.place}</span>
            </Link>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" /> {formatMatchDate(match.dateTime)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                <span className="font-bold tabular-nums text-foreground">{registered}</span>/
                {match.requiredPlayers} jugadores
              </span>
              {match.status !== 'finished' && match.status !== 'cancelled' && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <KickoffTimer dateTime={match.dateTime} format="short" />
                </span>
              )}
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>

        {/* Barra de cupo: verde cuando hay lugar, ámbar cuando está lleno */}
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                full ? 'bg-warning' : 'bg-gradient-to-r from-primary to-team-a',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {full ? 'Cupo completo' : `${free} ${free === 1 ? 'lugar libre' : 'lugares libres'}`}
            {enrolled && <span className="text-primary"> · estás anotado</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant={enrolled ? 'default' : 'outline'} className="flex-1">
            <Link to={to}>{enrolled ? 'Ver mi partido' : 'Ver detalle'}</Link>
          </Button>
          {onInvite && (
            <Button size="sm" variant="outline" onClick={onInvite}>
              <Ticket /> Invitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
