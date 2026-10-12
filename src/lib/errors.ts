import { isAxiosError } from 'axios'

// Traduce cualquier error de una llamada axios a un mensaje humano.
// - Respuesta del backend → `response.data.message` (string, o array de errores
//   de class-validator unido con comas, mostrando solo los primeros).
// - AxiosError sin respuesta (red caída / servidor caído) → aviso de conexión.
// - Cualquier otro caso → `fallback`.
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Sin conexión con el servidor.'
    const message: unknown = error.response.data?.message
    if (typeof message === 'string' && message.trim()) return message
    if (Array.isArray(message)) {
      const joined = message
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
        .slice(0, 5)
        .join(', ')
      if (joined) return joined
    }
  }
  return fallback
}
