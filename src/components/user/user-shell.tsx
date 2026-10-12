import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  UserCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { UserAvatar } from '@/components/user-avatar'
import { InstallButton } from '@/components/install-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useProfile } from '@/lib/api-profile'
import { useTheme, THEME_META_COLORS } from '@/lib/theme'
import { isAdmin, rolesLabel } from '@/lib/roles'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/inicio', label: 'Inicio', icon: Home, end: true },
  { to: '/partidos', label: 'Partidos', icon: CalendarDays, end: false },
  { to: '/perfil', label: 'Mi perfil', icon: UserCircle2, end: false },
] as const

export function UserShell() {
  const user = useCurrentUser()
  const { data: profile } = useProfile()
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { resolvedTheme } = useTheme()

  useThemeColor(THEME_META_COLORS[resolvedTheme])

  const admin = isAdmin(user)
  const userLabel = profile?.name ?? user?.name ?? 'Jugador'

  async function handleLogout() {
    await logout.mutateAsync()
    navigate('/login', { replace: true })
  }

  const items = admin
    ? [...NAV, { to: '/admin', label: 'Panel', icon: LayoutDashboard, end: false }]
    : [...NAV]

  return (
    <div className="min-h-svh bg-matchday pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/inicio" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-2 ring-primary/25">
              <img src="/icon-192.png" alt="" className="size-8 object-contain" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-black leading-tight">Gol FC</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
                Fútbol club
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {items.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <InstallButton iconOnlyOnMobile />
            <div className="hidden items-center gap-2.5 rounded-full border border-border/70 bg-background/60 py-1 pl-1 pr-3 sm:flex">
              <UserAvatar
                photoUrl={profile?.photoUrl}
                name={userLabel}
                className="size-8 rounded-full text-xs"
                fallbackClassName="bg-primary/10 text-primary"
              />
              <div className="hidden min-w-0 leading-tight md:block">
                <p className="max-w-[9rem] truncate text-sm font-semibold">{userLabel}</p>
                <p className="truncate text-[11px] text-muted-foreground">{rolesLabel(user?.roles)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="text-muted-foreground hover:text-destructive"
            >
              {logout.isPending ? <Spinner className="size-4" /> : <LogOut />}
            </Button>
          </div>
        </div>
        <span className="block h-0.5 grass-underline" aria-hidden />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Navegación inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch">
          {items.map(({ to, label, icon: Icon, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
