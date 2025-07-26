// screens/CheckEmailScreen.tsx
// import { View, Text, Button, StyleSheet } from 'react-native'

// export default function CheckEmailScreen({ navigation }: any) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Check your inbox</Text>
//       <Text style={styles.message}>
//         We’ve sent you a confirmation email. Please verify your email to continue.
//       </Text>
//       <Button title="Back to Login" onPress={() => navigation.replace('Login')} />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
//   message: { fontSize: 16, marginBottom: 20, textAlign: 'center' }
// })


import { useState } from 'react'
import { View, Text, Button, StyleSheet, Alert } from 'react-native'
import { useRoute } from '@react-navigation/native'
import supabase from '../lib/supabase'

export default function CheckEmailScreen({ navigation }: any) {
  const route = useRoute()
  const { email } = route.params as { email: string }

  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('We’ve sent you a confirmation email. Please verify your email to continue.')

  const handleResend = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    setResending(false)

    if (error) {
      Alert.alert('Resend Failed', error.message)
    } else {
      setMessage('Verification email resent. Please check your inbox again.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.message}>{message}</Text>
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
