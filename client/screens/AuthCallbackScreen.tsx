// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import supabase from '../lib/supabase'

export default function AuthCallbackScreen({ navigation }: any) {
  const handledOnce = useRef(false)

  useEffect(() => {
    const finish = (ok: boolean) => {
      navigation.replace(ok ? 'Dashboard' : 'Login')
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      if (handledOnce.current) return
      handledOnce.current = true

      try {
        const url = incomingUrl ?? (await ExpoLinking.getInitialURL())
        if (!url) return finish(false)

        const parsed = ExpoLinking.parse(url)

        // Case 1: standard confirm/OAuth flow => ?code=...
        const code = (parsed?.queryParams?.code as string | undefined) ?? undefined
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          return finish(!error)
        }

        // Case 2: magic-link style => tokens in fragment (#access_token=...&refresh_token=...)
        const fragment = (parsed as any)?.fragment as string | undefined
        if (fragment) {
          const params = new URLSearchParams(fragment)
          const access_token = params.get('access_token') ?? undefined
          const refresh_token = params.get('refresh_token') ?? undefined
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            return finish(!error)
          }
        }

        // Fallback: if a session already exists
        const { data: { session } } = await supabase.auth.getSession()
        finish(!!session)
      } catch {
        finish(false)
      }
    }

    // Handle the URL that launched this screen
    handleUrl()

    // Also handle subsequent url events while mounted
    const sub = ExpoLinking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => sub.remove()
  }, [navigation])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text>Verifying your account…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
