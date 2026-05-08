import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../App'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SuggestedAction {
  type: 'intercambio'
  amigo: string
  lam_doy: string
  lam_busco: string
  razon: string
}

interface Props {
  user: AppUser
  onPublicarIntercambio?: (lamDoy: string, lamBusco: string) => void
}

export default function ChatDT({ user, onPublicarIntercambio }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<SuggestedAction | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hola ${user.apodo}! Soy El DT, tu asesor del album. Preguntame sobre intercambios, laminas que te faltan, o cualquier estrategia para completar tu coleccion.`,
      }])
    }
  }, [open])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setPendingAction(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('chat-dt', {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: { messages: newMessages },
      })

      if (res.data?.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.text }])
      }
      if (res.data?.suggestedAction) {
        setPendingAction(res.data.suggestedAction)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con El DT. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-600 transition active:scale-95 z-30"
        title="El DT - Asistente"
      >
        🧑‍💼
      </button>

      {/* Full-screen chat overlay */}
      {open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md mx-auto">
          {/* Header */}
          <div className="bg-green-700 text-white px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🧑‍💼</span>
            <div className="flex-1">
              <p className="font-bold">El DT</p>
              <p className="text-xs text-green-200">Asesor del album</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white text-2xl leading-none">&times;</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                  <span className="text-gray-400 text-sm">El DT esta pensando...</span>
                </div>
              </div>
            )}

            {/* Suggested action card */}
            {pendingAction && pendingAction.type === 'intercambio' && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
                <p className="text-xs font-bold text-yellow-800 mb-1">Intercambio sugerido</p>
                <p className="text-sm text-gray-700 mb-1">
                  Con <strong>{pendingAction.amigo}</strong>: das <strong>{pendingAction.lam_doy}</strong> y recibes <strong>{pendingAction.lam_busco}</strong>
                </p>
                <p className="text-xs text-gray-500 mb-2">{pendingAction.razon}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onPublicarIntercambio?.(pendingAction.lam_doy, pendingAction.lam_busco)
                      setPendingAction(null)
                      setOpen(false)
                    }}
                    className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Publicar oferta
                  </button>
                  <button
                    onClick={() => setPendingAction(null)}
                    className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Preguntale algo al DT..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-green-600 text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  )
}
