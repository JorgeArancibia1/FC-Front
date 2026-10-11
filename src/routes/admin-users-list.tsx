import { useMemo, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import {
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  ShieldHalf,
  UserRound,
  UserPlus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/feedback'
import { ModalBackdrop } from '@/components/ui/confirm-dialog'
import { UserAvatar } from '@/components/user-avatar'
import { PlatformInviteDialog } from '@/components/platform-invite-dialog'
import { useCurrentUser } from '@/hooks/use-auth'
import { useDeleteUser, useUpdateUser, useUsers } from '@/lib/api-users'
import { useCreatePlatformInvite } from '@/lib/api-invites'
import { isAdmin, isDeveloper } from '@/lib/roles'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { AdminUser, UpdateUserInput } from '@/types/admin-user'
import type { UserRole } from '@/types/auth'

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof ShieldCheck }[] = [
  { value: 'developer', label: 'Desarrollador', icon: ShieldHalf },
  { value: 'admin', label: 'Administrador', icon: ShieldCheck },
  { value: 'usuario', label: 'Jugador', icon: UserRound },
]

const ROLE_FILTERS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'developer', label: 'Desarrolladores' },
  { value: 'admin', label: 'Admins' },
  { value: 'usuario', label: 'Jugadores' },
]

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'suspendido', label: 'Suspendidos' },
  { value: 'eliminado', label: 'Eliminados' },
]

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function AdminUsersList() {
  const { data, isPending, isError, error, refetch } = useUsers({ scope: 'invited' })
  const currentUser = useCurrentUser()
  const admin = isAdmin(currentUser)
  const dev = isDeveloper(currentUser)

  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // La invitación se genera al abrir el diálogo (no en un useEffect) para evitar
  // la desincronización del observer de TanStack Query con React StrictMode.
  const platformCreate = useCreatePlatformInvite()
  function openInvite() {
    platformCreate.reset()
    platformCreate.mutate()
    setInviting(true)
  }

  // El filtro por rol "Desarrolladores" solo tiene sentido para un developer.
  const roleFilters = dev
    ? ROLE_FILTERS
    : ROLE_FILTERS.filter((f) => f.value !== 'developer')

  const activeUsers = data?.filter((u) => u.status !== 'eliminado') ?? []
  const deletedCount = (data?.length ?? 0) - activeUsers.length

  const visibleUsers = useMemo(() => {
    const q = normalizeText(search)
    return (data ?? []).filter((u) => {
      if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (q) {
        const haystack = normalizeText(`${u.name} ${u.lastName ?? ''} ${u.email}`)
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [data, search, roleFilter, statusFilter])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuarios"
        description={
          <>
            {activeUsers.length} activo{activeUsers.length === 1 ? '' : 's'}
            {deletedCount > 0 && ` · ${deletedCount} eliminado${deletedCount === 1 ? '' : 's'}`}
            {' · '}
            {dev
              ? 'Todos los usuarios registrados.'
              : 'Solo ves los usuarios que has invitado (link o código).'}
          </>
        }
        actions={
          <Button onClick={openInvite}>
            <UserPlus /> Añadir usuario
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar usuarios"
            placeholder="Buscar por nombre, apellido o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <FilterChips
            label="Rol"
            options={roleFilters}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as UserRole | 'all')}
          />
          <FilterChips label="Estado" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </div>

      {isPending && <PageLoader label="Cargando usuarios…" />}

      {isError && (
        <ErrorState
          title="No se pudieron cargar los usuarios"
          description={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={UserPlus}
          title={dev ? 'Aún no hay usuarios' : 'Aún no has invitado a nadie'}
          description={
            dev
              ? 'Comparte una invitación para que se registren y puedan inscribirse a los partidos.'
              : 'Los usuarios que se registren con tu link o código de invitación aparecerán aquí. Usa "Añadir usuario" para generar uno.'
          }
          action={
            <Button onClick={openInvite}>
              <UserPlus /> Añadir usuario
            </Button>
          }
        />
      )}

      {data && data.length > 0 && visibleUsers.length === 0 && (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Ningún usuario coincide con la búsqueda o los filtros seleccionados."
        />
      )}

      {visibleUsers.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  {admin && <th className="px-4 py-3 text-right font-semibold">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <UserTableRow
                    key={u.id}
                    user={u}
                    isSelf={currentUser?.id === u.id}
                    admin={admin}
                    onEdit={() => setEditing(u)}
                    onDelete={() => setDeleting(u)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 md:hidden">
            {visibleUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isSelf={currentUser?.id === u.id}
                admin={admin}
                onEdit={() => setEditing(u)}
                onDelete={() => setDeleting(u)}
              />
            ))}
          </div>
        </>
      )}

      {inviting && (
        <PlatformInviteDialog create={platformCreate} onClose={() => setInviting(false)} />
      )}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteUserModal user={deleting} onClose={() => setDeleting(null)} />}
    </div>
  )
}

function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              value === o.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    developer: 'bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300',
    admin: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    usuario: 'bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300',
  }
  const labels: Record<UserRole, string> = {
    developer: 'Dev',
    admin: 'Admin',
    usuario: 'Jugador',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        styles[role],
      )}
    >
      {labels[role]}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activo: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    suspendido: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    eliminado: 'bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300',
  }
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
        styles[status] ?? styles.activo,
      )}
    >
      {label}
    </span>
  )
}

function UserTableRow({
  user,
  isSelf,
  admin,
  onEdit,
  onDelete,
}: {
  user: AdminUser
  isSelf: boolean
  admin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const isDeleted = user.status === 'eliminado'
  return (
    <tr className={cn('border-b transition-colors last:border-0 hover:bg-accent/40', isDeleted && 'opacity-50')}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            photoUrl={user.photoUrl}
            name={user.name}
            className="size-10 rounded-full"
            fallbackClassName="bg-primary/10 text-primary text-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {user.name} {user.lastName ?? ''}
              {isSelf && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      {admin && (
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <Button size="iconSm" variant="ghost" onClick={onEdit} disabled={isDeleted} title="Editar">
              <Pencil />
            </Button>
            <Button
              size="iconSm"
              variant="ghost"
              onClick={onDelete}
              disabled={isSelf || isDeleted}
              title={isSelf ? 'No puedes eliminarte' : 'Eliminar'}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        </td>
      )}
    </tr>
  )
}

function UserCard({
  user,
  isSelf,
  admin,
  onEdit,
  onDelete,
}: {
  user: AdminUser
  isSelf: boolean
  admin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const isDeleted = user.status === 'eliminado'
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm',
        isDeleted && 'opacity-50',
      )}
    >
      <UserAvatar
        photoUrl={user.photoUrl}
        name={user.name}
        className="size-11 rounded-full"
        fallbackClassName="bg-primary/10 text-primary text-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">
            {user.name} {user.lastName ?? ''}
            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
          </p>
          <StatusBadge status={user.status} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
      </div>
      {admin && (
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} disabled={isDeleted} title="Editar">
            <Pencil />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            disabled={isSelf || isDeleted}
            title={isSelf ? 'No puedes eliminarte' : 'Eliminar'}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  )
}

function ModalCard({ children, titleId }: { children: React.ReactNode; titleId: string }) {
  return (
    <div
      role="document"
      aria-labelledby={titleId}
      className="w-full max-w-md rounded-2xl bg-card p-6 text-card-foreground shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
    >
      {children}
    </div>
  )
}

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const update = useUpdateUser()
  const currentUser = useCurrentUser()
  const isSelf = currentUser?.id === user.id

  const [name, setName] = useState(user.name)
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [roles, setRoles] = useState<UserRole[]>(user.roles)
  const [status, setStatus] = useState<'activo' | 'suspendido'>(
    user.status === 'suspendido' ? 'suspendido' : 'activo',
  )
  const [newPassword, setNewPassword] = useState('')
  const allowDeveloper = isDeveloper(currentUser)

  function toggleRole(role: UserRole) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const input: UpdateUserInput = {
      name,
      lastName: lastName || undefined,
      roles,
      status,
      ...(newPassword ? { password: newPassword } : {}),
    }
    try {
      await update.mutateAsync({ id: user.id, input })
      toast.success('Usuario actualizado')
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const errorMessage = update.error ? getApiErrorMessage(update.error) : null

  return (
    <ModalBackdrop onClose={onClose} titleId="edit-user-title">
      <ModalCard titleId="edit-user-title">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-user-title" className="font-bold">
              Editar usuario
            </h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mr-2 -mt-2">
            <X />
          </Button>
        </header>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <RoleSelector roles={roles} onToggle={toggleRole} isSelf={isSelf} allowDeveloper={allowDeveloper} />

          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex gap-2">
              {(['activo', 'suspendido'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium ring-1 ring-inset transition',
                    status === s
                      ? 'bg-primary text-primary-foreground ring-primary'
                      : 'bg-muted text-muted-foreground ring-border hover:bg-muted/70',
                  )}
                >
                  {s === 'activo' ? 'Activo' : 'Suspendido'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="edit-new-password">
              Nueva contraseña <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <PasswordInput
              id="edit-new-password"
              autoComplete="new-password"
              placeholder="Dejá vacío para no cambiar"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={newPassword ? 8 : undefined}
            />
            <p className="text-xs text-muted-foreground">
              Si la cambiás, las sesiones activas del usuario quedan deslogueadas. Pasale la nueva
              contraseña por un canal seguro.
            </p>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={roles.length === 0} loading={update.isPending} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </ModalCard>
    </ModalBackdrop>
  )
}

function RoleSelector({
  roles,
  onToggle,
  isSelf,
  allowDeveloper,
}: {
  roles: UserRole[]
  onToggle: (role: UserRole) => void
  isSelf?: boolean
  allowDeveloper?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>Roles</Label>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.filter((o) => o.value !== 'developer' || allowDeveloper).map(
          ({ value, label, icon: Icon }) => {
            const active = roles.includes(value)
            const disabled = !!isSelf && (value === 'admin' || value === 'developer') && active
            return (
              <button
                key={value}
                type="button"
                onClick={() => !disabled && onToggle(value)}
                disabled={disabled}
                aria-pressed={active}
                title={disabled ? 'No puedes quitarte este rol' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition',
                  active
                    ? 'bg-primary text-primary-foreground ring-primary'
                    : 'bg-muted text-muted-foreground ring-border hover:bg-muted/70',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            )
          },
        )}
      </div>
    </div>
  )
}

function DeleteUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const del = useDeleteUser()

  async function handleDelete() {
    try {
      await del.mutateAsync(user.id)
      toast.success('Usuario eliminado')
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const errorMessage = del.error ? getApiErrorMessage(del.error) : null

  return (
    <ModalBackdrop onClose={onClose} titleId="delete-user-title">
      <ModalCard titleId="delete-user-title">
        <header className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1">
            <h2 id="delete-user-title" className="font-bold">
              Eliminar usuario
            </h2>
            <p className="text-sm text-muted-foreground">
              Esta acción marca al usuario como eliminado y revoca sus sesiones. Sus inscripciones a
              partidos quedan en la base de datos pero no podrá volver a iniciar sesión.
            </p>
          </div>
        </header>

        <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">
            {user.name}
            {user.lastName ? ` ${user.lastName}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        {errorMessage && <p className="mt-3 text-sm text-destructive">{errorMessage}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={del.isPending} className="flex-1">
            Eliminar
          </Button>
        </div>
      </ModalCard>
    </ModalBackdrop>
  )
}

function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
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
