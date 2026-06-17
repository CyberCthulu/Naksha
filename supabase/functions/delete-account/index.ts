import { createClient } from '@supabase/supabase-js'

const USER_DATA_TABLES = [
  'messages',
  'conversations',
  'reports',
  'journals',
  'notifications',
  'purchases',
  'subscriptions',
  'usage_events',
  'charts',
] as const

const jsonHeaders = {
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server is not configured.' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  const jwt = tokenMatch?.[1]?.trim()

  if (!jwt) {
    return jsonResponse({ error: 'Authentication required.' }, 401)
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(jwt)

  if (userError || !user) {
    return jsonResponse({ error: 'Authentication required.' }, 401)
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  for (const table of USER_DATA_TABLES) {
    const { error } = await serviceClient
      .from(table)
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return jsonResponse({ error: 'Could not delete account.' }, 500)
    }
  }

  const { error: deleteUserError } = await serviceClient.auth.admin.deleteUser(
    user.id
  )

  if (deleteUserError) {
    return jsonResponse({ error: 'Could not delete account.' }, 500)
  }

  return jsonResponse({ success: true })
})
