import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchForm } from '@/components/match-form'
import { useCreateMatch } from '@/lib/api-matches'
import { getApiErrorMessage } from '@/lib/errors'

export default function AdminMatchNew() {
  const navigate = useNavigate()
  const create = useCreateMatch()

  // Error inline (además del toast): null mientras no haya error.
  const errorMessage = create.error ? getApiErrorMessage(create.error) : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/admin/partidos">
          <ArrowLeft /> Volver
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo partido</CardTitle>
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
