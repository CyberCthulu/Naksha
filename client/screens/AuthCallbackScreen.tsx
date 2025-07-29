// screens/AuthCallbackScreen.tsx
import { useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import supabase from '../lib/supabase'

export default function AuthCallbackScreen({ navigation }: any) {
  useEffect(() => {
    const handleSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session && !error) {
        navigation.replace('Dashboard')
      } else {
        navigation.replace('Login')
      }
    }
    handleSession()
  }, [navigation])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text>Verifying your account...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
