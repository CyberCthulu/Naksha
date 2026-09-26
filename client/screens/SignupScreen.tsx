//screens/SignupScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Alert, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { signUpWithEmail } from '../lib/auth'
import { normalizeZone, getDeviceTimeZoneNormalized } from '../lib/timezones'
import {
  prepareBirthMoment,
  type CivilDate,
  type CivilTime,
} from '../lib/time'

import AuthContainer from '../components/auth/AuthContainer'
import { AuthFormSection } from '../components/auth/AuthFormSection'
import EmailField from '../components/auth/EmailField'
import PasswordField from '../components/auth/PasswordField'
import ProfileFields from '../components/auth/ProfileFields'

import { AppText, MutedText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import { theme } from '../components/ui/theme'
import type { RootStackParamList } from '../navigation/types'

export default function SignupScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Signup'>>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<CivilDate | null>(null)
  const [birthTime, setBirthTime] = useState<CivilTime | null>(null)
  const [birthUtcOffsetMinutes, setBirthUtcOffsetMinutes] = useState<number | null>(
    null
  )
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC')
  const [birthLat, setBirthLat] = useState<number | null>(null)
  const [birthLon, setBirthLon] = useState<number | null>(null)

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

    let birthMoment
    try {
      birthMoment = prepareBirthMoment(
        birthDate,
        birthTime,
        normalized,
        birthUtcOffsetMinutes
      )
    } catch (e: any) {
      setError(e?.message ?? 'Enter a valid birth date and time.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const { error } = await signUpWithEmail(email.trim(), password, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        birth_date: birthMoment.birthDate,
        birth_time: birthMoment.birthTime,
        birth_utc_offset_minutes: birthMoment.birthUtcOffsetMinutes ?? undefined,
        birth_location: birthLocation || undefined,
        time_zone: normalized,
        birth_lat: birthLat ?? undefined,
        birth_lon: birthLon ?? undefined,
      })

      if (error) {
        setError(error.message)
        return
      }

      navigation.replace('CheckEmail', {
        email: email.trim(),
        profile: {
          first_name: firstName || null,
          last_name: lastName || null,
          birth_date: birthMoment.birthDate,
          birth_time: birthMoment.birthTime,
          birth_utc_offset_minutes: birthMoment.birthUtcOffsetMinutes,
          birth_location: birthLocation || null,
          time_zone: normalized,
          birth_lat: birthLat ?? null,
          birth_lon: birthLon ?? null,
        },
      })
    } catch {
      setError(
        'Could not create your account. Check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthContainer formAppearance="soft">
      <View style={styles.introduction}>
        <AppText variant="display" accessibilityRole="header">
          Create your account
        </AppText>
        <MutedText variant="body" style={styles.subtitle}>
          Your natal chart begins with your birth details.
        </MutedText>
      </View>

      <AuthFormSection title="Account">
        <EmailField value={email} onChange={setEmail} />
        <PasswordField value={password} onChange={setPassword} />
      </AuthFormSection>

      <AuthFormSection title="Your birth details">
        <ProfileFields
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          birthTime={birthTime}
          setBirthTime={setBirthTime}
          birthUtcOffsetMinutes={birthUtcOffsetMinutes}
          setBirthUtcOffsetMinutes={setBirthUtcOffsetMinutes}
          birthLocation={birthLocation}
          setBirthLocation={setBirthLocation}
          timeZone={timeZone}
          setTimeZone={setTimeZone}
          birthLat={birthLat}
          birthLon={birthLon}
          setBirthLat={setBirthLat}
          setBirthLon={setBirthLon}
        />
      </AuthFormSection>

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
        title={submitting ? 'Signing Up…' : 'Sign Up'}
        variant="primary"
        onPress={handleSignup}
        disabled={submitting}
      />

      <View style={styles.footer}>
        <MutedText variant="bodySmall">Already have an account?</MutedText>
        <Button
          title="Log In"
          variant="tertiary"
          size="sm"
          onPress={() => navigation.replace('Login')}
          disabled={submitting}
        />
      </View>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  introduction: {
    paddingTop: theme.space.xxl,
    marginBottom: theme.space.xxxl,
  },
  subtitle: {
    marginTop: theme.space.sm,
  },
  error: {
    color: theme.state.danger,
    marginBottom: theme.space.lg,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.space.xs,
    marginTop: theme.space.md,
  },
})
