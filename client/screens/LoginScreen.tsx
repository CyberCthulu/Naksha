// screens/LoginScreen.tsx
import { useState } from 'react'
import { View, TextInput } from 'react-native'
import { signInWithEmail } from '../lib/auth'

// ✅ shared styles + theme
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

// UI primitives
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
    <View style={[uiStyles.screen, { justifyContent: 'center' }]}>
      <AppText style={uiStyles.h1}>Log In</AppText>

      <AppText style={{ marginTop: 12 }}>Email</AppText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={theme.colors.muted}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          padding: 10,
          marginTop: 8,
          marginBottom: 10,
          color: theme.colors.text,
        }}
      />

      <AppText>Password</AppText>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor={theme.colors.muted}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          padding: 10,
          marginTop: 8,
          marginBottom: 10,
          color: theme.colors.text,
        }}
      />

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
    </View>
  )
}
