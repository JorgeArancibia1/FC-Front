import { CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { formatMatchDate } from '@/lib/format'
import type { InviteMatchInfo } from '@/types/invite'

export function InviteMatchCard({ match }: { match: InviteMatchInfo }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-grass" aria-hidden />
      <div className="h-1.5 bg-gradient-to-r from-primary via-team-a to-team-b" />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 font-display text-2xl uppercase leading-none">
            <Trophy className="size-5 shrink-0 text-gold" />
            <span className="truncate">{match.place}</span>
          </h2>
          <MatchStatusBadge status={match.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" /> {formatMatchDate(match.dateTime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {match.place}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" />
            <span className="font-bold tabular-nums text-foreground">{match.registeredCount}</span> /{' '}
            {match.requiredPlayers} jugadores
          </span>
        </div>
        {match.notes && (
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">{match.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
