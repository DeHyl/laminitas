import type { Trade } from '../pages/Tablon'
import type { AppUser } from '../App'

interface Props {
  trade: Trade
  currentUser: AppUser
  onProponer: (tradeId: string) => void
  onRetirar: (tradeId: string) => void
}

export default function TradeCard({ trade, currentUser, onProponer, onRetirar }: Props) {
  const isOwn = trade.ofertante_id === currentUser.id
  const since = new Date(trade.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800">{trade.ofertante?.apodo ?? 'Usuario'}</span>
        <span className="text-xs text-gray-400">{since}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">Doy</div>
          <div className="bg-orange-100 text-orange-700 font-bold rounded-lg py-1 px-2 text-sm">{trade.lamina_doy?.codigo ?? '?'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{trade.lamina_doy?.jugador}</div>
        </div>
        <div className="text-gray-400 text-xl">⇄</div>
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">Busco</div>
          <div className="bg-green-100 text-green-700 font-bold rounded-lg py-1 px-2 text-sm">{trade.lamina_busco?.codigo ?? '?'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{trade.lamina_busco?.jugador}</div>
        </div>
      </div>
      {isOwn ? (
        <button
          onClick={() => onRetirar(trade.id)}
          className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition"
        >
          Retirar oferta
        </button>
      ) : (
        <button
          onClick={() => onProponer(trade.id)}
          className="w-full py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition active:scale-95"
        >
          Proponer intercambio
        </button>
      )}
    </div>
  )
}
