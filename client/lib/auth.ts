// lib/auth.ts
import * as Linking from 'expo-linking'
import supabase from './supabase'

/**
 * Builds the deep link that Supabase will use in its verification email.
 * In dev (Expo), this resolves to an exp:// URL.
 * In a built app, this resolves to your scheme, e.g. naksha://auth/callback
 */
function getRedirectTo() {
  return Linking.createURL('/auth/callback')
}

export type ProfileMeta = {
  first_name?: string
  last_name?: string
  birth_date?: string      // 'YYYY-MM-DD'
  birth_time?: string      // 'HH:MM:SS'
  birth_location?: string
  time_zone?: string
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
      // 👇 THIS is the key: send profile data with the auth user
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
