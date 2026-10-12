import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Circle, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'golfc-onboarding-dismissed'

interface Step {
  label: string
  done: boolean
  to: string
}

/** Checklist de primeros pasos para completar el perfil de jugador. */
export function OnboardingChecklist({
  photoDone,
  jerseyDone,
  numberDone,
  matchDone,
}: {
  photoDone: boolean
  jerseyDone: boolean
  numberDone: boolean
  matchDone: boolean
}) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const steps: Step[] = [
    { label: 'Sube tu foto de perfil', done: photoDone, to: '/perfil' },
    { label: 'Elige tu nombre de camiseta', done: jerseyDone, to: '/perfil' },
    { label: 'Elige tu dorsal', done: numberDone, to: '/perfil' },
    { label: 'Inscríbete a tu primer partido', done: matchDone, to: '/partidos' },
  ]

  const completed = steps.filter((step) => step.done).length
  if (dismissed || completed === steps.length) return null

  const pct = (completed / steps.length) * 100

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* sin storage */
    }
    setDismissed(true)
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5">
      <span className="absolute inset-x-0 top-0 h-1 grass-underline" aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h3 className="font-bold">Primeros pasos</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Completa tu perfil para que te reconozcan en la plantilla ({completed}/{steps.length}).
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={dismiss}
          aria-label="Ocultar primeros pasos"
          title="Ocultar"
        >
          <X />
        </Button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-team-a transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              to={step.to}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent',
                step.done && 'text-muted-foreground',
              )}
            >
              {step.done ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3.5" />
                </span>
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/50" />
              )}
              <span className={cn('flex-1', step.done && 'line-through')}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
