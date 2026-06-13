// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import supabase from '../lib/supabase'

type VerifyType = 'email' | 'recovery' | 'invite' | 'email_change'
type FinishRoute = 'ResetPassword'

export default function AuthCallbackScreen({ navigation }: any) {
  const processingUrl = useRef<string | null>(null)
  const handledUrl = useRef<string | null>(null)

  useEffect(() => {
    const finish = async (route?: FinishRoute) => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.warn('Auth callback session lookup failed:', error.message)
      }

      if (route === 'ResetPassword') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ResetPassword' }],
        })
      } else if (session?.user) {
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

    const showAuthError = (message: string, error: { message?: string }) => {
      console.warn('Auth callback failed:', error.message ?? message)
      Alert.alert('Verification failed', message)
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      let url: string | null | undefined
      try {
        url = incomingUrl ?? (await ExpoLinking.getInitialURL())

        if (!url) {
          await finish()
          return
        }

        if (processingUrl.current === url || handledUrl.current === url) {
          return
        }

        processingUrl.current = url

        const parsed = ExpoLinking.parse(url)

        const tokenHash =
          typeof parsed.queryParams?.token_hash === 'string'
            ? parsed.queryParams.token_hash
            : undefined

        const type =
          typeof parsed.queryParams?.type === 'string'
            ? (parsed.queryParams.type as VerifyType)
            : undefined

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })

          if (error) {
            showAuthError(
              'We could not verify this sign-in link. Please try again or request a new email.',
              error
            )
          }

          await finish(!error && type === 'recovery' ? 'ResetPassword' : undefined)
          return
        }

        // Fallbacks kept in case other auth flows still use them
        const code =
          typeof parsed.queryParams?.code === 'string'
            ? parsed.queryParams.code
            : undefined

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            showAuthError(
              'We could not complete sign-in from this link. Please try again or request a new email.',
              error
            )
          }

          await finish(!error && type === 'recovery' ? 'ResetPassword' : undefined)
          return
        }

        const fragment =
          typeof (parsed as any)?.fragment === 'string'
            ? ((parsed as any).fragment as string)
            : undefined

        if (fragment) {
          const params = new URLSearchParams(fragment)
          const access_token = params.get('access_token') ?? undefined
          const refresh_token = params.get('refresh_token') ?? undefined
          const fragmentType = params.get('type') ?? undefined

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })

            if (error) {
              showAuthError(
                'We could not restore your sign-in session from this link. Please try again.',
                error
              )
            }

            await finish(
              !error && fragmentType === 'recovery'
                ? 'ResetPassword'
                : undefined
            )
            return
          }
        }

        await finish()
      } catch (e) {
        console.warn('Auth callback failed:', e)
        await finish()
      } finally {
        if (url && processingUrl.current === url) {
          handledUrl.current = url
          processingUrl.current = null
        }
      }
    }

    handleUrl()

    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
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
