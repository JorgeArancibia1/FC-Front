import { Link, useNavigate, useParams } from 'react-router-dom'
import { LogIn, UserPlus, UserRoundPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { PageLoader } from '@/components/ui/feedback'
import { InviteMatchCard } from '@/components/invite-match-card'
import { useCurrentUser } from '@/hooks/use-auth'
import { useAcceptInvite, useResolveInviteToken } from '@/lib/api-invites'
import { getApiErrorMessage } from '@/lib/errors'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data, isPending } = useResolveInviteToken(token)
  const accept = useAcceptInvite()

  const valid = data?.invite.valid && data.match
  const next = `/invitacion/${token}`

  async function onAccept() {
    try {
      const result = await accept.mutateAsync({ token })
      toast.success(result.message)
      navigate(`/partidos/${result.matchId}`, { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Invitación a un partido"
      subtitle="Te han invitado a jugar en Gol FC"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link
            to={`/registro?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary hover:underline"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      {isPending && <PageLoader label="Verificando invitación…" />}

      {!isPending && !valid && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Esta invitación no es válida o ya expiró. Pídele a quien te invitó que genere una nueva.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Ir al inicio de sesión</Link>
          </Button>
        </div>
      )}

      {valid && data?.match && (
        <div className="space-y-4">
          <InviteMatchCard match={data.match} />
          {user ? (
            <Button size="lg" className="w-full" loading={accept.isPending} onClick={onAccept}>
              {!accept.isPending && <UserRoundPlus />}
              {accept.isPending ? 'Uniéndome…' : 'Unirme al partido'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                Inicia sesión o crea una cuenta para unirte.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link to={`/login?next=${encodeURIComponent(next)}`}>
                    <LogIn /> Iniciar sesión
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/registro?next=${encodeURIComponent(next)}`}>
                    <UserPlus /> Crear cuenta
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  )
}
