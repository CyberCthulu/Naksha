// screens/LoginScreen.tsx
import { useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { signInWithEmail } from '../lib/auth'

import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'

import { AppText, MutedText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { theme } from '../components/ui/theme'
import type { RootStackParamList } from '../navigation/types'

type LoginScreenProps = {
  navigation: Pick<
    NativeStackNavigationProp<RootStackParamList, 'Login'>,
    'navigate'
  >
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const { error } = await signInWithEmail(email.trim(), password)

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in.')
        } else {
          setError(error.message)
        }
      }
    } catch {
      setError('Could not log in. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthContainer formAppearance="soft">
      <View style={styles.introduction}>
        <Image
          source={require('../assets/naksha-logo-transparent.png')}
          style={styles.mark}
          resizeMode="contain"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <AppText variant="display" accessibilityRole="header" style={styles.brand}>
          Naksha
        </AppText>
        <MutedText variant="bodySmall" style={styles.supportingLine}>
          Your chart. Your sky. Your map.
        </MutedText>
      </View>

      <Card style={styles.form}>
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          Log In
        </AppText>

        <EmailField value={email} onChange={setEmail} />
        <PasswordField value={password} onChange={setPassword} />

        {error !== '' && (
          <AppText
            variant="bodySmall"
            accessibilityLiveRegion="polite"
            style={styles.error}
          >
            {error}
          </AppText>
        )}

        <Button
          title={submitting ? 'Logging in...' : 'Log In'}
          variant="primary"
          onPress={handleLogin}
          disabled={submitting}
        />

        <Button
          title="Forgot password?"
          variant="quiet"
          size="sm"
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={submitting}
          style={styles.recovery}
        />
      </Card>

      <View style={styles.footer}>
        <MutedText variant="bodySmall">New to Naksha?</MutedText>
        <Button
          title="Sign Up"
          variant="tertiary"
          size="sm"
          onPress={() => navigation.navigate('Signup')}
          disabled={submitting}
        />
      </View>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  introduction: {
    alignItems: 'center',
    paddingTop: theme.space.xxl,
    paddingBottom: theme.space.xxxl,
  },
  mark: {
    width: 88,
    height: 88,
  },
  brand: {
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  supportingLine: {
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.space.md,
  },
  title: {
    marginBottom: theme.space.xl,
  },
  error: {
    color: theme.state.danger,
    marginBottom: theme.space.md,
  },
  recovery: {
    marginTop: theme.space.sm,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.space.xs,
    paddingBottom: theme.space.lg,
  },
})
