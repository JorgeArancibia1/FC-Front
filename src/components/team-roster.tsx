import { UserPlus2 } from 'lucide-react'
import type { MatchRegistration } from '@/types/match'
import type { TeamKey } from '@/lib/teams'
import { resolveAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

interface Props {
  team: TeamKey
  players: MatchRegistration[]
  capacity: number
  currentUserId?: string
}

const TEAM_STYLES: Record<
  TeamKey,
  { ring: string; bg: string; badgeBg: string; badgeText: string; accent: string }
> = {
  A: {
    ring: 'border-team-a/40',
    bg: 'bg-team-a/10',
    badgeBg: 'bg-team-a',
    badgeText: 'text-team-a-foreground',
    accent: 'text-lime-700 dark:text-lime-300',
  },
  B: {
    ring: 'border-team-b/40',
    bg: 'bg-team-b/10',
    badgeBg: 'bg-team-b',
    badgeText: 'text-team-b-foreground',
    accent: 'text-sky-700 dark:text-sky-300',
  },
}

export function TeamRoster({ team, players, capacity, currentUserId }: Props) {
  const styles = TEAM_STYLES[team]
  const emptySlots = Math.max(0, capacity - players.length)

  return (
    <div className={cn('overflow-hidden rounded-xl border-2', styles.ring)}>
      <header className={cn('flex items-center gap-3 px-4 py-3', styles.bg)}>
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-lg font-display text-xl shadow-sm',
            styles.badgeBg,
            styles.badgeText,
          )}
        >
          {team}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight">Equipo {team}</h3>
          <p className={cn('text-xs font-medium', styles.accent)}>
            {players.length} / {capacity} jugadores
          </p>
        </div>
      </header>

      <ul className="divide-y bg-card">
        {players.map((r, idx) => {
          const isMe = r.userId === currentUserId
          return (
            <li
              key={r.id}
              className={cn('flex items-center gap-3 p-3 transition-colors', isMe && styles.bg)}
            >
              <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                {idx + 1}
              </span>
              {r.user.photoUrl ? (
                <img
                  src={resolveAssetUrl(r.user.photoUrl)}
                  alt={r.user.name}
                  loading="lazy"
                  decoding="async"
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    isMe ? cn(styles.badgeBg, styles.badgeText) : 'bg-muted text-muted-foreground',
                  )}
                >
                  {r.user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">
                  {r.user.jerseyName || `${r.user.name} ${r.user.lastName ?? ''}`.trim()}
                  {isMe && <span className={cn('ml-2 text-xs font-medium', styles.accent)}>(tú)</span>}
                </p>
              </div>
              {r.user.preferredNumber != null && (
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-md font-display text-lg',
                    styles.badgeBg,
                    styles.badgeText,
                  )}
                >
                  {r.user.preferredNumber}
                </span>
              )}
            </li>
          )
        })}

        {Array.from({ length: emptySlots }).map((_, idx) => (
          <li key={`empty-${idx}`} className="flex items-center gap-3 p-3 text-muted-foreground/60">
            <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums">
              {players.length + idx + 1}
            </span>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed">
              <UserPlus2 className="size-4" />
            </div>
            <p className="flex-1 text-sm italic">Cupo disponible</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
