import { useState } from 'react'
import { View, Text, Button, StyleSheet, Alert } from 'react-native'
import { useRoute } from '@react-navigation/native'
import supabase from '../lib/supabase'

export default function CheckEmailScreen({ navigation }: any) {
  const route = useRoute()
  const {
    email,
    firstName,
    lastName,
    birthDate,
    birthTime,
    birthLocation,
    timeZone,
  } = route.params as {
    email: string
    firstName: string
    lastName: string
    birthDate: string
    birthTime: string
    birthLocation: string
    timeZone: string
  }

  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('We’ve sent you a confirmation email. Please verify your email to continue.')

  const handleResend = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) {
      Alert.alert('Resend Failed', error.message)
    } else {
      setMessage('Verification email resent. Please check your inbox again.')
    }
  }

  const handleContinue = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Alert.alert('Still waiting…', 'Please confirm your email first.')
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_location: birthLocation,
      time_zone: timeZone,
    })

    if (insertError) {
      return Alert.alert('Insert Failed', insertError.message)
    }

    navigation.replace('Dashboard') // or wherever you want to go
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Continue to App" onPress={handleContinue} />
      <Button title="Resend Email" onPress={handleResend} disabled={resending} />
      <Button title="Back to Login" onPress={() => navigation.replace('Login')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
})
