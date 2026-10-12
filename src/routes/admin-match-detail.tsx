import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Goal,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Ticket,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader, ErrorState } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MatchStatusBadge } from '@/components/match-status-badge'
import { MatchPlantilla } from '@/components/match-plantilla'
import { AdminMatchPlayers } from '@/components/admin/admin-match-players'
import { InviteFriendsDialog } from '@/components/invite-friends-dialog'
import { AddToCalendarButton } from '@/components/add-to-calendar'
import { useCurrentUser } from '@/hooks/use-auth'
import { useMatchRealtime } from '@/hooks/use-match-realtime'
import { useCreateInvite } from '@/lib/api-invites'
import { useDeleteMatch, useMatch, useUpdateMatch } from '@/lib/api-matches'
import { isAdmin } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'

export default function AdminMatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isPending, isError, error } = useMatch(id)
  const update = useUpdateMatch(id ?? '')
  const remove = useDeleteMatch()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const createInvite = useCreateInvite()
  const currentUser = useCurrentUser()
  const admin = isAdmin(currentUser)
  useMatchRealtime(id)

  if (!id) return <Navigate to="/admin/partidos" replace />

  // La invitación se genera en el click (dentro del diálogo quedaría "pending"
  // para siempre con StrictMode — TanStack/query#9068).
  function openInvite() {
    setInviteOpen(true)
    if (id) createInvite.mutate(id)
  }

  function setStatus(status: 'open' | 'closed' | 'cancelled' | 'finished', message: string) {
    update.mutate(
      { status },
      {
        onSuccess: () => toast.success(message),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    )
  }

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
          {/* Encabezado — marcador de estadio */}
          <section className="dark relative overflow-hidden rounded-2xl border border-white/10 bg-pitch-vignette text-white shadow-lg ring-1 ring-black/20">
            <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-60" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-40" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />
            <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-white/15 backdrop-blur-sm">
                    <Goal className="size-3.5" /> Plantilla del partido
                  </span>
                  <MatchStatusBadge
                    status={data.status}
                    className="border-white/20 bg-black/30 backdrop-blur-sm"
                  />
                </div>
                <h2 className="font-display text-3xl uppercase leading-none text-shadow-hero sm:text-4xl">
                  {data.place}
                </h2>
                <p className="mt-1.5 text-sm text-white/70">
                  <span className="font-bold tabular-nums text-white">
                    {data.registrations.length}
                  </span>{' '}
                  / {data.requiredPlayers} jugadores · Creado por {data.createdBy.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-black/40 text-white hover:border-team-a/60 hover:bg-black/60 hover:text-white"
                >
                  <Link to={`/admin/partidos/${data.id}/editar`}>
                    <Pencil /> Editar
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openInvite}
                  className="border-white/20 bg-black/40 text-white hover:border-team-a/60 hover:bg-black/60 hover:text-white"
                >
                  <Ticket /> Invitar amigos
                </Button>
                <AddToCalendarButton
                  match={data}
                  className="border-white/20 bg-black/40 text-white hover:border-team-a/60 hover:bg-black/60 hover:text-white"
                />
              </div>
            </div>
          </section>

          {/* Acciones rápidas de estado */}
          {admin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones rápidas</CardTitle>
                <CardDescription>
                  Abre o cierra las inscripciones, o marca el partido como finalizado.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.status !== 'open' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus('open', 'Inscripciones abiertas')}
                    loading={update.isPending}
                  >
                    <RotateCcw /> Reabrir inscripciones
                  </Button>
                )}
                {data.status === 'open' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus('closed', 'Inscripciones cerradas')}
                    loading={update.isPending}
                  >
                    <Ban /> Cerrar inscripciones
                  </Button>
                )}
                {data.status !== 'finished' && data.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus('finished', 'Partido finalizado')}
                    loading={update.isPending}
                  >
                    <CheckCircle2 /> Finalizar partido
                  </Button>
                )}
                {data.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus('cancelled', 'Partido cancelado')}
                    loading={update.isPending}
                  >
                    <Ban /> Cancelar partido
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to={`/admin/partidos/${data.id}/editar`}>
                    <Pencil /> Editar datos
                  </Link>
                </Button>
                <Button variant="outline" onClick={openInvite}>
                  <Ticket /> Invitar amigos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Gestión de jugadores (Admin/Developer) */}
          {admin && <AdminMatchPlayers match={data} />}

          {/* Plantilla compartida: mismo diseño que ve el jugador, y cualquiera
              puede arrastrar para reordenar equipos. */}
          <MatchPlantilla match={data} currentUserId={currentUser?.id} canReorder />

          {/* Zona peligrosa (solo Admin/Developer) */}
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

          {inviteOpen && (
            <InviteFriendsDialog
              matchId={data.id}
              matchPlace={data.place}
              create={createInvite}
              onClose={() => setInviteOpen(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
