import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn, Ticket, UserPlus, UserRoundPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InviteMatchCard } from '@/components/invite-match-card'
import { useCurrentUser } from '@/hooks/use-auth'
import { useAcceptInvite, useResolveInviteCode } from '@/lib/api-invites'
import { getApiErrorMessage } from '@/lib/errors'

export default function JoinByCodePage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resolve = useResolveInviteCode()
  const accept = useAcceptInvite()

  const [code, setCode] = useState(searchParams.get('code') ?? '')

  const resolution = resolve.data
  const valid = resolution?.invite.valid && resolution.match
  const next = `/unirse?code=${encodeURIComponent(code)}`

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = code.replace(/\s+/g, '')
    if (clean.length !== 6) {
      toast.error('El código debe tener 6 dígitos')
      return
    }
    setSearchParams({ code: clean })
    try {
      const result = await resolve.mutateAsync(clean)
      if (!result.invite.valid || !result.match) {
        toast.error('El código es inválido o expiró')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  async function onAccept() {
    try {
      const result = await accept.mutateAsync({ code: code.replace(/\s+/g, '') })
      toast.success(result.message)
      navigate(`/partidos/${result.matchId}`, { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Unirme con código"
      subtitle="Ingresa el código de 6 dígitos que te compartieron"
      backTo="/login"
      backLabel="Ir al inicio de sesión"
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
      <form onSubmit={onSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código de invitación</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            disabled={resolve.isPending}
            className="text-center font-mono text-2xl tracking-[0.3em]"
          />
        </div>
        <Button type="submit" className="w-full" loading={resolve.isPending}>
          {!resolve.isPending && <Ticket />}
          Buscar invitación
        </Button>
      </form>

      {valid && resolution?.match && (
        <div className="mt-5 space-y-4">
          <InviteMatchCard match={resolution.match} />
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
