import type { MatchStatus } from '@/types/match'
import { cn } from '@/lib/utils'

const VARIANTS: Record<MatchStatus, { label: string; classes: string; dot: string }> = {
  open: {
    label: 'Abierto',
    classes: 'bg-success/10 text-success border-success/25',
    dot: 'bg-success',
  },
  closed: {
    label: 'Cupo completo',
    classes: 'bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning',
    dot: 'bg-warning',
  },
  cancelled: {
    label: 'Cancelado',
    classes: 'bg-destructive/10 text-destructive border-destructive/25',
    dot: 'bg-destructive',
  },
  finished: {
    label: 'Finalizado',
    classes: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
}

export function MatchStatusBadge({ status, className }: { status: MatchStatus; className?: string }) {
  const v = VARIANTS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        v.classes,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', v.dot)} aria-hidden />
      {v.label}
    </span>
  )
}
