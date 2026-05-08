import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const url = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function toEmail(apodo: string): string {
  return `${apodo.toLowerCase().replace(/[^a-z0-9]/g, '')}@laminitas.app`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, apodo, pin } = await req.json()

    if (action === 'check') {
      const { data } = await admin
        .from('users')
        .select('id')
        .eq('apodo', apodo)
        .maybeSingle()
      return new Response(JSON.stringify({ exists: !!data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create') {
      const email = toEmail(apodo)

      // Create auth user with email pre-confirmed (no email flow needed)
      const { data: userData, error: createError } = await admin.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create user profile row
      const { error: insertError } = await admin
        .from('users')
        .insert({ id: userData.user.id, apodo })

      if (insertError) {
        await admin.auth.admin.deleteUser(userData.user.id)
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Acción desconocida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
