import { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo de confirmación reutilizable (acciones destructivas). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onCancel])

  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center"
      onClick={() => !loading && onCancel()}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 text-card-foreground shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <header className="flex items-start gap-3">
          {destructive && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="font-bold">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
          </div>
        </header>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className={cn('flex-1')}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Backdrop reutilizable para modales con foco y cierre por Escape. */
export function ModalBackdrop({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode
  onClose: () => void
  titleId: string
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const target =
      dialog.querySelector<HTMLElement>('input') ?? dialog.querySelector<HTMLElement>('button')
    target?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        {children}
      </div>
    </div>
  )
}

export { Spinner }
