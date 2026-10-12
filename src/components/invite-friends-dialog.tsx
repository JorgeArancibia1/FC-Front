import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Check, Copy, Link2, MessageCircle, RefreshCw, Share2, Ticket, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ModalBackdrop } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/feedback'
import type { useCreateInvite } from '@/lib/api-invites'
import { useRegisterToMatch } from '@/lib/api-matches'
import { getApiErrorMessage } from '@/lib/errors'

interface Props {
  matchId: string
  matchPlace: string
  /** Mutación de creación ya en marcha (la dispara quien abre el diálogo). */
  create: ReturnType<typeof useCreateInvite>
  onClose: () => void
}

export function InviteFriendsDialog({ matchId, matchPlace, create, onClose }: Props) {
  const register = useRegisterToMatch(matchId)

  // La invitación se genera al pulsar el botón que abre este diálogo, NO desde
  // un useEffect de montaje. Con React StrictMode, una mutación lanzada en un
  // efecto y protegida con un ref para que no corra dos veces queda con el
  // observer desincronizado: la request termina (MutationCache en "success")
  // pero el status del hook se queda en "pending" para siempre y la UI nunca
  // deja de mostrar "Generando invitación…". Ver TanStack/query#9068 y #8512.
  //
  // El guard por matchId evita mostrar el link de un partido anterior si el
  // mismo hook se reutiliza para otro partido.
  const invite = create.data && create.data.matchId === matchId ? create.data : null
  const errorMessage = create.error ? getApiErrorMessage(create.error) : null
  // El back responde 403 (o 400) con "…inscríbete…" cuando se intenta invitar sin
  // estar inscrito; en ese caso ofrecemos inscribirse y reintentar.
  const inviteErrorStatus = isAxiosError(create.error) ? create.error.response?.status : undefined
  const inviteErrorMessage = isAxiosError(create.error)
    ? String(create.error.response?.data?.message ?? create.error.message ?? '')
    : ''
  const needsToRegister =
    (inviteErrorStatus === 403 ||
      (inviteErrorStatus === 400 && /inscri/i.test(inviteErrorMessage))) &&
    /inscri/i.test(inviteErrorMessage)

  const whatsappUrl = invite
    ? `https://wa.me/?text=${encodeURIComponent(
        `⚽ Te invito a jugar: ${matchPlace} (Gol FC). Únete con este link: ${invite.url} · Código: ${invite.code}`,
      )}`
    : '#'


  return (
    <ModalBackdrop onClose={onClose} titleId="invite-friends-title">
      <div
        role="document"
        aria-labelledby="invite-friends-title"
        className="w-full max-w-md rounded-2xl bg-card p-6 text-card-foreground shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            <div>
              <h2 id="invite-friends-title" className="font-bold">
                Invitar amigos
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparte el link o el código para <span className="font-medium">{matchPlace}</span>.
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
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                {needsToRegister && (
                  <Button
                    onClick={async () => {
                      try {
                        await register.mutateAsync()
                        create.mutate(matchId)
                      } catch (err) {
                        toast.error(getApiErrorMessage(err))
                      }
                    }}
                    loading={register.isPending || create.isPending}
                  >
                    {register.isPending ? 'Inscribiendo...' : 'Inscribirme y crear invitación'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    create.mutate(matchId)
                  }}
                  loading={create.isPending}
                >
                  <RefreshCw /> Reintentar
                </Button>
              </div>
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
                . Quien lo reciba puede unirse creando una cuenta o iniciando sesión.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    create.mutate(matchId)
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
                        title: 'Te invitan a un partido',
                        text: `Únete a ${matchPlace} en Gol FC. Código: ${invite.code}`,
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

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('No se pudo copiar. Cópialo manualmente.')
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={copy} className="shrink-0">
      {copied ? <Check className="text-primary" /> : <Copy />}
      <span className="hidden sm:inline">{copied ? 'Copiado' : label}</span>
    </Button>
  )
}
