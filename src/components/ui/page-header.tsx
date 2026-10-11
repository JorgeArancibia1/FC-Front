import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Ícono futbolero opcional junto al título. */
  icon?: LucideIcon
  className?: string
}

export function PageHeader({ title, description, actions, icon: Icon, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
          {Icon && <Icon className="size-5 shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </h2>
        <span className="mt-2 block h-0.5 w-12 rounded-full grass-underline" aria-hidden />
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
