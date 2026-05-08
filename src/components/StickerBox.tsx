import type { UserSticker } from '../pages/Album'

interface Props {
  codigo: string
  userSticker: UserSticker | undefined
  photoUrl: string | null
  onClick: () => void
}

export default function StickerBox({ codigo, userSticker, photoUrl, onClick }: Props) {
  const estado = userSticker?.estado ?? 'falta'

  const bgClass =
    estado === 'tengo'    ? 'bg-green-500 border-green-600' :
    estado === 'repetida' ? 'bg-orange-400 border-orange-500' :
                            'bg-gray-200 border-gray-300 border-dashed'

  const textClass =
    estado === 'falta' ? 'text-gray-400' : 'text-white'

  return (
    <button
      onClick={onClick}
      className={`relative w-13 h-17 rounded border-2 flex flex-col items-center justify-center text-xs font-bold overflow-hidden transition active:scale-95 ${bgClass}`}
      style={{ width: 52, height: 68 }}
    >
      {photoUrl && estado !== 'falta' && (
        <img
          src={photoUrl}
          alt={codigo}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <span className={`relative z-10 ${textClass} text-center px-0.5 leading-tight`}>
        {codigo}
      </span>
      {estado === 'repetida' && userSticker && (
        <span className="relative z-10 text-white text-xs font-black">
          &times;{userSticker.cantidad}
        </span>
      )}
    </button>
  )
}
