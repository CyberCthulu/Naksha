import React, { useLayoutEffect, useMemo, useState } from 'react'
import { StyleSheet, Alert } from 'react-native'
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import supabase from '../lib/supabase'
import { resendSignupEmail, verifySignupOtp } from '../lib/auth'
import { useAuthSession } from '../lib/authSession'
import type { RootStackParamList } from '../navigation/types'

import AuthContainer from '../components/auth/AuthContainer'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { AppText, MutedText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import { theme } from '../components/ui/theme'

const PROFILE_SELECT =
  'first_name,last_name,birth_date,birth_time,birth_utc_offset_minutes,birth_location,time_zone'

export default function CheckEmailScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'CheckEmail'>
    >()
  const route = useRoute<RouteProp<RootStackParamList, 'CheckEmail'>>()
  const { status, user } = useAuthSession()
  const authenticated = status === 'authenticated' && Boolean(user)

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false })
  }, [navigation])

  const params = route.params ?? {}
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

  const handleBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: authenticated ? 'Dashboard' : 'Login' }],
    })
  }

  const handleResend = async () => {
    if (resending || verifying) return

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
    } catch {
      Alert.alert(
        'Resend Failed',
        'Could not resend the confirmation email. Check your connection and try again.'
      )
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async () => {
    if (verifying || resending) return

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
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        Alert.alert(
          'Verification incomplete',
          'Your email was verified, but we could not start your session. Please log in.'
        )
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
        return
      }

      const profile = params.profile

      if (profile) {
        const { error: upsertErr } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email ?? '',
              first_name: profile.first_name,
              last_name: profile.last_name,
              birth_date: profile.birth_date,
              birth_time: profile.birth_time,
              birth_utc_offset_minutes: profile.birth_utc_offset_minutes,
              birth_location: profile.birth_location,
              time_zone: profile.time_zone,
              birth_lat: profile.birth_lat,
              birth_lon: profile.birth_lon,
            },
            { onConflict: 'id' }
          )
          .select(PROFILE_SELECT)
          .maybeSingle()

        if (upsertErr) {
          Alert.alert('Save Failed', upsertErr.message)
          return
        }
      }

      // Supabase's auth event is the navigation boundary. App remounts the
      // navigator for the authenticated identity; Dashboard then makes the
      // authoritative complete-profile decision from public.users.
      setMessage('Email Verified.')
    } catch {
      Alert.alert(
        'Verification Failed',
        'Could not verify the code. Check your connection and try again.'
      )
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AuthContainer>
      <ScreenHeader
        title="Check Email"
        onBack={handleBack}
        backAccessibilityLabel={
          authenticated ? 'Back to dashboard' : 'Back to login'
        }
      />

      <Card>
        <AppText variant="heading" style={styles.title}>
          Enter your confirmation code
        </AppText>
        <MutedText variant="body" style={styles.message}>
          {message}
        </MutedText>

        <TextField
          accessibilityLabel="Confirmation code"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={6}
          style={styles.codeInput}
        />

        <Button
          title={verifying ? 'Verifying your code…' : 'Verify Code'}
          onPress={handleVerify}
          loading={verifying}
          disabled={resending}
        />
        <Button
          title="Resend Email"
          variant="secondary"
          onPress={handleResend}
          loading={resending}
          disabled={verifying}
          style={styles.secondaryAction}
        />
        <Button
          title={authenticated ? 'Back to Dashboard' : 'Back to Login'}
          variant="tertiary"
          onPress={handleBack}
          disabled={verifying || resending}
          style={styles.secondaryAction}
        />
      </Card>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: theme.space.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: theme.space.lg,
  },
  codeInput: {
    ...theme.typography.numeric,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: theme.space.md,
  },
  secondaryAction: {
    marginTop: theme.space.sm,
  },
})
