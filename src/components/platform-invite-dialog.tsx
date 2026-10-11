import { Link2, MessageCircle, RefreshCw, Share2, Ticket, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModalBackdrop } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/feedback'
import { CopyButton } from '@/components/invite-friends-dialog'
import type { useCreatePlatformInvite } from '@/lib/api-invites'
import { getApiErrorMessage } from '@/lib/errors'

interface Props {
  /** Mutación de creación ya en marcha (la dispara quien abre el diálogo). */
  create: ReturnType<typeof useCreatePlatformInvite>
  onClose: () => void
}

export function PlatformInviteDialog({ create, onClose }: Props) {
  // Igual que InviteFriendsDialog: la invitación se genera al pulsar el botón que
  // abre este diálogo (no en un useEffect) para evitar la desincronización del
  // observer de TanStack Query con React StrictMode.
  const invite = create.data ?? null
  const errorMessage = create.error ? getApiErrorMessage(create.error) : null

  const whatsappUrl = invite
    ? `https://wa.me/?text=${encodeURIComponent(
        `⚽ Únete a Árbol de Vida FC. Crea tu cuenta con este link: ${invite.url} · Código: ${invite.code}`,
      )}`
    : '#'

  return (
    <ModalBackdrop onClose={onClose} titleId="platform-invite-title">
      <div
        role="document"
        aria-labelledby="platform-invite-title"
        className="w-full max-w-md rounded-2xl bg-card p-6 text-card-foreground shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 id="platform-invite-title" className="font-bold">
                Añadir usuario
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparte el link o el código para que se registren en la plataforma.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mr-2 -mt-2">
            <X />
          </Button>
        </header>

        <div className="mt-5">
          {create.isPending && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Spinner className="size-6 text-primary" />
              <p className="text-sm">Generando invitación…</p>
            </div>
          )}

          {errorMessage && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button
                variant="outline"
                onClick={() => {
                  create.mutate()
                }}
                loading={create.isPending}
              >
                <RefreshCw /> Reintentar
              </Button>
            </div>
          )}

          {invite && (
            <div className="space-y-4">
              <CopyField
                icon={Link2}
                label="Link de invitación"
                value={invite.url}
                copyLabel="Copiar link"
              />

              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Ticket className="size-3.5" /> Código de 6 dígitos
                </p>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <span className="font-mono text-2xl font-black tracking-[0.3em] text-primary">
                    {invite.code.slice(0, 3)} {invite.code.slice(3)}
                  </span>
                  <CopyButton value={invite.code} label="Copiar código" />
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Válido hasta{' '}
                {new Date(invite.expiresAt).toLocaleString('es-CL', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                . Quien lo reciba se registra con el link o el código y queda atribuido a ti.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    create.mutate()
                  }}
                  loading={create.isPending}
                >
                  <RefreshCw /> Generar otro
                </Button>
                <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              </div>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: 'Únete a Árbol de Vida FC',
                        text: `Crea tu cuenta en Árbol de Vida FC. Código: ${invite.code}`,
                        url: invite.url,
                      })
                    } catch {
                      /* el usuario canceló */
                    }
                  }}
                >
                  <Share2 /> Compartir de otra forma
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  )
}

function CopyField({
  icon: Icon,
  label,
  value,
  copyLabel,
}: {
  icon: typeof Link2
  label: string
  value: string
  copyLabel: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm">{value}</span>
        <CopyButton value={value} label={copyLabel} />
      </div>
    </div>
  )
}
