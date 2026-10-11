import { useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Shirt,
  UserCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader, ErrorState, Spinner } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useThemeColor } from '@/hooks/use-theme-color'
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
  useUploadHeroPhoto,
  useUploadProfilePhoto,
} from '@/lib/api-profile'
import { useChangeRole } from '@/lib/api-auth'
import { useTheme, THEME_META_COLORS } from '@/lib/theme'
import { resolveAssetUrl } from '@/lib/assets'
import { isAdmin, rolesLabel } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/auth'

interface FormState {
  name: string
  lastName: string
  jerseyName: string
  preferredNumber: string
  phone: string
  securityQuestion: string
  securityAnswer: string
}

// Validación previa al upload: el backend acepta imágenes dentro de estos
// límites (5 MB avatar / 8 MB hero) — si falla, no se manda nada.
function validateImageFile(file: File, maxMb: number): string | null {
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen (JPG, PNG o WebP).'
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `La imagen supera los ${maxMb} MB.`
  }
  return null
}

export default function PerfilPage() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const logout = useLogout()
  const { data: profile, isPending, isError, error, refetch } = useProfile()
  const update = useUpdateProfile()
  const upload = useUploadProfilePhoto()
  const heroUpload = useUploadHeroPhoto()
  const fileInput = useRef<HTMLInputElement>(null)
  const heroFileInput = useRef<HTMLInputElement>(null)

  const { resolvedTheme } = useTheme()
  useThemeColor(THEME_META_COLORS[resolvedTheme])

  const [form, setForm] = useState<FormState>({
    name: '',
    lastName: '',
    jerseyName: '',
    preferredNumber: '',
    phone: '',
    securityQuestion: '',
    securityAnswer: '',
  })

  // Sincronizar form cuando llega el perfil (patrón "adjusting state when props
  // change" de react.dev: se ajusta en el render, no en un effect).
  const [prevProfile, setPrevProfile] = useState(profile)
  if (profile !== prevProfile) {
    setPrevProfile(profile)
    if (profile) {
      setForm({
        name: profile.name ?? '',
        lastName: profile.lastName ?? '',
        jerseyName: profile.jerseyName ?? '',
        preferredNumber: profile.preferredNumber?.toString() ?? '',
        phone: profile.phone ?? '',
        securityQuestion: profile.securityQuestion ?? '',
        securityAnswer: '',
      })
    }
  }

  const manager = isAdmin(currentUser)
  const backHref = manager ? '/admin' : '/inicio'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await update.mutateAsync({
        name: form.name.trim(),
        lastName: form.lastName.trim() || undefined,
        jerseyName: form.jerseyName.trim() || undefined,
        preferredNumber: form.preferredNumber ? Number(form.preferredNumber) : undefined,
        phone: form.phone.trim() || undefined,
        securityQuestion: form.securityQuestion.trim() || undefined,
        securityAnswer: form.securityAnswer.trim() || undefined,
      })
      toast.success('Cambios guardados')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  async function handlePhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file, 5)
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      await upload.mutateAsync(file)
      toast.success('Foto actualizada')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  async function handleHeroPhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file, 8)
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      await heroUpload.mutateAsync(file)
      toast.success('Foto de cuerpo entero actualizada')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  async function handleLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // useLogout limpia la sesión local igual en onSettled.
    }
    navigate('/login', { replace: true })
  }

  const updateError = update.error ? getApiErrorMessage(update.error) : null
  const uploadError = upload.error ? getApiErrorMessage(upload.error) : null
  const heroUploadError = heroUpload.error ? getApiErrorMessage(heroUpload.error) : null

  return (
    <div className="min-h-svh bg-matchday">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-card/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to={backHref}>
              <ArrowLeft /> Volver
            </Link>
          </Button>
          <h1 className="text-base font-bold">Mi perfil</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive">
              <LogOut /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {isPending && <PageLoader label="Cargando tu perfil…" />}

        {isError && (
          <ErrorState
            title="No se pudo cargar tu perfil"
            description={(error as Error)?.message}
            onRetry={() => refetch()}
          />
        )}

        {profile && (
          <>
            {/* Tarjeta de jugador (estilo FIFA): foto vertical, dorsal y rol */}
            <PlayerCard
              name={profile.name}
              lastName={profile.lastName}
              jerseyName={profile.jerseyName}
              number={profile.preferredNumber}
              role={rolesLabel(profile.roles)}
              photoUrl={profile.photoUrl}
              heroPhotoUrl={profile.heroPhotoUrl}
            />

            {/* A. Información personal */}
            <SectionCard letter="A" title="Información personal">
              <div className="flex items-center gap-4">
                <PhotoAvatar
                  src={resolveAssetUrl(profile.photoUrl)}
                  name={profile.name}
                  uploading={upload.isPending}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">
                    {profile.name} {profile.lastName ?? ''}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <ShieldCheck className="size-3.5" />
                    {rolesLabel(profile.roles)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelected}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInput.current?.click()}
                  loading={upload.isPending}
                >
                  {!upload.isPending && <Camera />}
                  {profile.photoUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  JPG, PNG o WebP · máximo 5 MB
                </p>
                {uploadError && <p className="text-center text-sm text-destructive">{uploadError}</p>}
              </div>
            </SectionCard>

            {/* B. Fotografía de jugador */}
            <SectionCard
              letter="B"
              title="Fotografía de jugador"
              description="Aparece grande al pasar el mouse (o mantener presionado en el celular) sobre tu tarjeta en la plantilla."
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <HeroPreview
                  src={resolveAssetUrl(profile.heroPhotoUrl)}
                  uploading={heroUpload.isPending}
                />
                <div className="w-full flex-1 space-y-2">
                  <input
                    ref={heroFileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleHeroPhotoSelected}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => heroFileInput.current?.click()}
                    loading={heroUpload.isPending}
                  >
                    {!heroUpload.isPending && <ImagePlus />}
                    {profile.heroPhotoUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                  </Button>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>· Formatos: JPG, PNG o WebP</li>
                    <li>· Tamaño máximo: 8 MB</li>
                    <li>· Proporción recomendada: 9:16 (vertical, cuerpo entero)</li>
                  </ul>
                  {heroUploadError && <p className="text-sm text-destructive">{heroUploadError}</p>}
                </div>
              </div>
            </SectionCard>

            {/* C. Datos del jugador */}
            <SectionCard
              letter="C"
              title="Datos del jugador"
              description="El nombre de camiseta y el número aparecen en la plantilla del partido."
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      required
                      maxLength={50}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      disabled={update.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      maxLength={50}
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      disabled={update.isPending}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jerseyName">Nombre de camiseta</Label>
                    <Input
                      id="jerseyName"
                      placeholder="KOKE"
                      maxLength={16}
                      value={form.jerseyName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, jerseyName: e.target.value.toUpperCase() }))
                      }
                      disabled={update.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredNumber">Número de camiseta</Label>
                    <Input
                      id="preferredNumber"
                      type="number"
                      min={1}
                      max={99}
                      placeholder="10"
                      value={form.preferredNumber}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, preferredNumber: e.target.value }))
                      }
                      disabled={update.isPending}
                    />
                  </div>
                </div>

                <div className="border-t border-border/70 pt-4">
                  <p className="text-sm font-semibold">Datos de recuperación</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Sirven para recuperar tu correo si algún día lo olvidas.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        maxLength={20}
                        placeholder="+56912345678"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        disabled={update.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="securityQuestion">Pregunta de seguridad</Label>
                      <Input
                        id="securityQuestion"
                        maxLength={140}
                        placeholder="¿Cuál es tu equipo favorito?"
                        value={form.securityQuestion}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, securityQuestion: e.target.value }))
                        }
                        disabled={update.isPending}
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="securityAnswer">Respuesta</Label>
                    <Input
                      id="securityAnswer"
                      maxLength={140}
                      placeholder="Déjalo vacío para no cambiarla"
                      value={form.securityAnswer}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, securityAnswer: e.target.value }))
                      }
                      disabled={update.isPending}
                    />
                  </div>
                </div>

                {updateError && <p className="text-sm text-destructive">{updateError}</p>}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" loading={update.isPending} className="w-full sm:w-auto">
                    {!update.isPending && <Save />}
                    {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </SectionCard>

            {/* D. Rol de la cuenta */}
            <RoleCard letter="D" roles={profile.roles} />

            {/* E. Seguridad */}
            <ChangePasswordCard letter="E" />
          </>
        )}
      </main>
    </div>
  )
}

function SectionCard({
  letter,
  title,
  description,
  children,
}: {
  letter: string
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-xl text-primary">
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RoleCard({ letter, roles }: { letter: string; roles: UserRole[] }) {
  const navigate = useNavigate()
  const change = useChangeRole()
  const [confirming, setConfirming] = useState(false)

  const isDeveloperRole = roles.includes('developer')
  const isAdminRole = roles.includes('admin')

  if (isDeveloperRole) {
    return (
      <SectionCard
        letter={letter}
        title="Rol de la cuenta"
        description="Tu cuenta tiene acceso total al sistema."
      >
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm">
            Esta es la cuenta de <strong>desarrollador</strong>. Tiene acceso a todas las funciones y
            al panel de configuración avanzada.
          </p>
        </div>
      </SectionCard>
    )
  }

  const target: 'usuario' | 'admin' = isAdminRole ? 'usuario' : 'admin'
  const actionLabel = isAdminRole ? 'Cambiar a jugador' : 'Quiero administrar partidos'

  return (
    <SectionCard
      letter={letter}
      title="Rol de la cuenta"
      description="Puedes cambiar entre jugador y administrador cuando quieras."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              Rol actual: {isAdminRole ? 'Administrador' : 'Jugador'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdminRole
                ? 'Como administrador puedes crear y gestionar partidos y usuarios.'
                : 'Como jugador puedes inscribirte a partidos e invitar amigos.'}
            </p>
          </div>
        </div>
        <Button
          variant={isAdminRole ? 'outline' : 'default'}
          onClick={() => setConfirming(true)}
          loading={change.isPending}
          className="shrink-0"
        >
          {actionLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={actionLabel}
        description={
          isAdminRole
            ? 'Dejarás de administrar partidos y usuarios. Podrás volver a ser admin cuando quieras.'
            : 'Tendrás acceso al panel para crear y gestionar partidos, usuarios e invitaciones.'
        }
        confirmLabel={actionLabel}
        loading={change.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          try {
            await change.mutateAsync(target)
            toast.success('Rol actualizado')
            setConfirming(false)
            navigate(target === 'admin' ? '/admin' : '/inicio', { replace: true })
          } catch (err) {
            toast.error(getApiErrorMessage(err))
          }
        }}
      />
    </SectionCard>
  )
}

function ChangePasswordCard({ letter }: { letter: string }) {
  const change = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (newPassword !== confirmPassword) {
      setLocalError('La nueva contraseña y su confirmación no coinciden')
      return
    }
    try {
      await change.mutateAsync({ currentPassword, newPassword })
      toast.success('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const apiError = change.error ? getApiErrorMessage(change.error) : null

  return (
    <SectionCard
      letter={letter}
      title="Seguridad"
      description="Necesitas tu contraseña actual. Los demás dispositivos quedan deslogueados."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Contraseña actual</Label>
          <PasswordField
            id="current-password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={change.isPending}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <PasswordField
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={change.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <PasswordField
              id="confirm-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={change.isPending}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
        </p>

        {localError && <p className="text-sm text-destructive">{localError}</p>}
        {apiError && <p className="text-sm text-destructive">{apiError}</p>}

        <div className="flex justify-end">
          <Button type="submit" loading={change.isPending} className="w-full sm:w-auto">
            {!change.isPending && <KeyRound />}
            {change.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

function PasswordField(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function PhotoAvatar({
  src,
  name,
  uploading,
}: {
  src?: string
  name: string
  uploading?: boolean
}) {
  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20">
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <UserCircle2 className="size-12 text-muted-foreground" />
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Spinner className="size-6 text-white" />
        </div>
      )}
    </div>
  )
}

function PlayerCard({
  name,
  lastName,
  jerseyName,
  number,
  role,
  photoUrl,
  heroPhotoUrl,
}: {
  name: string
  lastName?: string | null
  jerseyName?: string | null
  number?: number | null
  role: string
  photoUrl?: string | null
  heroPhotoUrl?: string | null
}) {
  const cover = resolveAssetUrl(heroPhotoUrl) || resolveAssetUrl(photoUrl)

  return (
    <section className="dark relative overflow-hidden rounded-2xl bg-pitch-vignette text-white shadow-lg ring-1 ring-black/20">
      <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-30" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />
      <div className="relative flex items-stretch gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/15 sm:w-32">
          <img
            src={cover || '/hero-silhouette.svg'}
            alt=""
            className={cn('aspect-[9/16] w-full object-cover', !cover && 'opacity-80')}
          />
          {number != null && (
            <span className="absolute bottom-1 right-1.5 font-display text-4xl leading-none text-white/95 text-shadow-hero sm:text-5xl">
              {number}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-team-a ring-1 ring-white/15 backdrop-blur-sm">
            <Shirt className="size-3" /> Jugador
          </span>
          <h2 className="mt-2 truncate font-display text-4xl uppercase leading-none text-shadow-hero sm:text-5xl">
            {jerseyName?.trim() || name}
          </h2>
          <p className="mt-1 truncate text-sm text-white/75">
            {name} {lastName ?? ''}
          </p>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <StatChip label="Dorsal" value={number != null ? `#${number}` : '—'} />
            <StatChip label="Rol" value={role} />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="truncate text-sm font-bold tabular-nums">{value}</p>
    </div>
  )
}

function HeroPreview({ src, uploading }: { src?: string; uploading?: boolean }) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,#0d1f14,#050d09)] ring-1 ring-emerald-500/25 sm:mx-0">
      <img
        src={src || '/hero-silhouette.svg'}
        alt="Foto de jugador"
        className={cn('size-full object-cover', !src && 'opacity-80')}
      />
      {!src && (
        <span className="absolute inset-x-0 bottom-2 text-center text-[10px] uppercase tracking-widest text-white/50">
          Imagen de referencia
        </span>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Spinner className="size-8 text-team-a" />
        </div>
      )}
    </div>
  )
}
