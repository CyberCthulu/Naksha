// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import supabase from '../lib/supabase'

export default function AuthCallbackScreen({ navigation }: any) {
  const handledOnce = useRef(false)

  useEffect(() => {
    const finish = (ok: boolean) => {
      console.log('✅ Auth callback finish:', ok)
      navigation.replace(ok ? 'Dashboard' : 'Login')
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      if (handledOnce.current) return
      handledOnce.current = true

      try {
        const url = incomingUrl ?? (await ExpoLinking.getInitialURL())
        console.log('🔗 callback incoming url:', url)

        if (!url) {
          finish(false)
          return
        }

        const parsed = ExpoLinking.parse(url)
        console.log('🔍 parsed callback url:', JSON.stringify(parsed, null, 2))

        const code =
          typeof parsed.queryParams?.code === 'string'
            ? parsed.queryParams.code
            : undefined

        if (code) {
          console.log('🟡 exchanging code for session...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('🟢 exchange result error:', error?.message ?? null)
          finish(!error)
          return
        }

        const fragment =
          typeof (parsed as any)?.fragment === 'string'
            ? ((parsed as any).fragment as string)
            : undefined

        if (fragment) {
          console.log('🟡 found fragment:', fragment)

          const params = new URLSearchParams(fragment)
          const access_token = params.get('access_token') ?? undefined
          const refresh_token = params.get('refresh_token') ?? undefined

          console.log('🟡 access token present:', !!access_token)
          console.log('🟡 refresh token present:', !!refresh_token)

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            console.log('🟢 setSession error:', error?.message ?? null)
            finish(!error)
            return
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('🔐 fallback session user:', session?.user?.email ?? null)
        finish(!!session)
      } catch (e) {
        console.log('🔥 AuthCallbackScreen crash:', e)
        finish(false)
      }
    }

    handleUrl()

    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
      console.log('📩 url event:', url)
      handleUrl(url)
    })

    return () => sub.remove()
  }, [navigation])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Verifying your account…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 12,
  },
})