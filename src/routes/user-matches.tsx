import { useMemo, useState } from 'react'
import { CalendarX2, Goal, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/feedback'
import { MatchListCard } from '@/components/match-list-card'
import { InviteFriendsDialog } from '@/components/invite-friends-dialog'
import { useCreateInvite } from '@/lib/api-invites'
import { useMatches, useMyMatches } from '@/lib/api-matches'
import { cn } from '@/lib/utils'
import type { MatchListItem, MatchStatus } from '@/types/match'

type Filter = 'all' | MatchStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Abiertos' },
  { value: 'closed', label: 'Cupo completo' },
  { value: 'finished', label: 'Finalizados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
]

export default function UserMatches() {
  const all = useMatches()
  const mine = useMyMatches()
  const [filter, setFilter] = useState<Filter>('open')
  const [query, setQuery] = useState('')
  const [inviteMatch, setInviteMatch] = useState<MatchListItem | null>(null)
  const createInvite = useCreateInvite()

  // La invitación se genera en el click que abre el diálogo, no en un useEffect
  // interno: con React StrictMode esa mutación queda con el status en "pending"
  // para siempre y nunca se muestra el link (TanStack/query#9068).
  function openInvite(match: MatchListItem) {
    setInviteMatch(match)
    createInvite.mutate(match.id)
  }

  const enrolledIds = useMemo(
    () => new Set((mine.data ?? []).map((m) => m.id)),
    [mine.data],
  )

  const list = useMemo(() => {
    let items = all.data ?? []
    if (filter !== 'all') items = items.filter((m) => m.status === filter)
    const q = query.trim().toLowerCase()
    if (q) items = items.filter((m) => m.place.toLowerCase().includes(q))
    return items
  }, [all.data, filter, query])

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Goal}
        title="Partidos"
        description="Explora los partidos y abre el que te interese para inscribirte."
      />

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por lugar…"
            className="pl-9"
            aria-label="Buscar partidos"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all',
                filter === f.value
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {all.isPending && <PageLoader label="Cargando partidos…" />}

      {all.isError && (
        <ErrorState
          title="No se pudieron cargar los partidos"
          description={(all.error as Error)?.message}
        />
      )}

      {!all.isPending && !all.isError && list.length === 0 && (
        <EmptyState
          icon={CalendarX2}
          title="Sin partidos"
          description="No hay partidos que coincidan con el filtro seleccionado."
        />
      )}

      {list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MatchListCard
              key={m.id}
              match={m}
              to={`/partidos/${m.id}`}
              enrolled={enrolledIds.has(m.id)}
              onInvite={enrolledIds.has(m.id) ? () => openInvite(m) : undefined}
            />
          ))}
        </div>
      )}

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
