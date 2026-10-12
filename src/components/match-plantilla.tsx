import { MatchHeroBoard } from '@/components/match-hero-board'
import type { MatchDetail } from '@/types/match'

interface Props {
  match: MatchDetail
  currentUserId?: string
  /**
   * Habilita el arrastrar/soltar para reordenar equipos. Dev, admin y jugador
   * pueden reordenar; se deja como flag por si se quiere volver a restringir.
   */
  canReorder?: boolean
  /**
   * Modo "toda la pantalla": compacta el tablero para que los dos equipos
   * entren completos en un solo alto de viewport. El tablero siempre ocupa el
   * mismo ancho que su contenedor (igual que el resto del contenido).
   */
  fullScreen?: boolean
}

/**
 * Plantilla compartida del partido (tarjetas verdes/azules + foto de cuerpo
 * entero). Es el mismo diseño para Admin y Jugador, y ambos pueden arrastrar
 * tarjetas. Va sobre fondo de cancha para verse igual en claro/oscuro.
 */
export function MatchPlantilla({ match, currentUserId, canReorder, fullScreen }: Props) {
  return (
    <div className="dark overflow-hidden rounded-2xl bg-pitch-vignette shadow-lg ring-1 ring-black/20">
      <MatchHeroBoard
        match={match}
        currentUserId={currentUserId}
        canReorder={canReorder}
        fullScreen={fullScreen}
      />
    </div>
  )
}