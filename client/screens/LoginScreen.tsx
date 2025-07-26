// screens/LoginScreen.tsx
import { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet } from 'react-native'
import { signInWithEmail } from '../lib/auth'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

const handleLogin = async () => {
  const { error, data } = await signInWithEmail(email, password);
  if (error) {
    if (error.message.includes("Email not confirmed")) {
      setError("Please verify your email before logging in.");
    } else {
      setError(error.message);
    }
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
      <Button
      title="Don't have an account? Sign Up"
      onPress={() => navigation.navigate('Signup')}
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
    borderRadius: 5
  }
})
