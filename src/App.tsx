import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Entrada from './pages/Entrada'
import Album from './pages/Album'
import Tablon from './pages/Tablon'
import Amigos from './pages/Amigos'
import Gamificacion from './pages/Gamificacion'
import ChatDT from './components/ChatDT'

export type Tab = 'album' | 'tablon' | 'amigos' | 'gamificacion'

export interface AppUser {
  id: string
  apodo: string
  puntos_total: number
  rango: string
  avatar_url: string | null
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('album')

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (!cancelled && data) setUser(data as AppUser)
        }
      } catch (e) {
        console.error('[laminitas] auth init error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setUser(data as AppUser)
        } catch { /* ignore */ }
      } else {
        setUser(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Handle invite token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('t')
    if (token && user) {
      supabase.functions.invoke('accept-invite', { body: { token } })
        .then(() => {
          window.history.replaceState({}, '', '/')
        })
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Entrada onLogin={setUser} />
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'album',       label: 'Mi Álbum',  icon: '📖' },
    { key: 'tablon',      label: 'Fichajes',   icon: '🔄' },
    { key: 'amigos',      label: 'Amigos',     icon: '👥' },
    { key: 'gamificacion',label: 'Goles',      icon: '⚽' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <div className="flex-1 overflow-y-auto pb-16">
        {tab === 'album'        && <Album user={user} />}
        {tab === 'tablon'       && <Tablon user={user} />}
        {tab === 'amigos'       && <Amigos user={user} />}
        {tab === 'gamificacion' && <Gamificacion user={user} onUserUpdate={setUser} />}
        <ChatDT user={user} />
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
              tab === t.key ? 'text-green-700 font-semibold' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
