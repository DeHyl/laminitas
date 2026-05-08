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

  const { token } = await req.json()
  if (!token) return new Response(JSON.stringify({ error: 'missing token' }), { status: 400, headers: corsHeaders })

  const { data: invite } = await supabaseAdmin
    .from('friend_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) return new Response(JSON.stringify({ error: 'invalid token' }), { status: 404, headers: corsHeaders })
  if (invite.used_by) return new Response(JSON.stringify({ error: 'already used' }), { status: 409, headers: corsHeaders })
  if (new Date(invite.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'expired' }), { status: 410, headers: corsHeaders })
  if (invite.inviter_id === user.id) return new Response(JSON.stringify({ error: 'cannot accept own invite' }), { status: 400, headers: corsHeaders })

  await supabaseAdmin.from('friendships').upsert([
    { user_id: invite.inviter_id, friend_id: user.id },
    { user_id: user.id, friend_id: invite.inviter_id },
  ], { onConflict: 'user_id,friend_id' })

  await supabaseAdmin.from('friend_invites')
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return new Response(JSON.stringify({ ok: true, friend_id: invite.inviter_id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
