import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../App'

interface Friend {
  friend_id: string
  friend: { apodo: string; puntos_total: number; rango: string }
}

interface Props { user: AppUser }

export default function Amigos({ user }: Props) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('friendships')
      .select('friend_id, friend:users!friend_id(apodo, puntos_total, rango)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setFriends((data ?? []) as unknown as Friend[])
        setLoading(false)
      })
  }, [user.id])

  async function handleGenerarLink() {
    const { data } = await supabase
      .from('friend_invites')
      .insert({ inviter_id: user.id })
      .select('token')
      .single()
    if (data) {
      const link = `${window.location.origin}/?t=${data.token}`
      setInviteLink(link)
    }
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(inviteLink)
    alert('Link copiado')
  }

  const RANGO_EMOJI: Record<string, string> = {
    fase_de_grupos: '⚽', octavos_de_final: '🏟️', cuartos_de_final: '⚡',
    semifinal: '🔥', final: '🏆', campeon_del_mundo: '🌟',
  }

  return (
    <div className="p-3">
      <h1 className="text-xl font-black text-gray-800 mb-4">Amigos</h1>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Cargando...</p>
      ) : friends.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Aun no tienes amigos agregados</p>
      ) : (
        <div className="space-y-2 mb-6">
          {friends.map(f => {
            const fr = f.friend as { apodo: string; puntos_total: number; rango: string }
            return (
              <div key={f.friend_id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">{RANGO_EMOJI[fr.rango] ?? '⚽'}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{fr.apodo}</p>
                  <p className="text-xs text-gray-500">{fr.puntos_total} goles</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-green-50 rounded-xl p-4">
        <h2 className="font-bold text-green-800 mb-3">Invitar amigo</h2>
        {inviteLink ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 break-all bg-white rounded-lg p-2">{inviteLink}</p>
            <button onClick={handleCopiar} className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">
              Copiar link
            </button>
          </div>
        ) : (
          <button onClick={handleGenerarLink} className="w-full bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">
            Generar link de invitacion
          </button>
        )}
      </div>
    </div>
  )
}
