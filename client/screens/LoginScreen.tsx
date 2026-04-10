// screens/LoginScreen.tsx
import { useState } from 'react'
import { View } from 'react-native'
import { signInWithEmail } from '../lib/auth'

import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'

import { uiStyles } from '../components/ui/uiStyles'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { error } = await signInWithEmail(email, password)
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in.')
      } else {
        setError(error.message)
      }
    } else {
      setError('')
    }
  }

  return (
    <AuthContainer centered>
      <AppText style={uiStyles.h1}>Log In</AppText>

      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} />

      {error !== '' && (
        <AppText style={[uiStyles.errorText, { marginBottom: 10 }]}>
          {error}
        </AppText>
      )}

      <Button title="Login" variant="ghost" onPress={handleLogin} />

      <View style={{ height: 10 }} />

      <Button
        title="Don't have an account? Sign Up"
        variant="ghost"
        onPress={() => navigation.navigate('Signup')}
        style={{ marginTop: 8 }}
      />
    </AuthContainer>
  )
}