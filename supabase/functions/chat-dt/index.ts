import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')!
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }

  // Build album context
  const [userRow, userStickers, friendships] = await Promise.all([
    supabaseAdmin.from('users').select('apodo, puntos_total, rango').eq('id', user.id).single(),
    supabaseAdmin.from('user_stickers').select('sticker_id, estado, cantidad, sticker:stickers!sticker_id(codigo, equipo, seccion)').eq('user_id', user.id),
    supabaseAdmin.from('friendships').select('friend_id, friend:users!friend_id(apodo)').eq('user_id', user.id),
  ])

  const tengo = userStickers.data?.filter(us => us.estado === 'tengo') ?? []
  const repetidas = userStickers.data?.filter(us => us.estado === 'repetida') ?? []
  const faltan = userStickers.data?.filter(us => us.estado === 'falta') ?? []

  // Get friends' repeated stickers for trade hints
  const friendIds = friendships.data?.map(f => f.friend_id) ?? []
  let friendsRepetidas: { apodo: string; stickers: string[] }[] = []
  if (friendIds.length > 0) {
    const { data: fr } = await supabaseAdmin
      .from('user_stickers')
      .select('user_id, sticker_id, sticker:stickers!sticker_id(codigo), owner:users!user_id(apodo)')
      .in('user_id', friendIds)
      .eq('estado', 'repetida')
    friendsRepetidas = friendIds.map(fid => {
      const fName = friendships.data?.find(f => f.friend_id === fid)?.friend
      const fStickers = fr?.filter(s => s.user_id === fid).map(s => (s.sticker as { codigo: string }).codigo) ?? []
      return { apodo: (fName as { apodo: string })?.apodo ?? fid, stickers: fStickers }
    })
  }

  const systemPrompt = `Eres "El DT", el asistente experto del álbum Panini Mundial 2026 para ${userRow.data?.apodo ?? 'el usuario'}.

Estado actual del álbum:
- Láminas que tiene: ${tengo.length} (${Math.round(tengo.length / 63 * 100)}% del álbum)
- Láminas repetidas: ${repetidas.length} (${repetidas.map(r => (r.sticker as { codigo: string }).codigo).join(', ') || 'ninguna'})
- Goles acumulados: ${userRow.data?.puntos_total ?? 0}
- Etapa actual: ${userRow.data?.rango ?? 'fase_de_grupos'}

${friendsRepetidas.length > 0 ? `Repetidas de amigos (potenciales intercambios):
${friendsRepetidas.map(f => `- ${f.apodo}: ${f.stickers.join(', ') || 'ninguna'}`).join('\n')}` : ''}

Responde siempre en español, de manera entusiasta y breve (máx 3 oraciones). Usa terminología del fútbol. Cuando veas una oportunidad concreta de intercambio, usa la herramienta sugerir_intercambio para estructurarlo.`

  const tools: Anthropic.Tool[] = [
    {
      name: 'sugerir_intercambio',
      description: 'Sugiere un intercambio concreto entre el usuario y un amigo',
      input_schema: {
        type: 'object' as const,
        properties: {
          amigo: { type: 'string', description: 'Apodo del amigo' },
          lam_doy: { type: 'string', description: 'Código de la lámina que el usuario daría' },
          lam_busco: { type: 'string', description: 'Código de la lámina que el usuario busca' },
          razon: { type: 'string', description: 'Razón breve de la sugerencia' },
        },
        required: ['amigo', 'lam_doy', 'lam_busco', 'razon'],
      },
    },
    {
      name: 'buscar_laminas_faltantes',
      description: 'Indica qué láminas faltan para completar una sección',
      input_schema: {
        type: 'object' as const,
        properties: {
          seccion: { type: 'string', description: 'Nombre de la sección del álbum' },
        },
        required: ['seccion'],
      },
    },
    {
      name: 'ver_progreso_seccion',
      description: 'Muestra el progreso de una sección del álbum',
      input_schema: {
        type: 'object' as const,
        properties: {
          seccion: { type: 'string' },
        },
        required: ['seccion'],
      },
    },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    system: systemPrompt,
    tools,
    messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  })

  let text = ''
  let suggestedAction = null

  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text
    } else if (block.type === 'tool_use' && block.name === 'sugerir_intercambio') {
      suggestedAction = { type: 'intercambio', ...block.input }
    }
  }

  return new Response(JSON.stringify({ text: text.trim(), suggestedAction }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
