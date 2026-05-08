import { supabase } from './supabase'

export async function signInOrCreate(apodo: string): Promise<{ userId: string; apodo: string }> {
  // Check if apodo already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, apodo')
    .eq('apodo', apodo)
    .single()

  if (existing) {
    // Sign in anonymously and we'll reuse the profile by apodo
    const { data: authData, error } = await supabase.auth.signInAnonymously()
    if (error || !authData.user) throw new Error(error?.message ?? 'Auth failed')
    // Note: existing user sessions are stored in localStorage by Supabase SDK
    return { userId: existing.id, apodo: existing.apodo }
  }

  // New user — sign in anonymously then create profile
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
  if (authError || !authData.user) throw new Error(authError?.message ?? 'Auth failed')

  const { error: insertError } = await supabase
    .from('users')
    .insert({ id: authData.user.id, apodo })

  if (insertError) throw new Error(insertError.message)

  return { userId: authData.user.id, apodo }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
  return data
}
