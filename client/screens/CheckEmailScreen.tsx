// screens/CheckEmailScreen.tsx
import React, { useLayoutEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { resendSignupEmail } from '../lib/auth'

import AuthContainer from '../components/auth/AuthContainer'
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

type RouteParams = Partial<{
  email: string
  firstName: string
  lastName: string
  birthDate: string
  birthTime: string
  birthLocation: string
  timeZone: string
}>

export default function CheckEmailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false })
  }, [navigation])

  const params = (route.params ?? {}) as RouteParams
  const email = params.email ?? ''

  const [resending, setResending] = useState(false)
  const [continuing, setContinuing] = useState(false)

  const initialMessage = useMemo(() => {
    if (!email) {
      return 'We’ve sent a confirmation email. Please verify your email to continue.'
    }
    return `We’ve sent a confirmation email to ${email}. Please verify your email to continue.`
  }, [email])

  const [message, setMessage] = useState(initialMessage)

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Missing email', 'We could not find an email to resend to.')
      return
    }

    try {
      setResending(true)
      const { error } = await resendSignupEmail(email)
      if (error) {
        Alert.alert('Resend Failed', error.message)
      } else {
        setMessage('Verification email resent. Please check your inbox again.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleContinue = async () => {
    try {
      setContinuing(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        Alert.alert('Still waiting…', 'Please confirm your email first, then try again.')
        return
      }

      // Only save profile fields if they were provided (older flow).
      // Your current SignupScreen often only passes { email }, so we keep this safe.
      const hasProfilePayload =
        params.firstName ||
        params.lastName ||
        params.birthDate ||
        params.birthTime ||
        params.birthLocation ||
        params.timeZone

      if (hasProfilePayload) {
        const { error: upsertErr } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email ?? null,
              first_name: params.firstName ?? null,
              last_name: params.lastName ?? null,
              birth_date: params.birthDate ?? null,
              birth_time: params.birthTime ?? null,
              birth_location: params.birthLocation ?? null,
              time_zone: params.timeZone ?? null,
            },
            { onConflict: 'id' }
          )

        if (upsertErr) {
          Alert.alert('Save Failed', upsertErr.message)
          return
        }
      }

      navigation.replace('Dashboard')
    } finally {
      setContinuing(false)
    }
  }

  return (
    <AuthContainer>
      {/* Top bar */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.iconBtn}
        >
          <Text style={styles.iconText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Check Email</Text>

        <View style={{ width: 72 }} />
      </View>

      <View style={uiStyles.card}>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[styles.primaryBtn, continuing && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={continuing}
        >
          {continuing ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryBtnText}>Continue to App</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[styles.secondaryBtn, resending && { opacity: 0.7 }]}
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.secondaryBtnText}>Resend Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.replace('Login')}
          disabled={continuing || resending}
        >
          <Text style={styles.linkBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
    color: theme.colors.text,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: theme.colors.sub,
    textAlign: 'center',
    lineHeight: 20,
  },

  primaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },

  linkBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkBtnText: {
    color: theme.colors.sub,
    fontWeight: '700',
  },
})
