import { useEffect } from 'react'
import { View, Text } from 'react-native'
import supabase from '../lib/supabase'

export default function TestSupabase() {
  useEffect(() => {
    const checkConnection = async () => {
      const { data, error } = await supabase.from('charts').select('*')
      console.log('📊 Supabase Test:', { data, error })
    }

    checkConnection()
  }, [])

  return (
    <View style={{ padding: 20 }}>
      <Text>Testing Supabase connection…</Text>
    </View>
  )
}
