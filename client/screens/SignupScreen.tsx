import React, { useEffect, useState } from 'react'
import { View, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { signUpWithEmail } from '../lib/auth'
import { normalizeZone, getDeviceTimeZoneNormalized } from '../lib/timezones'
import { formatDateForDb, formatTimeForDb } from '../lib/time'

import AuthContainer from '../components/auth/AuthContainer'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'
import ProfileFields from '../components/auth/ProfileFields'

import { uiStyles } from '../components/ui/uiStyles'
import { AppText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'

export default function SignupScreen() {
  const navigation = useNavigation<any>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC')

  useEffect(() => {
    setTimeZone(getDeviceTimeZoneNormalized())
  }, [])

  const handleSignup = async () => {
    if (submitting) return

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    if (!birthDate || !birthTime) {
      setError('Please select both birth date and time.')
      return
    }

    const normalized = normalizeZone(timeZone)
    if (!normalized) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    setError('')
    setSubmitting(true)

    const formattedDate = formatDateForDb(birthDate)
    const formattedTime = formatTimeForDb(birthTime)

    const { error } = await signUpWithEmail(email.trim(), password, {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      birth_date: formattedDate,
      birth_time: formattedTime,
      birth_location: birthLocation || undefined,
      time_zone: normalized,
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
      <View style={{ marginBottom: 18 }}>
        <AppText style={uiStyles.h1}>Create your account</AppText>
        <AppText style={[uiStyles.sub, { marginBottom: 0 }]}>
          Add your birth details to generate your natal chart.
        </AppText>
      </View>

      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} />

      <ProfileFields
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        birthTime={birthTime}
        setBirthTime={setBirthTime}
        birthLocation={birthLocation}
        setBirthLocation={setBirthLocation}
        timeZone={timeZone}
        setTimeZone={setTimeZone}
      />

      {error !== '' && (
        <AppText style={[uiStyles.errorText, { marginTop: 4, marginBottom: 4 }]}>
          {error}
        </AppText>
      )}

      <View style={{ height: 12 }} />

      <Button
        title={submitting ? 'Signing Up…' : 'Sign Up'}
        variant="ghost"
        onPress={handleSignup}
        disabled={submitting}
      />

      <View style={{ height: 10 }} />

      <Button
        title="Already have an account? Log In"
        variant="ghost"
        onPress={() => navigation.replace('Login')}
        disabled={submitting}
      />
    </AuthContainer>
  )
}