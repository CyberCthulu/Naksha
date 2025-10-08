//client/screens/SignupScreen.tsx

import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Platform, Alert } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { signUpWithEmail } from '../lib/auth'
import { TIMEZONES, normalizeZone } from '../lib/timezones'

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('') // will hold IANA after normalize
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Detect device zone, normalize it, default picker to that value if valid
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const normalized = normalizeZone(detected) || 'Etc/UTC'
    setTimeZone(normalized)
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

    // Normalize and verify the selected time zone
    const normalized = normalizeZone(timeZone)
    if (!normalized) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    setError('')
    setSubmitting(true)

    // Format values for DB / auth
    const formattedDate = birthDate.toISOString().split('T')[0]      // YYYY-MM-DD
    const formattedTime = birthTime.toTimeString().split(' ')[0]     // HH:MM:SS

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
    <View style={styles.container}>
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text>First Name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text>Last Name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <Text>Birth Date</Text>
      <Button
        title={birthDate ? birthDate.toDateString() : 'Select Date'}
        onPress={() => setShowDatePicker(true)}
        disabled={submitting}
      />
      {showDatePicker && (
        <DateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false)
            if (selectedDate) setBirthDate(selectedDate)
          }}
        />
      )}

      <Text>Birth Time</Text>
      <Button
        title={birthTime ? birthTime.toLocaleTimeString() : 'Select Time'}
        onPress={() => setShowTimePicker(true)}
        disabled={submitting}
      />
      {showTimePicker && (
        <DateTimePicker
          value={birthTime || new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedTime) => {
            setShowTimePicker(false)
            if (selectedTime) setBirthTime(selectedTime)
          }}
        />
      )}

      <Text>Birth Location</Text>
      <TextInput style={styles.input} value={birthLocation} onChangeText={setBirthLocation} />

      <Text>Time Zone</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={timeZone} onValueChange={(v) => setTimeZone(v)}>
          {TIMEZONES.map((tz) => (
            <Picker.Item key={tz} label={tz} value={tz} />
          ))}
        </Picker>
      </View>

      {error !== '' && <Text style={{ color: 'red', marginTop: 6 }}>{error}</Text>}

      <View style={{ height: 8 }} />
      <Button title={submitting ? 'Signing Up…' : 'Sign Up'} onPress={handleSignup} disabled={submitting} />

      <View style={{ height: 8 }} />
      <Button
        title="Already have an account? Log In"
        onPress={() => navigation.replace('Login')}
        disabled={submitting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    marginVertical: 5,
    overflow: 'hidden',
  },
})
