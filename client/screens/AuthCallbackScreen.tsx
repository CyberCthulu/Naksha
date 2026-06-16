// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import supabase from '../lib/supabase'
import { consumePendingAuthCallbackUrl } from '../lib/authCallbackUrl'

type VerifyType = 'email' | 'recovery' | 'invite' | 'email_change'
type FinishRoute = 'ResetPassword'

export default function AuthCallbackScreen({ navigation, route }: any) {
  const processingUrl = useRef<string | null>(null)
  const handledUrl = useRef<string | null>(null)

  useEffect(() => {
    const finish = async (finishRoute?: FinishRoute) => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.warn('Auth callback session lookup failed:', error.message)
      }

      const target =
        finishRoute === 'ResetPassword'
          ? 'ResetPassword'
          : session?.user
            ? 'Dashboard'
            : 'Login'

      if (target === 'ResetPassword') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ResetPassword' }],
        })
      } else if (target === 'Dashboard') {
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

    const getRouteParamUrl = () =>
      typeof route?.params?.url === 'string' ? route.params.url : undefined

    const getStartupUrl = async () =>
      consumePendingAuthCallbackUrl() ??
      getRouteParamUrl() ??
      (await ExpoLinking.getInitialURL())

    const getFragment = (url: string, parsed: ReturnType<typeof ExpoLinking.parse>) => {
      const rawFragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : undefined
      const parsedFragment =
        typeof (parsed as any)?.fragment === 'string'
          ? ((parsed as any).fragment as string)
          : undefined

      return rawFragment || parsedFragment
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      let url: string | null | undefined
      try {
        url = incomingUrl ?? (await getStartupUrl())

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

        const code =
          typeof parsed.queryParams?.code === 'string'
            ? parsed.queryParams.code
            : undefined

        const fragment = getFragment(url, parsed)

        const fragmentParams = fragment ? new URLSearchParams(fragment) : undefined
        const accessToken = fragmentParams?.get('access_token') ?? undefined
        const refreshToken = fragmentParams?.get('refresh_token') ?? undefined
        const fragmentType = fragmentParams?.get('type') ?? undefined

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

        if (fragment) {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
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
  }, [navigation, route?.params?.url])

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
