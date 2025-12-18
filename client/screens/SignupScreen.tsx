// client/screens/SignupScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Button, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { signUpWithEmail } from '../lib/auth'
import { normalizeZone } from '../lib/timezones'

// Auth UI components
import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'
import ProfileFields from '../components/auth/ProfileFields'

// ✅ shared styles
import { uiStyles } from '../components/ui/uiStyles'

export default function SignupScreen() {
  const navigation = useNavigation<any>()

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC') // IANA

  // Default to device zone (normalized)
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setTimeZone(normalizeZone(detected) || 'Etc/UTC')
  }, [])

  const handleSignup = async () => {
    if (submitting) return

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    if (!birthDate || !birthTime) {
      setError('Please select both birth date and time.')
      return
    }

    // Normalize and verify TZ
    const normalized = normalizeZone(timeZone)
    if (!normalized) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    setError('')
    setSubmitting(true)

    // Format values for DB/auth
    const formattedDate = birthDate.toISOString().split('T')[0] // YYYY-MM-DD
    const formattedTime = birthTime.toTimeString().split(' ')[0] // HH:MM:SS

    const { error } = await signUpWithEmail(email.trim(), password, {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      birth_date: formattedDate,
      birth_time: formattedTime,
      birth_location: birthLocation || undefined,
      time_zone: normalized, // ✅ save normalized IANA
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    navigation.replace('CheckEmail', { email })
  }

  return (
    <AuthContainer>
      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} />

      <ProfileFields
        firstName={firstName} setFirstName={setFirstName}
        lastName={lastName} setLastName={setLastName}
        birthDate={birthDate} setBirthDate={setBirthDate}
        birthTime={birthTime} setBirthTime={setBirthTime}
        birthLocation={birthLocation} setBirthLocation={setBirthLocation}
        timeZone={timeZone} setTimeZone={setTimeZone}
      />

      {error !== '' && (
        <Text style={[uiStyles.errorText, { marginTop: 6 }]}>{error}</Text>
      )}

      <View style={{ height: 8 }} />
      <Button
        title={submitting ? 'Signing Up…' : 'Sign Up'}
        onPress={handleSignup}
        disabled={submitting}
      />

      <View style={{ height: 8 }} />
      <Button
        title="Already have an account? Log In"
        onPress={() => navigation.replace('Login')}
        disabled={submitting}
      />
    </AuthContainer>
  )
}
