import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TradeCard from '../components/TradeCard'
import type { AppUser } from '../App'

export interface Trade {
  id: string
  ofertante_id: string
  lam_doy_id: string
  lam_busco_id: string
  estado: string
  created_at: string
  ofertante?: { apodo: string }
  lamina_doy?: { codigo: string; jugador: string }
  lamina_busco?: { codigo: string; jugador: string }
}

interface Props { user: AppUser }

export default function Tablon({ user }: Props) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [doyId, setDoyId] = useState('')
  const [buscoId, setBuscoId] = useState('')
  const [myRepetidas, setMyRepetidas] = useState<{ sticker_id: string; sticker: { id: string; codigo: string } }[]>([])
  const [allStickers, setAllStickers] = useState<{ id: string; codigo: string; jugador: string }[]>([])

  async function loadTrades() {
    const { data } = await supabase
      .from('trades')
      .select(`id, ofertante_id, lam_doy_id, lam_busco_id, estado, created_at,
        ofertante:users!ofertante_id(apodo),
        lamina_doy:stickers!lam_doy_id(codigo, jugador),
        lamina_busco:stickers!lam_busco_id(codigo, jugador)`)
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false })
    setTrades((data ?? []) as Trade[])
    setLoading(false)
  }

  useEffect(() => {
    loadTrades()
    // Real-time subscription
    const channel = supabase
      .channel('trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, loadTrades)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    // Load user's repeated stickers for the offer form
    supabase
      .from('user_stickers')
      .select('sticker_id, sticker:stickers!sticker_id(id, codigo)')
      .eq('user_id', user.id)
      .eq('estado', 'repetida')
      .then(({ data }) => setMyRepetidas((data ?? []) as typeof myRepetidas))

    supabase
      .from('stickers')
      .select('id, codigo, jugador')
      .order('numero')
      .then(({ data }) => setAllStickers(data ?? []))
  }, [user.id])

  async function handlePublicar(e: React.FormEvent) {
    e.preventDefault()
    if (!doyId || !buscoId) return
    await supabase.from('trades').insert({
      ofertante_id: user.id,
      lam_doy_id: doyId,
      lam_busco_id: buscoId,
    })
    setShowForm(false)
    setDoyId('')
    setBuscoId('')
    loadTrades()
  }

  async function handleProponer(tradeId: string) {
    await supabase.from('trade_proposals').insert({
      trade_id: tradeId,
      proponente_id: user.id,
    })
    alert('Propuesta enviada')
  }

  async function handleRetirar(tradeId: string) {
    await supabase.from('trades').update({ estado: 'cerrada' }).eq('id', tradeId)
    loadTrades()
  }

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-gray-800">Mercado de Fichajes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold"
        >
          + Publicar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePublicar} className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lámina que doy (mis repetidas)</label>
            <select value={doyId} onChange={e => setDoyId(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecciona...</option>
              {myRepetidas.map(r => (
                <option key={r.sticker_id} value={r.sticker_id}>{(r.sticker as { codigo: string }).codigo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lámina que busco</label>
            <select value={buscoId} onChange={e => setBuscoId(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecciona...</option>
              {allStickers.map(s => (
                <option key={s.id} value={s.id}>{s.codigo} — {s.jugador}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">Publicar</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8">Cargando...</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay intercambios abiertos</p>
      ) : (
        <div className="space-y-3">
          {trades.map(t => (
            <TradeCard key={t.id} trade={t} currentUser={user} onProponer={handleProponer} onRetirar={handleRetirar} />
          ))}
        </div>
      )}
    </div>
  )
}
