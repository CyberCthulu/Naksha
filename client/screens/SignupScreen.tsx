//screens/SignupScreen.tsx

import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import supabase from '../lib/supabase'
import { signUpWithEmail } from '../lib/auth'

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setTimeZone(detected)
  }, [])

  const handleSignup = async () => {
    if (!birthDate || !birthTime) {
      setError('Please select both birth date and time.')
      return
    }

    const formattedDate = birthDate.toISOString().split('T')[0]
    const formattedTime = birthTime.toTimeString().split(' ')[0]

    const { data, error } = await signUpWithEmail(email, password)
    if (error) {
      setError(error.message)
      return
    }

    const userId = data?.user?.id
    if (!userId) {
      setError('Signup succeeded but no user ID returned.')
      return
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      birth_date: formattedDate,
      birth_time: formattedTime,
      birth_location: birthLocation,
      time_zone: timeZone,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
  navigation.replace('CheckEmail', { email })
    }
  }

  return (
    <View style={styles.container}>
      <Text>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} />

      <Text>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Text>First Name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text>Last Name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <Text>Birth Date</Text>
      <Button title={birthDate ? birthDate.toDateString() : 'Select Date'} onPress={() => setShowDatePicker(true)} />
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
      <Button title={birthTime ? birthTime.toLocaleTimeString() : 'Select Time'} onPress={() => setShowTimePicker(true)} />
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

      <Text>Time Zone (auto-detected)</Text>
      <TextInput style={styles.input} value={timeZone} editable={false} />

      {error !== '' && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Sign Up" onPress={handleSignup} />
      <Button title="Already have an account? Log In" onPress={() => navigation.replace('Login')} />
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
})
