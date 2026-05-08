import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')!
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

  const { sticker_id, nuevo_estado, tiene_foto } = await req.json()

  const cantidad = nuevo_estado === 'falta' ? 0 : nuevo_estado === 'tengo' ? 1 : 2

  const { data: existing } = await supabaseAdmin
    .from('user_stickers')
    .select('estado, cantidad, photo_path')
    .eq('user_id', user.id)
    .eq('sticker_id', sticker_id)
    .single()

  const eraFalta = !existing || existing.estado === 'falta'
  const esNueva = eraFalta && nuevo_estado !== 'falta'

  await supabaseAdmin.from('user_stickers').upsert({
    user_id: user.id,
    sticker_id,
    estado: nuevo_estado,
    cantidad,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,sticker_id' })

  const awarded: string[] = []

  const awardFetch = (uid: string, pts: number, razon: string) =>
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/award-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
      body: JSON.stringify({ user_id: uid, puntos: pts, razon }),
    })

  if (esNueva) {
    await awardFetch(user.id, 10, 'lamina_nueva')
    awarded.push('lamina_nueva')
  }

  if (tiene_foto && !existing?.photo_path) {
    await awardFetch(user.id, 5, 'foto')
    awarded.push('foto')
  }

  const { data: sticker } = await supabaseAdmin
    .from('stickers').select('seccion').eq('id', sticker_id).single()

  if (sticker) {
    const { data: sectionStickers } = await supabaseAdmin
      .from('stickers').select('id').eq('seccion', sticker.seccion)

    const sectionIds = sectionStickers?.map(s => s.id) ?? []

    const { data: owned } = await supabaseAdmin
      .from('user_stickers')
      .select('sticker_id')
      .eq('user_id', user.id)
      .in('sticker_id', sectionIds)
      .neq('estado', 'falta')

    if (owned && owned.length === sectionIds.length) {
      await awardFetch(user.id, 50, 'seccion_completa')
      awarded.push('seccion_completa')
    }
  }

  if (esNueva) {
    const now = new Date().toISOString()
    const { data: missions } = await supabaseAdmin
      .from('missions')
      .select('id')
      .eq('metrica', 'laminas_pegadas')
      .eq('activa', true)
      .lte('inicia_en', now)
      .gte('termina_en', now)

    for (const mission of missions ?? []) {
      const { data: prog } = await supabaseAdmin
        .from('mission_progress')
        .select('id, valor_actual, completada')
        .eq('mission_id', mission.id)
        .eq('user_id', user.id)
        .single()

      if (prog?.completada) continue

      const newVal = (prog?.valor_actual ?? 0) + 1
      const { data: mData } = await supabaseAdmin
        .from('missions').select('valor_objetivo, puntos_bonus').eq('id', mission.id).single()

      const isComplete = newVal >= (mData?.valor_objetivo ?? 999)

      await supabaseAdmin.from('mission_progress').upsert({
        mission_id: mission.id,
        user_id: user.id,
        valor_actual: newVal,
        completada: isComplete,
        completada_en: isComplete ? new Date().toISOString() : null,
      }, { onConflict: 'mission_id,user_id' })

      if (isComplete) {
        await awardFetch(user.id, mData?.puntos_bonus ?? 0, 'mision_completada')
        awarded.push('mision_completada')
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, awarded }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
