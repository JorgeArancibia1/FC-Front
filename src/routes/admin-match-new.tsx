import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { MatchForm } from '@/components/match-form'
import { useCreateMatch } from '@/lib/api-matches'
import { getApiErrorMessage } from '@/lib/errors'

export default function AdminMatchNew() {
  const navigate = useNavigate()
  const create = useCreateMatch()

  const errorMessage = create.error ? getApiErrorMessage(create.error) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/partidos">
          <ArrowLeft /> Volver a partidos
        </Link>
      </Button>

      <PageHeader
        title="Nuevo partido"
        description="Programa el encuentro, los cupos y las notas para los jugadores."
      />

      <Card>
        <CardHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="size-5" />
          </div>
          <CardTitle className="text-lg">Datos del partido</CardTitle>
          <CardDescription>Los campos con validación se marcan automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchForm
            submitLabel="Crear partido"
            submitting={create.isPending}
            errorMessage={errorMessage}
            onSubmit={async (input) => {
              try {
                const created = await create.mutateAsync(input)
                toast.success('Partido creado')
                navigate(`/admin/partidos/${created.id}`, { replace: true })
              } catch (err) {
                toast.error(getApiErrorMessage(err))
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
