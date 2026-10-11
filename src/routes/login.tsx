import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Info, LogIn, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useCurrentUser, useLogin } from '@/hooks/use-auth'
import { getApiErrorMessage } from '@/lib/errors'
import { isAdmin } from '@/lib/roles'
import type { CurrentUser } from '@/types/auth'

function destinationFor(user: CurrentUser): string {
  return isAdmin(user) ? '/admin' : '/inicio'
}

// El `?reason=` viene de un link: limitamos el largo para que nadie pinte
// texto arbitrario largo en el banner.
function truncateReason(reason: string): string {
  return reason.length > 140 ? `${reason.slice(0, 140)}…` : reason
}

export default function LoginPage() {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const sessionEndedReason = searchParams.get('reason')
  const next = searchParams.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (currentUser) {
    return <Navigate to={next ?? destinationFor(currentUser)} replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const result = await login.mutateAsync({ email, password })
      toast.success('Sesión iniciada')
      navigate(next ?? destinationFor(result.user), { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const errorMessage = login.error ? getApiErrorMessage(login.error) : null

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accede con tu correo y contraseña"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-primary hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      {sessionEndedReason && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <p className="text-warning-foreground">{truncateReason(sessionEndedReason)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tucorreo@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={login.isPending}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/recuperar" className="text-xs font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={login.isPending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          {!login.isPending && <LogIn />}
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-5 space-y-3 border-t border-border/70 pt-4">
        <Link
          to="/recuperar-correo"
          className="block text-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Olvidé mi correo
        </Link>
        <Button asChild variant="outline" className="w-full">
          <Link to="/unirse">
            <Ticket /> Tengo un código de invitación
          </Link>
        </Button>
      </div>
    </AuthLayout>
  )
}
