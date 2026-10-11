import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Ticket, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useCurrentUser, useLogin } from '@/hooks/use-auth'
import { useRegister } from '@/lib/api-auth'
import { useResolvePlatformInviteToken } from '@/lib/api-invites'
import { getApiErrorMessage } from '@/lib/errors'
import { isAdmin } from '@/lib/roles'

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  )
}

export default function RegisterPage() {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const register = useRegister()
  const login = useLogin()

  // Invitación a la plataforma: token del link (?invitacion=...) o código (?codigo=).
  const inviteToken = searchParams.get('invitacion') ?? undefined
  const inviteCodeParam = (searchParams.get('codigo') ?? searchParams.get('code') ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
  const platformInvite = useResolvePlatformInviteToken(inviteToken)

  const [role, setRole] = useState<'usuario' | 'admin'>('usuario')
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    jerseyName: '',
    preferredNumber: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    securityQuestion: '',
    securityAnswer: '',
    inviteCode: inviteCodeParam,
  })
  const [showPassword, setShowPassword] = useState(false)

  if (currentUser) {
    return <Navigate to={next ?? '/inicio'} replace />
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const passwordValid = isStrongPassword(form.password)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!passwordValid) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }
    try {
      await register.mutateAsync({
        name: form.name.trim(),
        lastName: form.lastName.trim() || undefined,
        jerseyName: form.jerseyName.trim() || undefined,
        preferredNumber: form.preferredNumber ? Number(form.preferredNumber) : undefined,
        email: form.email.trim(),
        password: form.password,
        role,
        phone: form.phone.trim() || undefined,
        securityQuestion: form.securityQuestion.trim() || undefined,
        securityAnswer: form.securityAnswer.trim() || undefined,
        platformInviteToken: inviteToken,
        platformInviteCode:
          form.inviteCode.replace(/\D/g, '').length === 6
            ? form.inviteCode.replace(/\D/g, '')
            : undefined,
      })
      // Registro correcto: iniciamos sesión automáticamente.
      const result = await login.mutateAsync({ email: form.email.trim(), password: form.password })
      toast.success('¡Cuenta creada! Bienvenido.')
      navigate(next ?? (isAdmin(result.user) ? '/admin' : '/inicio'), { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const busy = register.isPending || login.isPending
  const errorMessage = register.error ? getApiErrorMessage(register.error) : null

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Únete al club en menos de un minuto"
      backTo="/login"
      backLabel="Ya tengo cuenta"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {inviteToken && platformInvite.data?.invite.valid && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <Ticket className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                Te invitó {platformInvite.data.inviterName ?? 'un miembro del club'} 🎉
              </p>
              <p className="text-xs text-muted-foreground">
                Crea tu cuenta para unirte a la plataforma.
              </p>
            </div>
          </div>
        )}
        {inviteToken && platformInvite.data && !platformInvite.data.invite.valid && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            La invitación expiró o no es válida. Igual puedes crear tu cuenta.
          </p>
        )}

        {/* Elección de rol */}
        <div className="space-y-2">
          <Label>¿Cómo quieres usar la app?</Label>
          <div className="grid grid-cols-2 gap-3">
            <RoleChoice
              selected={role === 'admin'}
              onClick={() => setRole('admin')}
              icon={<ShieldCheck className="size-5" />}
              title="Administrar"
              description="Quiero organizar los partidos"
            />
            <RoleChoice
              selected={role === 'usuario'}
              onClick={() => setRole('usuario')}
              icon={<UserRound className="size-5" />}
              title="Jugar"
              description="Quiero inscribirme a los partidos"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Podrás cambiar de rol cuando quieras desde tu perfil.
          </p>
        </div>

        {!inviteToken && (
          <div className="space-y-2">
            <Label htmlFor="inviteCode">
              Código de invitación{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="inviteCode"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              placeholder="123456"
              value={form.inviteCode}
              onChange={(e) => set('inviteCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Si alguien te compartió un código para unirte a la plataforma, ingrésalo aquí.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={50}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              maxLength={50}
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tucorreo@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                disabled={busy}
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
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        {form.password.length > 0 && !passwordValid && (
          <p className="text-xs text-muted-foreground">
            La contraseña debe incluir mayúscula, minúscula, número y símbolo (mín. 8).
          </p>
        )}
        {form.confirm.length > 0 && form.password !== form.confirm && (
          <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
        )}

        {/* Recuperación de cuenta (opcional) */}
        <details className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Datos de recuperación{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Sirven para recuperar tu correo si algún día lo olvidas.
          </p>
          <div className="mt-3 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                maxLength={20}
                placeholder="+56912345678"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityQuestion">Pregunta de seguridad</Label>
              <Input
                id="securityQuestion"
                maxLength={140}
                placeholder="¿Cuál es tu equipo favorito?"
                value={form.securityQuestion}
                onChange={(e) => set('securityQuestion', e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityAnswer">Respuesta</Label>
              <Input
                id="securityAnswer"
                maxLength={140}
                value={form.securityAnswer}
                onChange={(e) => set('securityAnswer', e.target.value)}
                disabled={busy}
              />
            </div>
          </div>
        </details>

        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {!busy && <UserRound />}
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}

function RoleChoice({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ' +
        (selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
          : 'border-border bg-card hover:border-primary/40')
      }
    >
      <span
        className={
          selected
            ? 'flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground'
            : 'flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'
        }
      >
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  )
}
