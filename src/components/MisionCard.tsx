interface Mission {
  id: string
  titulo: string
  descripcion: string
  valor_objetivo: number
  puntos_bonus: number
  progress?: { valor_actual: number; completada: boolean }
}

export default function MisionCard({ mission }: { mission: Mission }) {
  const p = mission.progress
  const val = p?.valor_actual ?? 0
  const pct = Math.min(100, Math.round((val / mission.valor_objetivo) * 100))
  const done = p?.completada

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${done ? 'border-green-400' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-gray-800 text-sm">{mission.titulo}</p>
          <p className="text-xs text-gray-500">{mission.descripcion}</p>
        </div>
        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          +{mission.puntos_bonus} goles
        </span>
      </div>
      <div className="bg-gray-100 rounded-full h-2 mb-1">
        <div className={`h-2 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{val} / {mission.valor_objetivo} minutos jugados</span>
        {done && <span className="text-green-600 font-bold">Clasificado!</span>}
      </div>
    </div>
  )
}
