import { useState } from 'react'
import { checkApodo, createUser, loginUser } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../App'

type Step = 'apodo' | 'pin-login' | 'pin-create'

interface Props {
  onLogin: (user: AppUser) => void
}

export default function Entrada({ onLogin }: Props) {
  const [step, setStep] = useState<Step>('apodo')
  const [apodo, setApodo] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApodo(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = apodo.trim()
    if (trimmed.length < 3) {
      setError('El apodo debe tener al menos 3 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const exists = await checkApodo(trimmed)
      setStep(exists ? 'pin-login' : 'pin-create')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return }
    setLoading(true)
    setError('')
    try {
      const userId = await loginUser(apodo.trim(), pin)
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      if (data) onLogin(data as AppUser)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al entrar')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return }
    if (pin !== pinConfirm) { setError('Los PINs no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      await createUser(apodo.trim(), pin)
      const userId = await loginUser(apodo.trim(), pin)
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      if (data) onLogin(data as AppUser)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear cuenta')
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

      {step === 'apodo' && (
        <form onSubmit={handleApodo} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-green-100 text-sm mb-1">Tu apodo</label>
            <input
              type="text"
              value={apodo}
              onChange={e => { setApodo(e.target.value); setError('') }}
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
            {loading ? 'Buscando...' : 'Continuar'}
          </button>
        </form>
      )}

      {step === 'pin-login' && (
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={() => { setStep('apodo'); setPin(''); setError('') }}
            className="text-green-300 text-sm mb-1 flex items-center gap-1"
          >
            ← {apodo.trim()}
          </button>
          <div>
            <label className="block text-green-100 text-sm mb-1">Tu PIN (4 dígitos)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="••••"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-lg text-center tracking-widest bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 focus:bg-white/20 transition"
            />
            {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full py-3 rounded-xl bg-yellow-400 text-green-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition active:scale-95"
          >
            {loading ? 'Entrando...' : '¡Entrar al álbum!'}
          </button>
        </form>
      )}

      {step === 'pin-create' && (
        <form onSubmit={handleCreate} className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={() => { setStep('apodo'); setPin(''); setPinConfirm(''); setError('') }}
            className="text-green-300 text-sm mb-1 flex items-center gap-1"
          >
            ← {apodo.trim()}
          </button>
          <p className="text-green-100 text-sm">
            Apodo nuevo. Elige un PIN de 4 dígitos para proteger tu álbum.
          </p>
          <div>
            <label className="block text-green-100 text-sm mb-1">Elige tu PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="••••"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-lg text-center tracking-widest bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 focus:bg-white/20 transition"
            />
          </div>
          <div>
            <label className="block text-green-100 text-sm mb-1">Confirma tu PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinConfirm}
              onChange={e => { setPinConfirm(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl text-lg text-center tracking-widest bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/60 focus:bg-white/20 transition"
            />
            {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || pin.length !== 4 || pinConfirm.length !== 4}
            className="w-full py-3 rounded-xl bg-yellow-400 text-green-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition active:scale-95"
          >
            {loading ? 'Creando cuenta...' : '¡Crear mi álbum!'}
          </button>
        </form>
      )}
    </div>
  )
}
