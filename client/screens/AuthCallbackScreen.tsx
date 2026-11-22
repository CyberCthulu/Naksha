// screens/AuthCallbackScreen.tsx
import { useEffect, useRef } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import supabase from '../lib/supabase'
import { theme } from '../components/ui/theme'
import { AppText } from '../components/ui/AppText'
import { CelestialLoader } from '../components/ui/CelestialLoader'
import { consumePendingAuthCallbackUrl } from '../lib/authCallbackUrl'
import { useAuthSession } from '../lib/authSession'
import type { RootStackParamList } from '../navigation/types'

type VerifyType = 'email' | 'recovery' | 'invite' | 'email_change'
type FinishRoute = 'Authenticated' | 'ResetPassword' | 'Default'

type AuthCallbackScreenProps = {
  navigation: Pick<
    NativeStackNavigationProp<RootStackParamList, 'AuthCallback'>,
    'reset'
  >
  route?: RouteProp<RootStackParamList, 'AuthCallback'>
}

export default function AuthCallbackScreen({
  navigation,
  route,
}: AuthCallbackScreenProps) {
  const processingUrl = useRef<string | null>(null)
  const handledUrl = useRef<string | null>(null)
  const {
    status,
    user,
    preparePostAuthRoute,
    clearPostAuthRoute,
    getPostAuthRoute,
  } = useAuthSession()
  const authStateRef = useRef({ status, user })
  authStateRef.current = { status, user }

  useEffect(() => {
    const finish = (finishRoute: FinishRoute = 'Default') => {
      const current = authStateRef.current

      if (
        finishRoute === 'ResetPassword' ||
        (finishRoute === 'Authenticated' &&
          getPostAuthRoute() === 'ResetPassword')
      ) {
        if (current.status === 'authenticated' && current.user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ResetPassword' }],
          })
        }
        return
      }

      if (finishRoute === 'Authenticated') {
        if (current.status === 'authenticated' && current.user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          })
        }
        return
      }

      clearPostAuthRoute()
      navigation.reset({
        index: 0,
        routes: [
          {
            name:
              current.status === 'authenticated' && current.user
                ? 'Dashboard'
                : 'Login',
          },
        ],
      })
    }

    const showAuthError = (message: string) => {
      console.warn('Auth callback failed.')
      Alert.alert('Verification failed', message)
    }

    const getRouteParamUrl = () =>
      typeof route?.params?.url === 'string' ? route.params.url : undefined

    const getStartupUrl = async () =>
      consumePendingAuthCallbackUrl() ??
      getRouteParamUrl() ??
      (await ExpoLinking.getInitialURL())

    const getFragment = (
      url: string,
      parsed: ReturnType<typeof ExpoLinking.parse>
    ) => {
      const rawFragment = url.includes('#')
        ? url.slice(url.indexOf('#') + 1)
        : undefined
      const parsedFragment =
        typeof (parsed as any)?.fragment === 'string'
          ? ((parsed as any).fragment as string)
          : undefined

      return rawFragment || parsedFragment
    }

    const prepareRecovery = (type?: string | null) => {
      const recovery = type === 'recovery'
      if (recovery) preparePostAuthRoute('ResetPassword')
      return recovery
    }

    const handleUrl = async (incomingUrl?: string | null) => {
      let url: string | null | undefined
      let recoveryPrepared = false
      try {
        url = incomingUrl ?? (await getStartupUrl())

        if (!url) {
          finish()
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
        const fragmentParams = fragment
          ? new URLSearchParams(fragment)
          : undefined
        const accessToken = fragmentParams?.get('access_token') ?? undefined
        const refreshToken = fragmentParams?.get('refresh_token') ?? undefined
        const fragmentType = fragmentParams?.get('type') ?? undefined

        if (tokenHash && type) {
          recoveryPrepared = prepareRecovery(type)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })

          if (error) {
            if (recoveryPrepared) clearPostAuthRoute()
            showAuthError(
              'We could not verify this sign-in link. Please try again or request a new email.'
            )
            finish()
            return
          }

          finish(recoveryPrepared ? 'ResetPassword' : 'Authenticated')
          return
        }

        if (code) {
          recoveryPrepared = prepareRecovery(type)
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            if (recoveryPrepared) clearPostAuthRoute()
            showAuthError(
              'We could not complete sign-in from this link. Please try again or request a new email.'
            )
            finish()
            return
          }

          finish(recoveryPrepared ? 'ResetPassword' : 'Authenticated')
          return
        }

        if (fragment && accessToken && refreshToken) {
          recoveryPrepared = prepareRecovery(fragmentType)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            if (recoveryPrepared) clearPostAuthRoute()
            showAuthError(
              'We could not restore your sign-in session from this link. Please try again.'
            )
            finish()
            return
          }

          finish(recoveryPrepared ? 'ResetPassword' : 'Authenticated')
          return
        }

        showAuthError(
          'This sign-in link is incomplete or expired. Request a new email and try again.'
        )
        finish()
      } catch {
        if (recoveryPrepared) clearPostAuthRoute()
        showAuthError(
          'We could not complete verification. Check your connection or request a new email.'
        )
        finish()
      } finally {
        if (url && processingUrl.current === url) {
          handledUrl.current = url
          processingUrl.current = null
        }
      }
    }

    void handleUrl()

    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
      void handleUrl(url)
    })

    return () => sub.remove()
  }, [
    clearPostAuthRoute,
    getPostAuthRoute,
    navigation,
    preparePostAuthRoute,
    route?.params?.url,
  ])

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Verifying your account…"
      accessibilityState={{ busy: true }}
    >
      <CelestialLoader size={96} color={theme.accent.base} />
      <AppText variant="body" style={styles.label}>
        Verifying your account…
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { color: theme.text.secondary, marginTop: theme.space.md },
})
