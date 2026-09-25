import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import AuthContainer from '../components/auth/AuthContainer'
import FormField from '../components/ui/FormField'
import TextField from '../components/ui/TextField'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { uiStyles } from '../components/ui/uiStyles'
import { signOut } from '../lib/auth'
import { useAuthSession } from '../lib/authSession'
import supabase from '../lib/supabase'
import type { RootStackParamList } from '../navigation/types'

export const MIN_RESET_PASSWORD_LENGTH = 6

type ResetPasswordScreenProps = {
  navigation: Pick<
    NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>,
    'reset'
  >
}

export default function ResetPasswordScreen({
  navigation,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    status: authStatus,
    user,
    clearPostAuthRoute,
    forceSignedOut,
  } = useAuthSession()

  const handleUpdatePassword = async () => {
    if (submitting) return

    if (!password.trim()) {
      setMessage('')
      setError('Enter a new password.')
      return
    }

    if (password.length < MIN_RESET_PASSWORD_LENGTH) {
      setMessage('')
      setError(
        `Password must be at least ${MIN_RESET_PASSWORD_LENGTH} characters.`
      )
      return
    }

    if (password !== confirmPassword) {
      setMessage('')
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      if (authStatus !== 'authenticated' || !user) {
        setError(
          'Your recovery session has expired. Request a new password reset email.'
        )
        return
      }

      setMessage('Your password has been updated.')
      clearPostAuthRoute()
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      })
    } catch {
      setError(
        'Could not update your password. Check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToLogin = async () => {
    if (submitting) return

    if (authStatus !== 'authenticated' || !user) {
      clearPostAuthRoute()
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await signOut()
      clearPostAuthRoute()
      forceSignedOut()
    } catch {
      setError('Could not sign out. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthContainer centered>
      <AppText variant="title" style={uiStyles.h1}>
        Set New Password
      </AppText>
      <AppText variant="body" style={[uiStyles.sub, { marginBottom: 14 }]}>
        Choose a new password for your Naksha account.
      </AppText>

      <FormField label="New Password">
        <TextField
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
        />
      </FormField>

      <FormField label="Confirm Password">
        <TextField
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
        />
      </FormField>

      {message !== '' && (
        <AppText variant="body" style={[uiStyles.text, { marginBottom: 10 }]}>
          {message}
        </AppText>
      )}

      {error !== '' && (
        <AppText
          variant="bodySmall"
          style={[uiStyles.errorText, { marginBottom: 10 }]}
        >
          {error}
        </AppText>
      )}

      <Button
        title={submitting ? 'Updating…' : 'Update Password'}
        variant="primary"
        onPress={handleUpdatePassword}
        disabled={submitting}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Back to Login"
        variant="tertiary"
        onPress={handleBackToLogin}
        disabled={submitting}
      />
    </AuthContainer>
  )
}
