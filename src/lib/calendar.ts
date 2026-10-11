import type { Match } from '@/types/match'

/** Duración por defecto de un partido en el calendario: 2 horas. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

export type CalendarMatch = Pick<Match, 'id' | 'place' | 'dateTime' | 'notes'>

function eventTitle(match: CalendarMatch): string {
  return `⚽ ${match.place} · Árbol de Vida FC`
}

function eventDescription(match: CalendarMatch): string {
  return match.notes?.trim() || 'Partido de fútbol en Árbol de Vida FC.'
}

/** ISO → formato básico UTC de iCalendar: 'YYYYMMDDTHHMMSSZ'. */
function toBasicUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function endIso(match: CalendarMatch): string {
  return new Date(new Date(match.dateTime).getTime() + DEFAULT_DURATION_MS).toISOString()
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** Link "Agregar a Google Calendar" con título, ubicación y notas prescargados. */
export function buildGoogleCalendarUrl(match: CalendarMatch): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(match),
    dates: `${toBasicUtc(match.dateTime)}/${toBasicUtc(endIso(match))}`,
    details: eventDescription(match),
    location: match.place,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Contenido .ics (Apple Calendar / Outlook) del partido. */
export function buildIcs(match: CalendarMatch): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arbol de Vida FC//Partidos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${match.id}@arboldevida.fc`,
    `DTSTAMP:${toBasicUtc(new Date().toISOString())}`,
    `DTSTART:${toBasicUtc(match.dateTime)}`,
    `DTEND:${toBasicUtc(endIso(match))}`,
    `SUMMARY:${escapeIcs(eventTitle(match))}`,
    `LOCATION:${escapeIcs(match.place)}`,
    `DESCRIPTION:${escapeIcs(eventDescription(match))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Descarga el .ics para importarlo en Apple Calendar / Outlook. */
export function downloadMatchIcs(match: CalendarMatch): void {
  const blob = new Blob([buildIcs(match)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `partido-${slugify(match.place) || 'arbol-de-vida'}.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
