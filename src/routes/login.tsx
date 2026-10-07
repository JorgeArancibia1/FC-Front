import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentUser, useLogin } from '@/hooks/use-auth'
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
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <img
            src="/icon-512.png"
            alt="Árbol de Vida FC"
            width={144}
            height={144}
            className="size-36 [filter:drop-shadow(0_8px_24px_rgba(34,197,94,0.45))]"
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Árbol de Vida FC</h1>
            <p className="text-sm text-muted-foreground">Inscríbete al próximo partido</p>
          </div>
        </div>

        {sessionEndedReason && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2 text-sm">
            <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Tu sesión se cerró. Motivo: {truncateReason(sessionEndedReason)}
            </p>
          </div>
        )}

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>Accede con tu correo y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
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

              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

              <Button type="submit" className="w-full" disabled={login.isPending} size="lg">
                {login.isPending ? (
                  <>
                    <Loader2 className="animate-spin" /> Entrando…
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <InstallButton variant="ghost" />
        </div>
      </div>
    </div>
  )
}
