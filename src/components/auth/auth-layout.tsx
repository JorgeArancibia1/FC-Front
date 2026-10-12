import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { InstallButton } from '@/components/install-button'
import { useThemeColor } from '@/hooks/use-theme-color'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  /** Enlace inferior (ej. "¿Ya tienes cuenta? Inicia sesión"). */
  footer?: ReactNode
  /** Muestra el botón "Volver" arriba de la tarjeta. */
  backTo?: string
  backLabel?: string
}

/**
 * Portada de acceso estilo "día de partido": estadio de noche con cancha,
 * líneas de fútbol, césped cortado e iluminación, y la tarjeta en cristal.
 */
export function AuthLayout({ title, subtitle, children, footer, backTo, backLabel = 'Volver' }: Props) {
  useThemeColor('#040e09')

  return (
    <div className="dark relative flex min-h-svh items-center justify-center overflow-hidden bg-pitch-vignette px-4 py-10 text-white">
      {/* Textura de la cancha */}
      <div className="pointer-events-none absolute inset-0 bg-pitch-lines opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grass-stripes opacity-35" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-stadium-beams" aria-hidden />

      {/* Orbes de luz (lima equipo A y azul equipo B) */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-team-a/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-team-b/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      {/* Vinetas superior e inferior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <Link to="/login" className="flex flex-col items-center gap-3">
            <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-3xl bg-white/10 shadow-2xl shadow-black/40 ring-1 ring-white/20 backdrop-blur-xl">
              <img src="/icon-512.png" alt="Gol FC" className="relative size-16 object-contain" />
              <span className="absolute inset-x-0 bottom-0 h-0.5 grass-underline" aria-hidden />
            </span>
            <span className="flex flex-col items-center">
              <span className="font-display text-2xl uppercase leading-none tracking-[0.06em] text-white text-shadow-hero">
                Gol FC
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-team-a">
                <ShieldCheck className="size-3.5" /> Fútbol club
              </span>
            </span>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
          <span className="absolute inset-x-0 top-0 h-1 grass-underline" aria-hidden />
          <span
            className="pointer-events-none absolute -top-16 right-0 size-40 rounded-full bg-team-a/10 blur-3xl"
            aria-hidden
          />
          {backTo && (
            <Link
              to={backTo}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition-colors hover:text-team-a"
            >
              <ArrowLeft className="size-4" /> {backLabel}
            </Link>
          )}
          <div className="mb-5">
            <h1 className="text-xl font-black tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && (
          <div className="mt-5 text-center text-sm text-white/65 [&_a]:text-white [&_a]:font-semibold [&_a]:transition-colors [&_a:hover]:text-team-a">
            {footer}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <InstallButton variant="ghost" />
        </div>
      </div>
    </div>
  )
}