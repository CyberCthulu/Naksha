// screens/DashboardScreen.tsx
import { View, Text, Button, StyleSheet } from 'react-native'
import { signOut } from '../lib/auth'

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Naksha 🌌</Text>
      <Text>This is your dashboard. More coming soon.</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
})
