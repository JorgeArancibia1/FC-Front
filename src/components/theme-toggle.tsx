import { useEffect, useRef, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme, type Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

/** Selector de tema claro / oscuro / sistema. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
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

  const Icon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size="iconSm"
        onClick={() => setOpen((value) => !value)}
        aria-label="Cambiar tema"
        title="Cambiar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground"
      >
        <Icon />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Tema"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          {OPTIONS.map(({ value, label, icon: OptionIcon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent',
                  active && 'text-primary',
                )}
              >
                <OptionIcon className="size-4" />
                <span className="flex-1">{label}</span>
                {active && <Check className="size-3.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
