import { CheckCircle2, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
    if (!window.confirm('¿Desinscribirte del partido?')) return
    unregister.mutate(undefined, {
      onSuccess: () => toast.success('Te desinscribiste del partido'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    })
  }

  const firstError = register.error ?? unregister.error
  const mutationError = firstError ? getApiErrorMessage(firstError) : null

  if (myReg) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-5" /> Estás inscrito en este partido
        </div>
        <Button
          variant="outline"
          className="w-full"
          disabled={unregister.isPending}
          onClick={handleUnregister}
        >
          {unregister.isPending ? <Loader2 className="animate-spin" /> : <UserMinus />}
          Retirarme
        </Button>
        {mutationError && <p className="text-sm text-destructive">{mutationError}</p>}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground text-center">
        El partido no está aceptando inscripciones.
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground text-center">
        Cupo lleno. No puedes inscribirte.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="w-full"
        disabled={register.isPending}
        onClick={handleRegister}
      >
        {register.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
        Inscribirme al partido
      </Button>
      {mutationError && (
        <p className="text-sm text-destructive text-center">{mutationError}</p>
      )}
    </div>
  )
}