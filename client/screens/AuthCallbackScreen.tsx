// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import supabase from '../lib/supabase'

type VerifyType = 'email' | 'recovery' | 'invite' | 'email_change'

export default function AuthCallbackScreen({ navigation }: any) {
  const handledOnce = useRef(false)

  useEffect(() => {
    const finish = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('✅ Auth callback done, session user:', session?.user?.email ?? null)

      if (session?.user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        })
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      }
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      if (handledOnce.current) return
      handledOnce.current = true

      try {
        const url = incomingUrl ?? (await ExpoLinking.getInitialURL())
        console.log('🔗 callback incoming url:', url)

        if (!url) {
          await finish()
          return
        }

        const parsed = ExpoLinking.parse(url)
        console.log('🔍 parsed callback url:', JSON.stringify(parsed, null, 2))

        const tokenHash =
          typeof parsed.queryParams?.token_hash === 'string'
            ? parsed.queryParams.token_hash
            : undefined

        const type =
          typeof parsed.queryParams?.type === 'string'
            ? (parsed.queryParams.type as VerifyType)
            : undefined

        if (tokenHash && type) {
          console.log('🟡 verifying OTP with token_hash...')
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })
          console.log('🟢 verifyOtp error:', error?.message ?? null)
          await finish()
          return
        }

        // Fallbacks kept in case other auth flows still use them
        const code =
          typeof parsed.queryParams?.code === 'string'
            ? parsed.queryParams.code
            : undefined

        if (code) {
          console.log('🟡 exchanging code for session...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('🟢 exchange result error:', error?.message ?? null)
          await finish()
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

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            console.log('🟢 setSession error:', error?.message ?? null)
            await finish()
            return
          }
        }

        await finish()
      } catch (e) {
        console.log('🔥 AuthCallbackScreen crash:', e)
        await finish()
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
      <Text>Verifying your account…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})