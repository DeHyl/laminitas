import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PRIZES = [
  { resultado: 'pista_lamina',    weight: 30 },
  { resultado: 'puntos_bonus',    weight: 25 },
  { resultado: 'doble_siguiente', weight: 10 },
  { resultado: 'nada',            weight: 35 },
] as const

function spin(): string {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const prize of PRIZES) {
    r -= prize.weight
    if (r <= 0) return prize.resultado
  }
  return 'nada'
}

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

  const today = new Date().toISOString().split('T')[0]!

  const { data: existing } = await supabaseAdmin
    .from('daily_spins')
    .select('id, resultado, valor')
    .eq('user_id', user.id)
    .eq('fecha', today)
    .single()

  if (existing) {
    return new Response(JSON.stringify({ already_spun: true, resultado: existing.resultado, valor: existing.valor }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const todayStart = today + 'T00:00:00Z'
  const { data: todayPoints } = await supabaseAdmin
    .from('user_points')
    .select('id')
    .eq('user_id', user.id)
    .eq('razon', 'lamina_nueva')
    .gte('created_at', todayStart)

  if (!todayPoints || todayPoints.length === 0) {
    return new Response(JSON.stringify({ error: 'pega al menos una lamina hoy primero' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resultado = spin()
  let valor = 0

  if (resultado === 'puntos_bonus') {
    valor = [5, 10, 20][Math.floor(Math.random() * 3)]!
  } else if (resultado === 'pista_lamina') {
    const { data: hint } = await supabaseAdmin
      .from('user_stickers')
      .select('sticker_id')
      .eq('estado', 'repetida')
      .neq('user_id', user.id)
      .limit(1)
      .single()
    valor = hint ? 1 : 0
  }

  await supabaseAdmin.from('daily_spins').insert({
    user_id: user.id,
    fecha: today,
    resultado,
    valor,
  })

  if (resultado === 'puntos_bonus' && valor > 0) {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/award-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
      body: JSON.stringify({ user_id: user.id, puntos: valor, razon: 'bonus_dia' }),
    })
  }

  return new Response(JSON.stringify({ resultado, valor }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
