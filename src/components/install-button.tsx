import { useEffect, useRef, useState } from 'react'
import { Download, Share, Plus, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { cn } from '@/lib/utils'

// Persistimos el descarte del botón: si solo viviera en estado, al recargar
// (o al abrir otra pestaña) volvería a aparecer aunque el usuario ya lo
// haya cerrado.
const DISMISS_KEY = 'advfc.installDismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    // Safari en modo privado puede lanzar al tocar localStorage
    return false
  }
}

interface Props {
  variant?: 'default' | 'ghost' | 'outline'
  /** Estilos custom para integrarse al header oscuro de partido-activo */
  className?: string
  iconOnlyOnMobile?: boolean
}

export function InstallButton({
  variant = 'outline',
  className,
  iconOnlyOnMobile = false,
}: Props) {
  const { canInstall, isIos, isStandalone, promptInstall } = useInstallPrompt()
  const [iosOpen, setIosOpen] = useState(false)
  const [dismissed, setDismissed] = useState(readDismissed)

  // Ya está instalada o el usuario cerró el prompt: no mostrar nada.
  if (isStandalone || dismissed) return null
  // Sin soporte (Firefox desktop, Safari macOS sin install): no mostrar nada.
  if (!canInstall && !isIos) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Sin storage disponible al menos lo ocultamos en este render
    }
  }

  async function handleClick() {
    if (isIos) {
      setIosOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'dismissed') dismiss()
  }

  // En mobile con iconOnlyOnMobile, usamos size="iconSm" para un touch target
  // cuadrado de 36x36 (h-9 w-9) sin padding horizontal extra.
  // Añadimos min-h-[44px] min-w-[44px] para cumplir con guidelines de accesibilidad táctil.
  const buttonSize = iconOnlyOnMobile ? 'iconSm' : 'sm'

  return (
    <>
      <Button
        variant={variant}
        size={buttonSize}
        onClick={handleClick}
        className={cn(className, iconOnlyOnMobile && 'p-0 min-h-[44px] min-w-[44px] flex items-center justify-center')}
        aria-label="Instalar app"
      >
        <Download />
        <span className={iconOnlyOnMobile ? 'hidden sm:inline' : ''}>Instalar app</span>
      </Button>

      {iosOpen && <IosInstallSheet onClose={() => setIosOpen(false)} />}
    </>
  )
}

function IosInstallSheet({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape cierra la hoja; al abrir dejamos el foco en el botón de cerrar
  // (no inventamos un focus-trap completo, solo foco inicial + cleanup).
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    closeRef.current?.focus()
    // Bloquear scroll del body mientras la sheet está abierta
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="w-full max-w-md max-h-[85vh] rounded-t-2xl rounded-b-none bg-card text-card-foreground shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo con botón cerrar visible */}
        <header className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-border flex-shrink-0 sticky top-0 bg-card/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Smartphone className="size-5 text-primary" />
            </div>
            <div>
              <h2 id="ios-install-title" className="font-bold leading-tight">
                Instalar en iPhone
              </h2>
              <p className="text-xs text-muted-foreground">3 pasos en Safari</p>
            </div>
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-2 flex-shrink-0"
          >
            <X />
          </Button>
        </header>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-4">
          <ol className="space-y-3 text-sm">
            <Step
              number={1}
              icon={<Share className="size-4" />}
              text={
                <>
                  Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </>
              }
            />
            <Step
              number={2}
              icon={<Plus className="size-4" />}
              text={
                <>
                  Desliza y elige{' '}
                  <strong>"Agregar a pantalla de inicio"</strong>.
                </>
              }
            />
            <Step
              number={3}
              icon={<Download className="size-4" />}
              text={
                <>
                  Toca <strong>Agregar</strong> en la esquina superior derecha.
                </>
              }
            />
          </ol>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Importante: usa <strong>Safari</strong> (no Chrome) para instalar en iPhone/iPad.
          </p>
        </div>

        {/* Botón fijo al fondo */}
        <div className="p-6 pt-0 border-t border-border flex-shrink-0 bg-card/95 backdrop-blur-sm sticky bottom-0 rounded-b-none">
          <Button onClick={onClose} className="w-full" size="lg">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  icon,
  text,
}: {
  number: number
  icon: React.ReactNode
  text: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          'size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs',
        )}
      >
        {number}
      </span>
      <div className="flex-1 pt-0.5 flex items-start gap-2">
        <span className="text-muted-foreground shrink-0 pt-0.5">{icon}</span>
        <p>{text}</p>
      </div>
    </li>
  )
}
