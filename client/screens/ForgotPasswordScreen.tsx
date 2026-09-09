import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { uiStyles } from '../components/ui/uiStyles'
import { requestPasswordResetEmail } from '../lib/auth'
import type { RootStackParamList } from '../navigation/types'

const RESET_SENT_MESSAGE =
  'If an account exists for that email, we sent password reset instructions.'

type ForgotPasswordScreenProps = {
  navigation: Pick<
    NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>,
    'replace'
  >
}

export default function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSendReset = async () => {
    if (submitting) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setMessage('')
      setError('Email is required.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    const { error: resetError } = await requestPasswordResetEmail(trimmedEmail)

    setSubmitting(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage(RESET_SENT_MESSAGE)
  }

  return (
    <AuthContainer centered>
      <AppText variant="title" style={uiStyles.h1}>Forgot Password</AppText>
      <AppText variant="body" style={[uiStyles.sub, { marginBottom: 14 }]}>
        Enter your email and we will send reset instructions.
      </AppText>

      <EmailField value={email} onChange={setEmail} />

      {message !== '' && (
        <AppText variant="body" style={[uiStyles.text, { marginBottom: 10 }]}>
          {message}
        </AppText>
      )}

      {error !== '' && (
        <AppText variant="bodySmall" style={[uiStyles.errorText, { marginBottom: 10 }]}>
          {error}
        </AppText>
      )}

      <Button
        title={submitting ? 'Sending…' : 'Send Reset Email'}
        variant="primary"
        onPress={handleSendReset}
        disabled={submitting}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Back to Login"
        variant="tertiary"
        onPress={() => navigation.replace('Login')}
        disabled={submitting}
      />
    </AuthContainer>
  )
}
