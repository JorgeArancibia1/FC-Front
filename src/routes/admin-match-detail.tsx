import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Trash2,
  Users,
  MapPin,
  Clock,
  UserCog,
  Trophy,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PageLoader, ErrorState } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MatchEnrollButton } from '@/components/match-enroll-button'
import { MatchForm } from '@/components/match-form'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { TeamRoster } from '@/components/team-roster'
import { useCurrentUser } from '@/hooks/use-auth'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { useDeleteMatch, useMatch, useUpdateMatch } from '@/lib/api-matches'
import { isAdmin, isManager } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'
import { formatMatchDate, toDateTimeLocal } from '@/lib/format'
import { buildTeams } from '@/lib/teams'
import type { MatchStatus } from '@/types/match'

const STATUSES: { value: MatchStatus; label: string }[] = [
  { value: 'open', label: 'Abierto a inscripciones' },
  { value: 'closed', label: 'Cerrado (cupo lleno)' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'finished', label: 'Finalizado' },
]

export default function AdminMatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useMatch(id)
  const update = useUpdateMatch(id ?? '')
  const remove = useDeleteMatch()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const currentUser = useCurrentUser()
  const admin = isAdmin(currentUser)
  const manager = isManager(currentUser)
  useMatchRealtime(id)

  if (!id) return <Navigate to="/admin/partidos" replace />

  const updateError = update.error ? getApiErrorMessage(update.error) : null

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/partidos">
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
          {/* Encabezado */}
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-team-a to-team-b" />
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-xl font-black">
                  <Trophy className="size-5 text-primary" />
                  <span className="truncate">{data.place}</span>
                </h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" /> {formatMatchDate(data.dateTime)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {data.place}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" /> {data.registrations.length} / {data.requiredPlayers}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Creado por {data.createdBy.name}</p>
              </div>
              <MatchStatusBadge status={data.status} />
            </CardContent>
          </Card>

          {/* Edición (Admin/Supervisor) */}
          {manager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCog className="size-5 text-primary" /> Editar partido
                </CardTitle>
                <CardDescription>
                  Los cambios se aplican inmediatamente. La fecha está en tu zona horaria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado del partido</Label>
                  <select
                    id="status"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={data.status}
                    onChange={(e) =>
                      update.mutate(
                        { status: e.target.value as MatchStatus },
                        {
                          onSuccess: () => toast.success('Estado actualizado'),
                          onError: (err) => toast.error(getApiErrorMessage(err)),
                        },
                      )
                    }
                    disabled={update.isPending}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <MatchForm
                  submitLabel="Guardar cambios"
                  submitting={update.isPending}
                  errorMessage={updateError}
                  initial={{
                    place: data.place,
                    dateTimeLocal: toDateTimeLocal(data.dateTime),
                    requiredPlayers: data.requiredPlayers,
                    notes: data.notes ?? '',
                  }}
                  onSubmit={(input) =>
                    update.mutate(input, {
                      onSuccess: () => toast.success('Cambios guardados'),
                      onError: (err) => toast.error(getApiErrorMessage(err)),
                    })
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5 text-primary" />
                Plantilla ({data.registrations.length} / {data.requiredPlayers})
              </CardTitle>
              <CardDescription>Jugadores inscritos en este partido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MatchEnrollButton match={data} />
              {(() => {
                const { teamA, teamB, slotsPerTeam } = buildTeams(
                  data.registrations,
                  data.requiredPlayers,
                )
                const playersA = teamA.map((s) => s.registration).filter(Boolean) as typeof data.registrations
                const playersB = teamB.map((s) => s.registration).filter(Boolean) as typeof data.registrations
                const slotsB = data.requiredPlayers - slotsPerTeam
                return (
                  <div className="grid gap-3 md:grid-cols-2">
                    <TeamRoster
                      team="A"
                      players={playersA}
                      capacity={slotsPerTeam}
                      currentUserId={currentUser?.id}
                    />
                    <TeamRoster
                      team="B"
                      players={playersB}
                      capacity={slotsB}
                      currentUserId={currentUser?.id}
                    />
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Zona peligrosa (solo Admin) */}
          {admin && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <ShieldAlert className="size-5" /> Zona peligrosa
                </CardTitle>
                <CardDescription>Eliminar el partido borra también las inscripciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 /> Eliminar partido
                </Button>
              </CardContent>
            </Card>
          )}

          <ConfirmDialog
            open={confirmingDelete}
            title="Eliminar partido"
            description={`Se eliminará "${data.place}" junto con todas sus inscripciones. No se puede deshacer.`}
            confirmLabel="Sí, eliminar"
            destructive
            loading={remove.isPending}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={async () => {
              try {
                await remove.mutateAsync(id)
                toast.success('Partido eliminado')
                navigate('/admin/partidos', { replace: true })
              } catch (err) {
                toast.error(getApiErrorMessage(err))
              }
            }}
          />
        </>
      )}
    </div>
  )
}
