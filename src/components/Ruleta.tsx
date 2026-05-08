import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onResult: (resultado: string, valor: number) => void
}

const PRIZES = [
  { resultado: 'pista_lamina',    label: 'Pista de lámina', color: 'bg-blue-500' },
  { resultado: 'puntos_bonus',    label: '¡Puntos bonus!',  color: 'bg-yellow-400' },
  { resultado: 'doble_siguiente', label: 'x2 siguiente',    color: 'bg-purple-500' },
  { resultado: 'nada',            label: 'Mañana es otro día', color: 'bg-gray-400' },
]

export default function Ruleta({ onResult }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ resultado: string; valor: number } | null>(null)
  const [error, setError] = useState('')

  async function handleSpin() {
    if (spinning) return
    setSpinning(true)
    setError('')
    setResult(null)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await supabase.functions.invoke('daily-spin', {
      headers: { Authorization: `Bearer ${session!.access_token}` },
    })

    if (res.error || res.data?.error) {
      setError(res.data?.error ?? 'Error al girar')
      setSpinning(false)
      return
    }

    // Animate spin regardless of result
    const spins = 5 + Math.random() * 5
    const newRotation = rotation + spins * 360
    setRotation(newRotation)

    setTimeout(() => {
      setSpinning(false)
      setResult(res.data)
      onResult(res.data.resultado, res.data.valor)
    }, 2500)
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-1">Tanda de Penales</h3>
      <p className="text-xs text-gray-500 mb-4">Gira una vez al dia si pegaste al menos una lamina</p>

      <div className="flex justify-center mb-4">
        <div
          className="w-32 h-32 rounded-full border-4 border-yellow-400 grid grid-cols-2 grid-rows-2 overflow-hidden transition-transform"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? '2.5s' : '0s', transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' }}
        >
          {PRIZES.map((p, i) => (
            <div key={i} className={`${p.color} flex items-center justify-center p-1`}>
              <span className="text-white text-xs font-bold text-center leading-tight">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
      {result && !result.resultado.includes('error') && (
        <p className="text-green-700 font-bold text-center mb-2">
          {PRIZES.find(p => p.resultado === result.resultado)?.label ?? result.resultado}
          {result.resultado === 'puntos_bonus' && ` (+${result.valor} goles)`}
        </p>
      )}

      <button
        onClick={handleSpin}
        disabled={spinning || !!result}
        className="w-full py-3 rounded-xl bg-yellow-400 text-green-900 font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition active:scale-95"
      >
        {spinning ? 'Girando...' : result ? 'Hasta mañana' : 'Girar'}
      </button>
    </div>
  )
}
