import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  MapPin,
  Goal,
  Clock,
  Users,
  Eye,
  Pencil,
  Ban,
  Trash2,
  Search,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { useCurrentUser } from '@/hooks/use-auth'
import { useDeleteMatch, useMatches, useSetMatchStatus } from '@/lib/api-matches'
import { isAdmin, isManager } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'
import { formatMatchDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MatchListItem, MatchStatus } from '@/types/match'

const STATUS_FILTERS: { value: MatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'closed', label: 'Cupo completo' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'finished', label: 'Finalizados' },
]

const STATUS_ACCENT: Record<MatchStatus, string> = {
  open: 'from-success to-team-a',
  closed: 'from-warning to-warning/50',
  cancelled: 'from-destructive to-destructive/50',
  finished: 'from-muted-foreground to-muted-foreground/40',
}

export default function AdminMatchesList() {
  const { data, isPending, isError, error, refetch } = useMatches()
  const currentUser = useCurrentUser()
  const deleteMatch = useDeleteMatch()
  const setStatus = useSetMatchStatus()

  const admin = isAdmin(currentUser)
  const manager = isManager(currentUser)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all')
  const [toDelete, setToDelete] = useState<MatchListItem | null>(null)
  const [toCancel, setToCancel] = useState<MatchListItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (q && !m.place.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, search, statusFilter])

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await deleteMatch.mutateAsync(toDelete.id)
      toast.success('Partido eliminado')
      setToDelete(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  async function confirmCancel() {
    if (!toCancel) return
    try {
      await setStatus.mutateAsync({ id: toCancel.id, status: 'cancelled' })
      toast.success('Partido cancelado')
      setToCancel(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={Goal}
        title="Partidos"
        description={`${data?.length ?? 0} partido${data?.length === 1 ? '' : 's'} en total`}
        actions={
          admin ? (
            <Button asChild>
              <Link to="/admin/partidos/nuevo">
                <Plus /> Nuevo partido
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar partidos por lugar"
            placeholder="Buscar por lugar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                statusFilter === f.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isPending && <PageLoader label="Cargando partidos…" />}

      {isError && (
        <ErrorState
          title="No se pudieron cargar los partidos"
          description={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="Aún no hay partidos"
          description="Crea el primer partido para empezar a recibir inscripciones."
          action={
            admin ? (
              <Button asChild>
                <Link to="/admin/partidos/nuevo">
                  <Plus /> Crear el primero
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {data && data.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ningún partido coincide con la búsqueda o el filtro seleccionado."
        />
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              admin={admin}
              manager={manager}
              onDelete={() => setToDelete(m)}
              onCancel={() => setToCancel(m)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar partido"
        description={
          toDelete
            ? `Se eliminará "${toDelete.place}" junto con todas sus inscripciones. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        destructive
        loading={deleteMatch.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={!!toCancel}
        title="Cancelar partido"
        description={
          toCancel
            ? `El partido "${toCancel.place}" pasará a estado cancelado. Las inscripciones se conservan.`
            : undefined
        }
        confirmLabel="Sí, cancelar partido"
        destructive
        loading={setStatus.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  )
}

function MatchCard({
  match,
  admin,
  manager,
  onDelete,
  onCancel,
}: {
  match: MatchListItem
  admin: boolean
  manager: boolean
  onDelete: () => void
  onCancel: () => void
}) {
  const capacity = match.requiredPlayers
  const registered = match._count.registrations
  const pct = Math.min(100, (registered / capacity) * 100)
  const cancellable = manager && match.status !== 'cancelled' && match.status !== 'finished'

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-grass" aria-hidden />
      <div className={cn('h-1.5 bg-gradient-to-r', STATUS_ACCENT[match.status])} />
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 font-display text-2xl leading-none sm:text-3xl">
            <span className="line-clamp-1">{match.place}</span>
          </h3>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <Clock className="size-4 shrink-0" /> {formatMatchDate(match.dateTime)}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" /> <span className="truncate">{match.place}</span>
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Users className="size-4 shrink-0" />
            <span className="font-bold tabular-nums text-foreground">{registered}</span> / {capacity}{' '}
            jugadores
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', STATUS_ACCENT[match.status])}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-auto flex items-center gap-1.5 border-t border-border/70 pt-3">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/admin/partidos/${match.id}`}>
              <Eye /> Ver detalle
            </Link>
          </Button>
          {manager && (
            <Button asChild size="iconSm" variant="ghost" title="Editar partido" aria-label="Editar partido">
              <Link to={`/admin/partidos/${match.id}/editar`}>
                <Pencil />
              </Link>
            </Button>
          )}
          {cancellable && (
            <Button
              size="iconSm"
              variant="ghost"
              onClick={onCancel}
              title="Cancelar partido"
              aria-label="Cancelar partido"
            >
              <Ban />
            </Button>
          )}
          {admin && (
            <Button
              size="iconSm"
              variant="ghost"
              onClick={onDelete}
              title="Eliminar partido"
              aria-label="Eliminar partido"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
