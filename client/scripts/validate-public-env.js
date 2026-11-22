const requiredNames = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_OPENCAGE_KEY',
]

const missing = requiredNames.filter((name) => !process.env[name]?.trim())
if (missing.length > 0) {
  console.error(`Missing required public build environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

let supabaseUrl
try {
  supabaseUrl = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL)
} catch {
  console.error(
    'Invalid EXPO_PUBLIC_SUPABASE_URL. Configure an HTTP or HTTPS URL with a hostname.'
  )
  process.exit(1)
}

if (!['http:', 'https:'].includes(supabaseUrl.protocol) || !supabaseUrl.hostname) {
  console.error(
    'Invalid EXPO_PUBLIC_SUPABASE_URL. Configure an HTTP or HTTPS URL with a hostname.'
  )
  process.exit(1)
}

console.log('Public build environment preflight passed.')
