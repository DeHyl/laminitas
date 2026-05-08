import { supabase } from './supabase'

function toEmail(apodo: string): string {
  return `${apodo.toLowerCase().replace(/[^a-z0-9]/g, '')}@laminitas.app`
}

export async function checkApodo(apodo: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('sign-in', {
    body: { action: 'check', apodo },
  })
  if (error) throw new Error(error.message)
  return (data as { exists: boolean }).exists
}

export async function createUser(apodo: string, pin: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('sign-in', {
    body: { action: 'create', apodo, pin },
  })
  if (error) throw new Error(error.message)
  if ((data as { error?: string }).error) throw new Error((data as { error: string }).error)
}

export async function loginUser(apodo: string, pin: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(apodo),
    password: pin,
  })
  if (error) throw new Error('PIN incorrecto')
  return data.user.id
}
