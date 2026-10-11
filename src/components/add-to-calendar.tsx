import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarPlus, ChevronDown, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildGoogleCalendarUrl, downloadMatchIcs, type CalendarMatch } from '@/lib/calendar'
import { cn } from '@/lib/utils'

const MENU_WIDTH = 232

interface Props {
  match: CalendarMatch
  className?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  label?: string
}

type Coords = { top: number; left: number }

/** Botón con menú para añadir el partido a Google Calendar o descargar .ics. */
export function AddToCalendarButton({
  match,
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Calendario',
}: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Posiciona el menú flotante (portal) pegado al botón, sin que el hero lo recorte.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8,
      )
      setCoords({ top: rect.bottom + 8, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (triggerRef.current?.contains(target)) return
      if (target.closest?.('[data-calendar-menu]')) return
      setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const googleUrl = buildGoogleCalendarUrl(match)

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <CalendarPlus /> {label}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </Button>
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            data-calendar-menu
            role="menu"
            aria-label="Agregar al calendario"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-[100] overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
          >
            <a
              role="menuitem"
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-4 text-primary" /> Google Calendar
            </a>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                downloadMatchIcs(match)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="size-4 text-primary" /> Apple / Outlook (.ics)
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
