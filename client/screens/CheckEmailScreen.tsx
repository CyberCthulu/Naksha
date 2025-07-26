// screens/CheckEmailScreen.tsx
import { View, Text, Button, StyleSheet } from 'react-native'

export default function CheckEmailScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.message}>
        We’ve sent you a confirmation email. Please verify your email to continue.
      </Text>
      <Button title="Back to Login" onPress={() => navigation.replace('Login')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 16, marginBottom: 20, textAlign: 'center' }
})
