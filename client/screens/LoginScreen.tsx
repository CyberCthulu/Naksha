// screens/LoginScreen.tsx
import { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet } from 'react-native'
import { signInWithEmail } from '../lib/auth'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { error } = await signInWithEmail(email, password)
    if (error) {
      setError(error.message)
    } else {
      navigation.replace('Dashboard') // assumes you’ll create a Dashboard route
    }
  }

  return (
    <View style={styles.container}>
      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />
      <Text>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error !== '' && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Login" onPress={handleLogin} />
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
    borderRadius: 5
  }
})
