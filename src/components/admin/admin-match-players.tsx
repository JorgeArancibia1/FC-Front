import { useMemo, useState } from 'react'
import { UserMinus, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { useAdminAddPlayer, useAdminRemovePlayer } from '@/lib/api-matches'
import { useUsers } from '@/lib/api-users'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { MatchDetail } from '@/types/match'

/** Alta/baja manual de jugadores por parte del Admin/Developer. */
export function AdminMatchPlayers({ match }: { match: MatchDetail }) {
  const { data: users } = useUsers()
  const add = useAdminAddPlayer(match.id)
  const remove = useAdminRemovePlayer(match.id)
  const [selected, setSelected] = useState('')

  const enrolledIds = useMemo(
    () => new Set(match.registrations.map((r) => r.userId)),
    [match.registrations],
  )

  const available = useMemo(
    () =>
      (users ?? [])
        .filter((u) => u.status !== 'eliminado' && !enrolledIds.has(u.id))
        .sort((a, b) =>
          `${a.name} ${a.lastName ?? ''}`.localeCompare(`${b.name} ${b.lastName ?? ''}`),
        ),
    [users, enrolledIds],
  )

  const isFull = match.registrations.length >= match.requiredPlayers
  const locked = match.status === 'cancelled' || match.status === 'finished'

  const enrolled = useMemo(
    () =>
      [...match.registrations].sort((a, b) => {
        const pa = a.position ?? Number.MAX_SAFE_INTEGER
        const pb = b.position ?? Number.MAX_SAFE_INTEGER
        if (pa !== pb) return pa - pb
        return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
      }),
    [match.registrations],
  )

  function handleAdd() {
    if (!selected) return
    add.mutate(selected, {
      onSuccess: () => {
        toast.success('Jugador inscrito')
        setSelected('')
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    })
  }

  function handleRemove(userId: string, name: string) {
    remove.mutate(userId, {
      onSuccess: () => toast.success(`${name} quitado del partido`),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5 text-primary" />
          Gestionar jugadores
        </CardTitle>
        <CardDescription>
          Inscribe o quita jugadores manualmente. Para moverlos de equipo, arrastra las tarjetas en
          la plantilla.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Elegí un jugador para inscribir"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={locked || isFull || available.length === 0 || add.isPending}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            )}
          >
            <option value="">
              {locked
                ? 'El partido está cerrado'
                : isFull
                  ? 'Cupo completo'
                  : available.length === 0
                    ? 'No hay jugadores disponibles'
                    : 'Elegí un jugador…'}
            </option>
            {available.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.lastName ?? ''} — {u.email}
              </option>
            ))}
          </select>
          <Button
            onClick={handleAdd}
            disabled={!selected || isFull || locked}
            loading={add.isPending}
            className="sm:w-auto"
          >
            {!add.isPending && <UserPlus />} Inscribir
          </Button>
        </div>

        {enrolled.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay jugadores inscritos.</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border border-border/70">
            {enrolled.map((r) => (
              <li key={r.id} className="flex items-center gap-3 bg-card p-2.5">
                <UserAvatar
                  photoUrl={r.user.photoUrl}
                  name={r.user.name}
                  className="size-9 rounded-full text-xs"
                  fallbackClassName="bg-primary/10 text-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.user.name} {r.user.lastName ?? ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.position ? `Posición ${r.position}` : 'Sin posición asignada'}
                  </p>
                </div>
                <Button
                  size="iconSm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => handleRemove(r.userId, r.user.name)}
                  title={`Quitar a ${r.user.name}`}
                  aria-label={`Quitar a ${r.user.name}`}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <UserMinus />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
