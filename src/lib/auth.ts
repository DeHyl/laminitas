import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Call Edge Functions directly with fetch — bypasses Supabase client session state
// which can be stuck in limbo after the getSession timeout + local signOut.
async function callEdgeFn(body: object): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

function toEmail(apodo: string): string {
  return `${apodo.toLowerCase().replace(/[^a-z0-9]/g, '')}@laminitas.app`
}

export async function checkApodo(apodo: string): Promise<boolean> {
  const data = await callEdgeFn({ action: 'check', apodo }) as { exists: boolean }
  return data.exists
}

export async function createUser(apodo: string, pin: string): Promise<void> {
  const data = await callEdgeFn({ action: 'create', apodo, pin }) as { ok?: boolean; error?: string }
  if (data.error) throw new Error(data.error)
}

export async function loginUser(apodo: string, pin: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(apodo),
    password: pin,
  })
  if (error) throw new Error('PIN incorrecto')
  return data.user.id
}
