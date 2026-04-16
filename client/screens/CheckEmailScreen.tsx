import React, { useLayoutEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { resendSignupEmail, verifySignupOtp } from '../lib/auth'

import AuthContainer from '../components/auth/AuthContainer'
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

type RouteParams = Partial<{
  email: string
  profile: {
    first_name: string | null
    last_name: string | null
    birth_date: string | null
    birth_time: string | null
    birth_location: string | null
    time_zone: string | null
    birth_lat: number | null
    birth_lon: number | null
  }
}>

export default function CheckEmailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false })
  }, [navigation])

  const params = (route.params ?? {}) as RouteParams
  const email = params.email ?? ''

  const [code, setCode] = useState('')
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const initialMessage = useMemo(() => {
    if (!email) {
      return 'We sent you a confirmation code. Enter it below to verify your email and continue.'
    }
    return `We sent a confirmation code to ${email}. Enter it below to verify your email and continue.`
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
        setMessage('Confirmation code resent. Please check your inbox again.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async () => {
    const trimmedCode = code.trim()

    if (!email) {
      Alert.alert('Missing email', 'We could not find the email for this signup flow.')
      return
    }

    if (!trimmedCode) {
      Alert.alert('Missing code', 'Enter the confirmation code from your email.')
      return
    }

    try {
      setVerifying(true)

      const { error: verifyError } = await verifySignupOtp(email, trimmedCode)

      if (verifyError) {
        Alert.alert('Verification Failed', verifyError.message)
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        Alert.alert(
          'Verification incomplete',
          'Your email was verified, but we could not start your session. Please log in.'
        )
        navigation.replace('Login')
        return
      }

      const profile = params.profile

      if (profile) {
        const { error: upsertErr } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email ?? null,
              first_name: profile.first_name,
              last_name: profile.last_name,
              birth_date: profile.birth_date,
              birth_time: profile.birth_time,
              birth_location: profile.birth_location,
              time_zone: profile.time_zone,
              birth_lat: profile.birth_lat,
              birth_lon: profile.birth_lon,
            },
            { onConflict: 'id' }
          )

        if (upsertErr) {
          Alert.alert('Save Failed', upsertErr.message)
          return
        }
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AuthContainer>
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
        <Text style={styles.title}>Enter your confirmation code</Text>
        <Text style={styles.message}>{message}</Text>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={theme.colors.muted}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={6}
          style={styles.codeInput}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, verifying && { opacity: 0.7 }]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryBtnText}>Verify Code</Text>
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
          disabled={verifying || resending}
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
    marginBottom: 14,
  },

  codeInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
    backgroundColor: theme.colors.cardBg,
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