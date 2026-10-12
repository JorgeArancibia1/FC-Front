import { useState, type FormEvent } from 'react'
import { Calendar, Hash, MapPin, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fromDateTimeLocal } from '@/lib/format'

interface FormValues {
  place: string
  dateTimeLocal: string
  requiredPlayers: number
  notes: string
}

interface Props {
  initial?: Partial<FormValues>
  submitLabel: string
  submitting: boolean
  errorMessage?: string | string[] | null
  onSubmit: (input: {
    place: string
    dateTime: string
    requiredPlayers: number
    notes?: string
  }) => void | Promise<void>
}

export function MatchForm({ initial, submitLabel, submitting, errorMessage, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>({
    place: initial?.place ?? '',
    dateTimeLocal: initial?.dateTimeLocal ?? '',
    requiredPlayers: initial?.requiredPlayers ?? 14,
    notes: initial?.notes ?? '',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await onSubmit({
        place: values.place.trim(),
        dateTime: fromDateTimeLocal(values.dateTimeLocal),
        requiredPlayers: Number(values.requiredPlayers),
        notes: values.notes.trim() || undefined,
      })
    } catch {
      // El error ya lo maneja quien dispara la mutación (toast + errorMessage).
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="place" className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" /> Lugar
        </Label>
        <Input
          id="place"
          placeholder="Centro deportivo Laurita Vicuña"
          required
          maxLength={150}
          value={values.place}
          onChange={(e) => setValues((v) => ({ ...v, place: e.target.value }))}
          disabled={submitting}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateTime" className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Fecha y hora
          </Label>
          <Input
            id="dateTime"
            type="datetime-local"
            required
            value={values.dateTimeLocal}
            onChange={(e) => setValues((v) => ({ ...v, dateTimeLocal: e.target.value }))}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">En tu zona horaria local.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requiredPlayers" className="flex items-center gap-1.5">
            <Hash className="size-3.5 text-primary" /> Cupos de jugadores
          </Label>
          <Input
            id="requiredPlayers"
            type="number"
            min={2}
            max={99}
            required
            value={values.requiredPlayers}
            onChange={(e) => setValues((v) => ({ ...v, requiredPlayers: Number(e.target.value) }))}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">Capacidad total del partido (ej. 14).</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-1.5">
          <StickyNote className="size-3.5 text-primary" /> Notas (opcional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Traer pechera blanca, llegar 10 min antes…"
          maxLength={500}
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          disabled={submitting}
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
