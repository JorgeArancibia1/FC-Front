import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useResetPassword } from '@/lib/api-auth'
import { getApiErrorMessage } from '@/lib/errors'

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const reset = useResetPassword()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const done = reset.isSuccess
  const valid = isStrongPassword(password)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      toast.error('Enlace inválido')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!valid) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }
    try {
      await reset.mutateAsync({ token, newPassword: password })
      toast.success('Contraseña actualizada')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta"
      backTo="/login"
      backLabel="Ir al inicio de sesión"
    >
      {done ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm">{reset.data?.message}</p>
          </div>
          <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Iniciar sesión
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={reset.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={reset.isPending}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
          </p>

          {reset.error && <p className="text-sm text-destructive">{getApiErrorMessage(reset.error)}</p>}

          <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>
            {!reset.isPending && <KeyRound />}
            {reset.isPending ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
