import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
