import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchEnrollButton } from '@/components/match-enroll-button'
import { TeamRoster } from '@/components/team-roster'
import { buildTeams } from '@/lib/teams'
import type { MatchDetail, MatchRegistration } from '@/types/match'

interface Props {
  match: MatchDetail
  currentUserId?: string
  /** Muestra el botón de inscribirse/desinscribirse. */
  showEnroll?: boolean
}

/** Plantilla del partido: equipos A/B + cupos disponibles. Compartida por admin y jugador. */
export function MatchRosterCard({ match, currentUserId, showEnroll = true }: Props) {
  const { teamA, teamB, slotsPerTeam } = buildTeams(match.registrations, match.requiredPlayers)
  const playersA = teamA.map((s) => s.registration).filter(Boolean) as MatchRegistration[]
  const playersB = teamB.map((s) => s.registration).filter(Boolean) as MatchRegistration[]
  const slotsB = match.requiredPlayers - slotsPerTeam

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5 text-primary" />
          Plantilla ({match.registrations.length} / {match.requiredPlayers})
        </CardTitle>
        <CardDescription>Jugadores inscritos en este partido.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showEnroll && <MatchEnrollButton match={match} />}
        <div className="grid gap-3 md:grid-cols-2">
          <TeamRoster
            team="A"
            players={playersA}
            capacity={slotsPerTeam}
            currentUserId={currentUserId}
          />
          <TeamRoster
            team="B"
            players={playersB}
            capacity={slotsB}
            currentUserId={currentUserId}
          />
        </div>
      </CardContent>
    </Card>
  )
}
