import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, PageLoader } from '@/components/ui/feedback'
import { MatchForm } from '@/components/match-form'
import { useMatch, useUpdateMatch } from '@/lib/api-matches'
import { getApiErrorMessage } from '@/lib/errors'
import { toDateTimeLocal } from '@/lib/format'
import type { MatchStatus } from '@/types/match'

const STATUSES: { value: MatchStatus; label: string }[] = [
  { value: 'open', label: 'Abierto a inscripciones' },
  { value: 'closed', label: 'Cerrado (cupo lleno)' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'finished', label: 'Finalizado' },
]

export default function AdminMatchEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useMatch(id)
  const update = useUpdateMatch(id ?? '')

  if (!id) return <Navigate to="/admin/partidos" replace />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={`/admin/partidos/${id}`}>
          <ArrowLeft /> Volver al partido
        </Link>
      </Button>

      <PageHeader
        title="Editar partido"
        description="Actualiza la fecha, el lugar, los cupos o el estado del partido."
      />

      {isPending && <PageLoader label="Cargando partido…" />}

      {isError && (
        <ErrorState
          title="No se pudo cargar el partido"
          description={(error as Error)?.message ?? 'Error al cargar el partido'}
        />
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del partido</CardTitle>
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
              errorMessage={update.error ? getApiErrorMessage(update.error) : null}
              initial={{
                place: data.place,
                dateTimeLocal: toDateTimeLocal(data.dateTime),
                requiredPlayers: data.requiredPlayers,
                notes: data.notes ?? '',
              }}
              onSubmit={(input) =>
                update.mutate(input, {
                  onSuccess: () => {
                    toast.success('Cambios guardados')
                    navigate(`/admin/partidos/${data.id}`)
                  },
                  onError: (err) => toast.error(getApiErrorMessage(err)),
                })
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
