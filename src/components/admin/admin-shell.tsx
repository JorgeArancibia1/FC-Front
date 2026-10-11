import { useState } from 'react'
import {
  LogOut,
  Calendar,
  Users,
  LayoutDashboard,
  UserCircle2,
  PlaySquare,
  Cog,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { InstallButton } from '@/components/install-button'
import { UserAvatar } from '@/components/user-avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Spinner } from '@/components/ui/feedback'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useProfile } from '@/lib/api-profile'
import { useTheme, THEME_META_COLORS } from '@/lib/theme'
import { isDeveloper, rolesLabel } from '@/lib/roles'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/admin/partidos', label: 'Partidos', icon: Calendar, end: false },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, end: false },
  { to: '/perfil', label: 'Mi perfil', icon: UserCircle2, end: false },
  { to: '/inicio', label: 'Jugar', icon: PlaySquare, end: false },
]

const SYSTEM_ITEM: NavItem = { to: '/admin/sistema', label: 'Sistema', icon: Cog, end: false }

const COLLAPSE_KEY = 'advfc.sidebarCollapsed'

function sectionTitle(pathname: string): string {
  if (pathname.startsWith('/admin/partidos')) return 'Partidos'
  if (pathname.startsWith('/admin/usuarios')) return 'Usuarios'
  if (pathname.startsWith('/admin/sistema')) return 'Sistema'
  return 'Inicio'
}

export function AdminShell() {
  const user = useCurrentUser()
  const { data: profile } = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { resolvedTheme } = useTheme()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  // Header acorde al tema (light/dark) → status bar Android del mismo color.
  useThemeColor(THEME_META_COLORS[resolvedTheme])

  // El drawer móvil se cierra al pulsar cualquier enlace (onNavigate), así que
  // no hace falta un efecto reactivo al cambio de ruta.

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* sin storage */
      }
      return next
    })
  }

  async function handleLogout() {
    await logout.mutateAsync()
    navigate('/login', { replace: true })
  }

  const userLabel = profile?.name ?? user?.name ?? 'Usuario'

  const navItems: NavItem[] = isDeveloper(user) ? [...NAV, SYSTEM_ITEM] : NAV

  const nav = (
    <NavList
      items={navItems}
      collapsed={collapsed}
      onNavigate={() => setMobileOpen(false)}
      onLogout={handleLogout}
      loggingOut={logout.isPending}
    />
  )

  return (
    <div className="min-h-svh bg-matchday">
      {/* Sidebar fija (desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/70 bg-card transition-[width] duration-300 lg:flex',
          collapsed ? 'w-20' : 'w-72',
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">{nav}</div>
        <SidebarUser
          collapsed={collapsed}
          name={userLabel}
          role={rolesLabel(user?.roles)}
          photoUrl={profile?.photoUrl}
          loggingOut={logout.isPending}
          onLogout={handleLogout}
        />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 hidden size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors hover:text-primary lg:flex"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </aside>

      {/* Drawer (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border/70 bg-card shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between pr-3">
              <SidebarBrand onClick={() => setMobileOpen(false)} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">{nav}</div>
            <SidebarUser
              name={userLabel}
              role={rolesLabel(user?.roles)}
              photoUrl={profile?.photoUrl}
              loggingOut={logout.isPending}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <header className="sticky top-0 z-20 border-b border-border/70 bg-card/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
                  {sectionTitle(pathname)}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Panel administrativo</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <InstallButton iconOnlyOnMobile />
              <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-background/60 py-1 pl-1 pr-1 sm:pr-3">
                <UserAvatar
                  photoUrl={profile?.photoUrl}
                  name={userLabel}
                  className="size-8 rounded-full text-xs"
                  fallbackClassName="bg-primary/10 text-primary"
                />
                <div className="hidden min-w-0 leading-tight sm:block">
                  <p className="max-w-[10rem] truncate text-sm font-semibold">{userLabel}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{rolesLabel(user?.roles)}</p>
                </div>
              </div>
            </div>
          </div>
          <span className="block h-0.5 grass-underline" aria-hidden />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarBrand({ collapsed, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  return (
    <Link
      to="/admin"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-4',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <img src="/icon-192.png" alt="" className="size-9 object-contain" />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-black leading-tight">Árbol de Vida FC</p>
          <p className="text-[11px] font-medium text-primary">Panel del club</p>
        </div>
      )}
    </Link>
  )
}

function NavList({
  items,
  collapsed,
  onNavigate,
  onLogout,
  loggingOut,
}: {
  items: NavItem[]
  collapsed?: boolean
  onNavigate?: () => void
  onLogout: () => void
  loggingOut: boolean
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <Icon className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}

      <div className="my-1 h-px bg-border/70" />

      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        title={collapsed ? 'Cerrar sesión' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50',
          collapsed && 'justify-center px-0',
        )}
      >
        {loggingOut ? <Spinner className="size-[18px]" /> : <LogOut className="size-[18px] shrink-0" />}
        {!collapsed && <span className="truncate">Cerrar sesión</span>}
      </button>
    </nav>
  )
}

function SidebarUser({
  name,
  role,
  photoUrl,
  loggingOut,
  onLogout,
  collapsed,
}: {
  name: string
  role: string
  photoUrl?: string | null
  loggingOut: boolean
  onLogout: () => void
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <div className="border-t border-border/70 p-3">
        <UserAvatar
          photoUrl={photoUrl}
          name={name}
          className="mx-auto size-10 rounded-xl"
          fallbackClassName="bg-primary/10 text-primary text-sm"
        />
      </div>
    )
  }
  return (
    <div className="border-t border-border/70 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-background/60 p-2.5 ring-1 ring-border/60">
        <UserAvatar
          photoUrl={photoUrl}
          name={name}
          className="size-10 rounded-xl"
          fallbackClassName="bg-primary/10 text-primary text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{role}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}
