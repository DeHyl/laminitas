export const ETAPAS = [
  { min: 0,    label: 'Fase de Grupos',    emoji: '⚽', key: 'fase_de_grupos' },
  { min: 150,  label: 'Octavos de Final',  emoji: '🏟️', key: 'octavos_de_final' },
  { min: 350,  label: 'Cuartos de Final',  emoji: '⚡', key: 'cuartos_de_final' },
  { min: 650,  label: 'Semifinal',         emoji: '🔥', key: 'semifinal' },
  { min: 1000, label: 'Final',             emoji: '🏆', key: 'final' },
  { min: 1500, label: 'Campeón del Mundo', emoji: '🌟', key: 'campeon_del_mundo' },
] as const

export type Etapa = typeof ETAPAS[number]

export function etapaForGoles(total: number): Etapa {
  return [...ETAPAS].reverse().find(r => total >= r.min)!
}

export function nextEtapa(total: number): Etapa | null {
  return ETAPAS.find(r => r.min > total) ?? null
}

export function progressToNext(total: number): number {
  const next = nextEtapa(total)
  if (!next) return 100
  const current = etapaForGoles(total)
  const range = next.min - current.min
  const progress = total - current.min
  return Math.round((progress / range) * 100)
}
