import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, Search, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useRecoverEmail } from '@/lib/api-auth'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

type Method = 'phone' | 'question'

export default function RecoverEmailPage() {
  const recover = useRecoverEmail()
  const [method, setMethod] = useState<Method>('phone')
  const [phone, setPhone] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await recover.mutateAsync(
        method === 'phone'
          ? { phone: phone.trim() }
          : { securityQuestion: question.trim(), securityAnswer: answer.trim() },
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const emails = recover.data?.emails ?? []

  return (
    <AuthLayout
      title="Olvidé mi correo"
      subtitle="Recupéralo con tu teléfono o tu pregunta de seguridad"
      backTo="/login"
      backLabel="Volver al inicio de sesión"
    >
      <div className="mb-4 grid grid-cols-2 gap-2">
        <MethodTab
          active={method === 'phone'}
          onClick={() => {
            setMethod('phone')
            recover.reset()
          }}
          icon={<Phone className="size-4" />}
          label="Teléfono"
        />
        <MethodTab
          active={method === 'question'}
          onClick={() => {
            setMethod('question')
            recover.reset()
          }}
          icon={<HelpCircle className="size-4" />}
          label="Pregunta"
        />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {method === 'phone' ? (
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono registrado</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="+56912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={recover.isPending}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="question">Pregunta de seguridad</Label>
              <Input
                id="question"
                required
                placeholder="¿Cuál es tu equipo favorito?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={recover.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Respuesta</Label>
              <Input
                id="answer"
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={recover.isPending}
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" loading={recover.isPending}>
          {!recover.isPending && <Search />}
          Buscar mis correos
        </Button>
      </form>

      {recover.isSuccess && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-muted-foreground">{recover.data?.message}</p>
          {emails.length > 0 && (
            <ul className="space-y-2">
              {emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm"
                >
                  <Mail className="size-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">{email}</span>
                </li>
              ))}
            </ul>
          )}
          {emails.length > 0 && (
            <Button asChild className="w-full">
              <Link to="/login">Ir a iniciar sesión</Link>
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        ¿Recuerdas tu correo?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}

function MethodTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
