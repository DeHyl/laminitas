import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { etapaForGoles, nextEtapa, progressToNext } from '../lib/points'
import MisionCard from '../components/MisionCard'
import Ruleta from '../components/Ruleta'
import type { AppUser } from '../App'

interface Mission {
  id: string
  titulo: string
  descripcion: string
  valor_objetivo: number
  puntos_bonus: number
  progress?: { valor_actual: number; completada: boolean }
}

interface Props {
  user: AppUser
  onUserUpdate: (u: AppUser) => void
}

export default function Gamificacion({ user, onUserUpdate }: Props) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [leaderboard, setLeaderboard] = useState<{ apodo: string; puntos_total: number; rango: string }[]>([])

  const etapa = etapaForGoles(user.puntos_total)
  const next = nextEtapa(user.puntos_total)
  const pct = progressToNext(user.puntos_total)

  useEffect(() => {
    const now = new Date().toISOString()
    // Load active missions with user progress
    supabase
      .from('missions')
      .select('*, progress:mission_progress!left(valor_actual, completada)')
      .eq('activa', true)
      .lte('inicia_en', now)
      .gte('termina_en', now)
      .then(({ data }) => {
        const ms = (data ?? []).map(m => ({
          ...m,
          progress: Array.isArray(m.progress) ? m.progress.find((_p: { valor_actual: number; completada: boolean }) => true) : m.progress,
        }))
        setMissions(ms)
      })

    // Leaderboard: user + friends sorted by points
    supabase
      .from('friendships')
      .select('friend:users!friend_id(apodo, puntos_total, rango)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const friends = (data ?? []).map((f: { friend: { apodo: string; puntos_total: number; rango: string }[] }) => f.friend[0] as { apodo: string; puntos_total: number; rango: string })
        const all = [{ apodo: user.apodo, puntos_total: user.puntos_total, rango: user.rango }, ...friends]
        all.sort((a, b) => b.puntos_total - a.puntos_total)
        setLeaderboard(all)
      })
  }, [user.id, user.puntos_total])

  const RANGO_EMOJI: Record<string, string> = {
    fase_de_grupos: '⚽', octavos_de_final: '🏟️', cuartos_de_final: '⚡',
    semifinal: '🔥', final: '🏆', campeon_del_mundo: '🌟',
  }

  async function handleSpinResult(resultado: string, valor: number) {
    // Refresh user points after spin
    if (resultado === 'puntos_bonus' && valor > 0) {
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) onUserUpdate(data as AppUser)
    }
  }

  return (
    <div className="p-3 space-y-4">
      {/* Rank card */}
      <div className="bg-green-700 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{RANGO_EMOJI[etapa.key] ?? '⚽'}</span>
          <div>
            <p className="font-black text-lg">{etapa.label}</p>
            <p className="text-green-200 text-sm">{user.puntos_total} goles</p>
          </div>
        </div>
        {next && (
          <>
            <div className="bg-green-900/50 rounded-full h-2 mb-1">
              <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-green-300">{next.min - user.puntos_total} goles para {next.label} {next.emoji}</p>
          </>
        )}
      </div>

      {/* Daily spin */}
      <Ruleta onResult={handleSpinResult} />

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm">
          <h2 className="font-bold text-gray-800 p-4 pb-2">Tabla de posiciones</h2>
          {leaderboard.map((p, i) => (
            <div key={p.apodo} className={`flex items-center gap-3 px-4 py-2 ${p.apodo === user.apodo ? 'bg-green-50' : ''}`}>
              <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
              <span className="text-lg">{RANGO_EMOJI[p.rango] ?? '⚽'}</span>
              <span className={`flex-1 text-sm ${p.apodo === user.apodo ? 'font-bold text-green-800' : 'text-gray-700'}`}>{p.apodo}</span>
              <span className="text-sm font-semibold text-gray-600">{p.puntos_total} ⚽</span>
            </div>
          ))}
        </div>
      )}

      {/* Missions */}
      {missions.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-800 mb-2">Jornadas activas</h2>
          <div className="space-y-2">
            {missions.map(m => <MisionCard key={m.id} mission={m} />)}
          </div>
        </div>
      )}
      {missions.length === 0 && (
        <p className="text-gray-400 text-center py-2 text-sm">No hay jornadas activas</p>
      )}
    </div>
  )
}
