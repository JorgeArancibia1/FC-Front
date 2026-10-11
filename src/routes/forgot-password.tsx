import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useForgotPassword } from '@/lib/api-auth'
import { getApiErrorMessage } from '@/lib/errors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const forgot = useForgotPassword()
  const sent = forgot.isSuccess

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await forgot.mutateAsync({ email: email.trim() })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva"
      backTo="/login"
      backLabel="Volver al inicio de sesión"
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm">{forgot.data?.message}</p>
          </div>

          {forgot.data?.devLink && (
            <div className="space-y-2 rounded-xl border border-dashed border-warning/40 bg-warning/5 p-4 text-sm">
              <p className="font-semibold text-warning-foreground">
                Modo desarrollo (sin correo configurado)
              </p>
              <p className="text-muted-foreground">
                Usa este enlace para restablecer la contraseña:
              </p>
              <Link
                to={forgot.data.devLink.replace(/^https?:\/\/[^/]+/, '')}
                className="block break-all font-medium text-primary hover:underline"
              >
                {forgot.data.devLink}
              </Link>
            </div>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo registrado</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tucorreo@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={forgot.isPending}
            />
          </div>

          {forgot.error && (
            <p className="text-sm text-destructive">{getApiErrorMessage(forgot.error)}</p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={forgot.isPending}>
            {!forgot.isPending && <KeyRound />}
            {forgot.isPending ? 'Enviando…' : 'Enviar enlace'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ¿No recuerdas tu correo?{' '}
            <Link to="/recuperar-correo" className="font-semibold text-primary hover:underline">
              Recupéralo aquí
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
