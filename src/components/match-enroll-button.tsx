import { useState } from 'react'
import { CheckCircle2, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCurrentUser } from '@/hooks/use-auth'
import { useRegisterToMatch, useUnregisterFromMatch } from '@/lib/api-matches'
import { getApiErrorMessage } from '@/lib/errors'
import type { MatchDetail } from '@/types/match'

interface Props {
  match: MatchDetail
}

export function MatchEnrollButton({ match }: Props) {
  const user = useCurrentUser()
  const register = useRegisterToMatch(match.id)
  const unregister = useUnregisterFromMatch(match.id)
  const [confirmUnregister, setConfirmUnregister] = useState(false)

  if (!user) return null

  const myReg = match.registrations.find((r) => r.userId === user.id)
  const isFull = match.registrations.length >= match.requiredPlayers
  const isOpen = match.status === 'open'

  // Con el update optimista la UI reacciona al instante; acá va el feedback.
  function handleRegister() {
    register.mutate(undefined, {
      onSuccess: () => toast.success('Inscripción confirmada'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    })
  }

  function handleUnregister() {
    unregister.mutate(undefined, {
      onSuccess: () => {
        toast.success('Te desinscribiste del partido')
        setConfirmUnregister(false)
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    })
  }

  const firstError = register.error ?? unregister.error
  const mutationError = firstError ? getApiErrorMessage(firstError) : null

  if (myReg) {
    return (
      <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 className="size-5" /> Estás inscrito en este partido
        </div>
        <Button
          variant="outline"
          className="w-full"
          loading={unregister.isPending}
          onClick={() => setConfirmUnregister(true)}
        >
          {!unregister.isPending && <UserMinus />}
          {unregister.isPending ? 'Saliendo…' : 'Desinscribirme'}
        </Button>
        {mutationError && <p className="text-center text-sm text-destructive">{mutationError}</p>}

        <ConfirmDialog
          open={confirmUnregister}
          title="¿Desinscribirte del partido?"
          description="Se liberará tu cupo en la plantilla. Podrás volver a inscribirte si hay lugar."
          confirmLabel="Sí, desinscribirme"
          cancelLabel="Cancelar"
          destructive
          loading={unregister.isPending}
          onConfirm={handleUnregister}
          onCancel={() => setConfirmUnregister(false)}
        />
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Las inscripciones para este partido están cerradas.
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        El cupo está completo.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="w-full"
        loading={register.isPending}
        onClick={handleRegister}
      >
        {!register.isPending && <UserPlus />}
        {register.isPending ? 'Inscribiendo…' : 'Inscribirme al partido'}
      </Button>
      {mutationError && (
        <p className="text-center text-sm text-destructive">{mutationError}</p>
      )}
    </div>
  )
}
