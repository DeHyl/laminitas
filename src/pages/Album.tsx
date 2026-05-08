import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { STICKERS, EQUIPOS, type Sticker } from '../lib/stickers-data'
import StickerBox from '../components/StickerBox'
import StickerSheet from '../components/StickerSheet'
import type { AppUser } from '../App'

export interface UserSticker {
  id?: string
  sticker_id: string
  estado: 'falta' | 'tengo' | 'repetida'
  cantidad: number
  photo_path: string | null
}

type StickerWithId = Sticker & { id?: string }

interface Props {
  user: AppUser
}

export default function Album({ user }: Props) {
  const [userStickers, setUserStickers] = useState<Map<string, UserSticker>>(new Map())
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map())
  const [selected, setSelected] = useState<StickerWithId | null>(null)
  const [filterEquipo, setFilterEquipo] = useState('')
  const [filterSolo, setFilterSolo] = useState<'todas' | 'repetidas' | 'faltan'>('todas')
  const [loading, setLoading] = useState(true)

  // We need sticker UUIDs from DB — match by numero
  const [stickerIdMap, setStickerIdMap] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    supabase.from('stickers').select('id, numero').then(({ data }) => {
      const m = new Map<number, string>()
      for (const s of data ?? []) m.set(s.numero, s.id)
      setStickerIdMap(m)
    })
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('user_stickers')
        .select('*')
        .eq('user_id', user.id)
      const map = new Map<string, UserSticker>()
      for (const us of data ?? []) map.set(us.sticker_id, us)
      setUserStickers(map)
      setLoading(false)
    }
    load()
  }, [user.id])

  // Generate signed URLs for stickers that have photos
  useEffect(() => {
    async function loadPhotos() {
      const withPhotos = [...userStickers.values()].filter(us => us.photo_path)
      if (withPhotos.length === 0) return
      const urls = new Map<string, string>()
      await Promise.all(
        withPhotos.map(async us => {
          const { data } = await supabase.storage
            .from('sticker-photos')
            .createSignedUrl(us.photo_path!, 300)
          if (data) urls.set(us.sticker_id, data.signedUrl)
        })
      )
      setPhotoUrls(urls)
    }
    loadPhotos()
  }, [userStickers])

  const filtered = useMemo(() => {
    return STICKERS.filter(s => {
      if (filterEquipo && s.equipo !== filterEquipo) return false
      const us = userStickers.get(stickerIdMap.get(s.numero) ?? '')
      if (filterSolo === 'repetidas' && us?.estado !== 'repetida') return false
      if (filterSolo === 'faltan' && (us?.estado === 'tengo' || us?.estado === 'repetida')) return false
      return true
    })
  }, [filterEquipo, filterSolo, userStickers, stickerIdMap])

  // Stats
  const tengo    = [...userStickers.values()].filter(u => u.estado === 'tengo').length
  const repetida = [...userStickers.values()].filter(u => u.estado === 'repetida').length
  const total    = STICKERS.length
  const pct      = Math.round(((tengo + repetida) / total) * 100)

  function handleUpdated(updated: UserSticker) {
    setUserStickers(prev => {
      const next = new Map(prev)
      next.set(updated.sticker_id, updated)
      return next
    })
    setSelected(null)
  }

  if (loading) return <div className="p-4 text-gray-500">Cargando álbum...</div>

  return (
    <div className="p-3">
      {/* Stats bar */}
      <div className="bg-green-700 rounded-xl p-3 mb-3 text-white">
        <div className="flex justify-between text-sm mb-2">
          <span>Tengo: <strong>{tengo}</strong></span>
          <span>Repetidas: <strong>{repetida}</strong></span>
          <span>Faltan: <strong>{total - tengo - repetida}</strong></span>
        </div>
        <div className="bg-green-900/50 rounded-full h-2">
          <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-green-200 mt-1 text-right">{pct}% completado</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <select
          value={filterEquipo}
          onChange={e => setFilterEquipo(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white flex-shrink-0"
        >
          <option value="">Todos los equipos</option>
          {EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
        {(['todas', 'repetidas', 'faltan'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterSolo(f)}
            className={`text-xs px-3 py-1 rounded-lg border flex-shrink-0 transition ${
              filterSolo === f ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'repetidas' ? 'Repetidas' : 'Me faltan'}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="flex flex-wrap gap-1.5">
        {filtered.map(s => {
          const dbId = stickerIdMap.get(s.numero)
          const us = dbId ? userStickers.get(dbId) : undefined
          const photoUrl = dbId ? photoUrls.get(dbId) ?? null : null
          return (
            <StickerBox
              key={s.numero}
              codigo={s.codigo}
              userSticker={us}
              photoUrl={photoUrl}
              onClick={() => setSelected({ ...s, id: dbId })}
            />
          )
        })}
      </div>

      {/* Bottom sheet */}
      {selected && (
        <StickerSheet
          sticker={selected}
          userSticker={selected.id ? userStickers.get(selected.id) : undefined}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
