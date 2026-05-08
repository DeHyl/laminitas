import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { UserSticker } from '../pages/Album'
import type { Sticker } from '../lib/stickers-data'

interface Props {
  sticker: Sticker & { id?: string }
  userSticker: UserSticker | undefined
  onClose: () => void
  onUpdated: (updated: UserSticker) => void
}

type Estado = 'falta' | 'tengo' | 'repetida'

export default function StickerSheet({ sticker, userSticker, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const current = userSticker?.estado ?? 'falta'

  async function changeEstado(nuevo: Estado) {
    if (nuevo === current) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-sticker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session!.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ sticker_id: sticker.id, nuevo_estado: nuevo, tiene_foto: !!userSticker?.photo_path }),
        }
      )
      if (res.ok) {
        const cantidad = nuevo === 'falta' ? 0 : nuevo === 'tengo' ? 1 : 2
        onUpdated({ ...userSticker, sticker_id: sticker.id!, estado: nuevo, cantidad } as UserSticker)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Compress to JPEG 75% quality
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      const maxDim = 800
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
      canvas.width = bitmap.width * scale
      canvas.height = bitmap.height * scale
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.75))

      const path = `${session.user.id}/${sticker.id}.jpg`
      await supabase.storage.from('sticker-photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

      // Award foto points via mark-sticker EF
      const estado: Estado = current === 'falta' ? 'tengo' : current
      const resEF = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-sticker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ sticker_id: sticker.id, nuevo_estado: estado, tiene_foto: true }),
        }
      )
      if (resEF.ok) {
        onUpdated({
          ...userSticker,
          sticker_id: sticker.id!,
          estado,
          photo_path: path,
          cantidad: estado === 'falta' ? 0 : estado === 'tengo' ? 1 : 2,
        } as UserSticker)
      }
    } finally {
      setUploading(false)
    }
  }

  const ESTADOS: { key: Estado; label: string; color: string }[] = [
    { key: 'falta',    label: 'Me falta',  color: 'bg-gray-200 text-gray-700' },
    { key: 'tengo',    label: 'La tengo',  color: 'bg-green-500 text-white' },
    { key: 'repetida', label: 'Repetida',  color: 'bg-orange-400 text-white' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-2xl z-50 p-5 pb-8 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-2xl font-black text-gray-800">{sticker.codigo}</p>
            <p className="text-gray-600">{sticker.jugador || sticker.equipo}</p>
            <p className="text-xs text-gray-400">{sticker.seccion}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex gap-2 mb-5">
          {ESTADOS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => changeEstado(key)}
              disabled={loading}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition active:scale-95 ring-2 ${
                current === key ? 'ring-gray-800 scale-105' : 'ring-transparent'
              } ${color}`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className={`flex items-center gap-2 justify-center w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm cursor-pointer hover:border-gray-400 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <span>{uploading ? 'Subiendo...' : '📷 Foto de la lámina'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhoto}
          />
        </label>
      </div>
    </>
  )
}
