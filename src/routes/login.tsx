import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Info, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentUser, useLogin } from '@/hooks/use-auth'
import { useThemeColor } from '@/hooks/use-theme-color'
import { InstallButton } from '@/components/install-button'
import { getApiErrorMessage } from '@/lib/errors'
import type { CurrentUser } from '@/types/auth'

function destinationFor(user: CurrentUser): string {
  if (user.roles.includes('admin') || user.roles.includes('supervisor')) return '/admin'
  return '/partido-activo'
}

// El `?reason=` viene de un link: limitamos el largo para que nadie pinte
// texto arbitrario largo en el banner.
function truncateReason(reason: string): string {
  return reason.length > 140 ? `${reason.slice(0, 140)}…` : reason
}

export default function LoginPage() {
  const currentUser = useCurrentUser()
  const location = useLocation()
  const navigate = useNavigate()
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const sessionEndedReason = searchParams.get('reason')

  useThemeColor('#ffffff')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (currentUser) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? destinationFor(currentUser)} replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const result = await login.mutateAsync({ email, password })
      toast.success('Sesión iniciada')
      navigate(destinationFor(result.user), { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const errorMessage = login.error ? getApiErrorMessage(login.error) : null

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambiente deportivo sutil */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-team-b/10 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-primary/20">
            <img src="/icon-512.png" alt="Árbol de Vida FC" className="size-20 object-contain" />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Árbol de Vida FC</h1>
            <p className="text-sm text-muted-foreground">Organiza y juega el próximo partido</p>
          </div>
        </div>

        {sessionEndedReason && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
            <p className="font-medium text-warning-foreground dark:text-warning">
              Tu sesión se cerró. Motivo: {truncateReason(sessionEndedReason)}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-foreground/[0.04] sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">Accede con tu correo y contraseña</p>
          </div>

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
              <Label htmlFor="password">Contraseña</Label>
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
        </div>

        <div className="mt-6 flex justify-center">
          <InstallButton variant="ghost" />
        </div>
      </div>
    </div>
  )
}
