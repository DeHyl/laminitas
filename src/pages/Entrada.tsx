import { useState } from 'react'
import { signInOrCreate } from '../lib/auth'
import type { AppUser } from '../App'

interface Props {
  onLogin: (user: AppUser) => void
}

export default function Entrada({ onLogin }: Props) {
  const [apodo, setApodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = apodo.trim()
    if (trimmed.length < 3) {
      setError('El apodo debe tener al menos 3 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await signInOrCreate(trimmed)
      // Fetch full user profile
      const { supabase } = await import('../lib/supabase')
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', result.userId)
        .single()
      if (data) onLogin(data as AppUser)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="text-white text-3xl font-bold">Laminitas</h1>
        <p className="text-green-200 mt-1">Mundial 2026</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-green-100 text-sm mb-1">Tu apodo</label>
          <input
            type="text"
            value={apodo}
            onChange={e => setApodo(e.target.value)}
            placeholder="ej. JuanMiguel10"
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 focus:bg-white/20 transition"
          />
          {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || apodo.trim().length < 3}
          className="w-full py-3 rounded-xl bg-yellow-400 text-green-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition active:scale-95"
        >
          {loading ? 'Entrando...' : '¡Entrar al álbum!'}
        </button>
      </form>

      <p className="text-green-300 text-xs mt-8 text-center">
        Sin contraseña. Solo tu apodo.
      </p>
    </div>
  )
}
