import { useState } from 'react'
import { View } from 'react-native'

import AuthContainer from '../components/auth/AuthContainer'
import FormField from '../components/ui/FormField'
import TextField from '../components/ui/TextField'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { uiStyles } from '../components/ui/uiStyles'
import supabase from '../lib/supabase'

export const MIN_RESET_PASSWORD_LENGTH = 6

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const routeAfterReset = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    navigation.reset({
      index: 0,
      routes: [{ name: session?.user ? 'Dashboard' : 'Login' }],
    })
  }

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

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setSubmitting(false)
      setError(updateError.message)
      return
    }

    setMessage('Your password has been updated.')
    setSubmitting(false)
    await routeAfterReset()
  }

  return (
    <AuthContainer centered>
      <AppText style={uiStyles.h1}>Set New Password</AppText>
      <AppText style={[uiStyles.sub, { marginBottom: 14 }]}>
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
        <AppText style={[uiStyles.text, { marginBottom: 10 }]}>
          {message}
        </AppText>
      )}

      {error !== '' && (
        <AppText style={[uiStyles.errorText, { marginBottom: 10 }]}>
          {error}
        </AppText>
      )}

      <Button
        title={submitting ? 'Updating…' : 'Update Password'}
        variant="ghost"
        onPress={handleUpdatePassword}
        disabled={submitting}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Back to Login"
        variant="ghost"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
        disabled={submitting}
      />
    </AuthContainer>
  )
}
