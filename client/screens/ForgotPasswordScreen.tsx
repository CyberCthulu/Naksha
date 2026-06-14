import { useState } from 'react'
import { View } from 'react-native'

import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { uiStyles } from '../components/ui/uiStyles'
import { requestPasswordResetEmail } from '../lib/auth'

const RESET_SENT_MESSAGE =
  'If an account exists for that email, we sent password reset instructions.'

export default function ForgotPasswordScreen({ navigation }: any) {
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
      <AppText style={uiStyles.h1}>Forgot Password</AppText>
      <AppText style={[uiStyles.sub, { marginBottom: 14 }]}>
        Enter your email and we will send reset instructions.
      </AppText>

      <EmailField value={email} onChange={setEmail} />

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
        title={submitting ? 'Sending…' : 'Send Reset Email'}
        variant="ghost"
        onPress={handleSendReset}
        disabled={submitting}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Back to Login"
        variant="ghost"
        onPress={() => navigation.replace('Login')}
        disabled={submitting}
      />
    </AuthContainer>
  )
}
