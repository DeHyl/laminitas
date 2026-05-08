import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

  const { trade_id } = await req.json()

  const { data: trade } = await supabaseAdmin
    .from('trades').select('*').eq('id', trade_id).single()

  if (!trade) return new Response(JSON.stringify({ error: 'trade not found' }), { status: 404, headers: corsHeaders })
  if (trade.estado !== 'aceptada') return new Response(JSON.stringify({ error: 'trade not accepted' }), { status: 400, headers: corsHeaders })

  const isOfertante = user.id === trade.ofertante_id

  const { data: proposal } = await supabaseAdmin
    .from('trade_proposals')
    .select('proponente_id')
    .eq('trade_id', trade_id)
    .eq('estado', 'aceptada')
    .single()

  if (!proposal) return new Response(JSON.stringify({ error: 'no accepted proposal' }), { status: 400, headers: corsHeaders })

  const updates: Record<string, boolean> = {}
  if (isOfertante) updates.confirmed_ofertante = true
  else if (user.id === proposal.proponente_id) updates.confirmed_proponente = true
  else return new Response(JSON.stringify({ error: 'not a party' }), { status: 403, headers: corsHeaders })

  const { data: updated } = await supabaseAdmin
    .from('trades').update(updates).eq('id', trade_id).select().single()

  if (updated?.confirmed_ofertante && updated?.confirmed_proponente) {
    const awardFetch = (uid: string, pts: number, razon: string) =>
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/award-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
        body: JSON.stringify({ user_id: uid, puntos: pts, razon }),
      })

    await awardFetch(trade.ofertante_id, 25, 'intercambio')
    await awardFetch(proposal.proponente_id, 25, 'intercambio')

    const today = new Date().toISOString().split('T')[0]!
    for (const uid of [trade.ofertante_id, proposal.proponente_id]) {
      const { data: todayTrades } = await supabaseAdmin
        .from('user_points')
        .select('id')
        .eq('user_id', uid)
        .eq('razon', 'intercambio')
        .gte('created_at', today + 'T00:00:00Z')

      if (todayTrades && todayTrades.length === 1) {
        await awardFetch(uid, 15, 'bonus_dia')
      }
    }

    await supabaseAdmin.from('trades').update({ estado: 'cerrada' }).eq('id', trade_id)
  }

  return new Response(JSON.stringify({ ok: true, both_confirmed: updated?.confirmed_ofertante && updated?.confirmed_proponente }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
