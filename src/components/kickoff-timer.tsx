import { Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClock } from '@/lib/clock'

interface Props {
  dateTime: string
  className?: string
  /** 'long' = "Comienza en 02d 04h 12m" · 'short' = "en 2d 4h" (tarjetas). */
  format?: 'long' | 'short'
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Cuenta regresiva al inicio del partido, en estilo marcador. */
export function KickoffTimer({ dateTime, className, format = 'long' }: Props) {
  const now = useClock()
  const target = new Date(dateTime).getTime()

  if (Number.isNaN(target)) return null

  const diffMs = target - now
  const live = diffMs <= 0
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (live) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 font-bold tabular-nums', className)}
        role="timer"
        aria-live="off"
      >
        <span className="relative flex size-2">
          <span
            className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
            aria-hidden
          />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" aria-hidden />
        </span>
        <span className="uppercase tracking-wide">Hora del partido</span>
      </span>
    )
  }

  const value =
    format === 'short'
      ? days >= 1
        ? `${days}d ${hours}h`
        : hours >= 1
          ? `${hours}h ${minutes}m`
          : minutes >= 1
            ? `${minutes}m`
            : `${seconds}s`
      : days > 0
        ? `${days}d ${hours}h ${pad(minutes)}m`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-bold tabular-nums', className)}
      role="timer"
      aria-live="off"
    >
      <Clock3 className="size-3.5 shrink-0" aria-hidden />
      <span>{format === 'short' ? `en ${value}` : `Comienza en ${value}`}</span>
    </span>
  )
}
