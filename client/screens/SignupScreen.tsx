// screens/SignupScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { signUpWithEmail } from '../lib/auth'

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async () => {
    const { error } = await signUpWithEmail(email, password)
    if (error) {
      setError(error.message)
    } else {
      navigation.replace('Dashboard') // or navigate to ProfileScreen next
    }
  }

  return (
    <View style={styles.container}>
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error !== '' && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Sign Up" onPress={handleSignup} />
      <Button
        title="Already have an account? Log In"
        onPress={() => navigation.replace('Login')}
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
    marginVertical: 10,
    borderRadius: 5,
  },
})
