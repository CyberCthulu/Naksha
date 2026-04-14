import supabase from './supabase'

/**
 * Builds the deep link that Supabase will use in its verification email.
 * In dev (Expo), this resolves to an exp:// URL.
 * In a built app, this resolves to your scheme, e.g. naksha://auth/callback
 */
function getRedirectTo() {
  const url = 'naksha://auth/callback'
  console.log('🔗 Supabase emailRedirectTo:', url)
  return url
}

export type ProfileMeta = {
  first_name?: string
  last_name?: string
  birth_date?: string
  birth_time?: string
  birth_location?: string
  time_zone?: string
  birth_lat?: number
  birth_lon?: number
}

export async function signUpWithEmail(
  email: string,
  password: string,
  meta: ProfileMeta = {}
) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectTo(),
      data: meta,
    },
  })
}

export async function resendSignupEmail(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getRedirectTo(),
    },
  })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}
