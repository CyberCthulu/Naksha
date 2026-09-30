// client/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

function requirePublicEnvironmentValue(name: string, value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) {
    throw new Error(`Missing required ${name}. Configure it for this build environment.`)
  }
  return normalized
}

const SUPABASE_URL = requirePublicEnvironmentValue(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL
)
const SUPABASE_ANON_KEY = requirePublicEnvironmentValue(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

let supabaseProjectRef: string
try {
  supabaseProjectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
} catch {
  throw new Error(
    'Invalid EXPO_PUBLIC_SUPABASE_URL. Configure a valid absolute URL for this build environment.'
  )
}

const AUTH_STORAGE_KEY = `sb-${supabaseProjectRef}-auth-token`

/**
 * Last-resort local cleanup after the server account has already been deleted
 * and the normal Supabase sign-out request cannot complete. Keep this list in
 * sync with auth-js _removeSession storage keys when upgrading Supabase.
 */
export async function clearPersistedAuthSession() {
  await AsyncStorage.multiRemove([
    AUTH_STORAGE_KEY,
    `${AUTH_STORAGE_KEY}-code-verifier`,
    `${AUTH_STORAGE_KEY}-user`,
  ])
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN doesn't have location.href
  },
})

export default supabase
