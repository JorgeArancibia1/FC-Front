import { Activity, Database, Mail, ShieldCheck, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ErrorState, PageLoader } from '@/components/ui/feedback'
import { useDevSystem } from '@/lib/api-dev'
import { ROLE_LABEL } from '@/lib/roles'
import type { UserRole } from '@/types/auth'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

const ROLE_ORDER: UserRole[] = ['developer', 'admin', 'usuario']

const STATUS_LABEL: Record<string, string> = {
  open: 'Abiertos',
  closed: 'Cupo completo',
  cancelled: 'Cancelados',
  finished: 'Finalizados',
}

export default function DevSystemPage() {
  const { data, isPending, isError, error } = useDevSystem()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Panel de desarrollador"
        description="Configuración avanzada y estado del sistema. Solo visible para cuentas de desarrollador."
      />

      {isPending && <PageLoader label="Cargando estado del sistema…" />}

      {isError && (
        <ErrorState title="No se pudo cargar el panel" description={(error as Error)?.message} />
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<Users className="size-4" />} label="Usuarios" value={data.totals.users} />
            <StatCard
              icon={<Activity className="size-4" />}
              label="Activos"
              value={data.totals.activeUsers}
            />
            <StatCard
              icon={<Database className="size-4" />}
              label="Partidos"
              value={data.totals.matches}
            />
            <StatCard
              icon={<ShieldCheck className="size-4" />}
              label="Inscripciones"
              value={data.totals.registrations}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuarios por rol</CardTitle>
                <CardDescription>Cuentas registradas en cada nivel de acceso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ROLE_ORDER.map((role) => (
                  <Row key={role} label={ROLE_LABEL[role]} value={data.roleCounts[role] ?? 0} />
                ))}
                <Row label="Invitaciones generadas" value={data.totals.invites} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partidos por estado</CardTitle>
                <CardDescription>Distribución de los partidos creados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(STATUS_LABEL).map((status) => (
                  <Row key={status} label={STATUS_LABEL[status]} value={data.matchesByStatus[status] ?? 0} />
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entorno</CardTitle>
              <CardDescription>Configuración actual del servidor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <StatCard
                icon={<Database className="size-4" />}
                label="Ambiente"
                value={data.environment}
              />
              <StatCard
                icon={<Activity className="size-4" />}
                label="Tiempo activo"
                value={formatUptime(data.uptimeSeconds)}
              />
              <StatCard
                icon={<Mail className="size-4" />}
                label="Correo (SMTP)"
                value={data.mailConfigured ? 'Configurado' : 'No configurado'}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon} {label}
        </div>
        <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  )
}
