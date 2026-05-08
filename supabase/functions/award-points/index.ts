import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ETAPAS = [
  { min: 0,    label: 'fase_de_grupos' },
  { min: 150,  label: 'octavos_de_final' },
  { min: 350,  label: 'cuartos_de_final' },
  { min: 650,  label: 'semifinal' },
  { min: 1000, label: 'final' },
  { min: 1500, label: 'campeon_del_mundo' },
]

function calcRank(total: number): string {
  return [...ETAPAS].reverse().find(r => total >= r.min)!.label
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { user_id, puntos, razon } = await req.json()
  if (!user_id || !puntos || !razon) {
    return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: corsHeaders })
  }

  await supabase.from('user_points').insert({ user_id, puntos, razon })

  const { data: user } = await supabase
    .from('users').select('puntos_total').eq('id', user_id).single()

  const newTotal = (user?.puntos_total ?? 0) + puntos
  const newRank = calcRank(newTotal)

  await supabase.from('users')
    .update({ puntos_total: newTotal, rango: newRank })
    .eq('id', user_id)

  return new Response(JSON.stringify({ puntos_total: newTotal, rango: newRank }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
