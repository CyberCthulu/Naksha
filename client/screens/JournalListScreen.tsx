// screens/JournalListScreen.tsx
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { listJournals, deleteJournal, JournalRow } from '../lib/journals'

export default function JournalListScreen() {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<JournalRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await listJournals()
      setRows(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load journals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const onDelete = async (id: number) => {
    try {
      await deleteJournal(id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      Alert.alert('Delete failed', e?.message ?? 'Unknown error')
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading journals…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'crimson', marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity onPress={load}><Text>Retry</Text></TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Your Journal</Text>

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => nav.navigate('JournalEditor', { id: undefined, content: '' })}
      >
        <Text style={styles.newBtnText}>+ New Entry</Text>
      </TouchableOpacity>

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const ts = item.updated_at ?? item.created_at
          const edited = !!item.updated_at && item.updated_at !== item.created_at

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate('JournalEditor', { id: item.id, content: item.content })}
              onLongPress={() => onDelete(item.id)}
            >
              <Text numberOfLines={3}>{item.content}</Text>
              <Text style={styles.meta}>
                {edited ? 'Edited: ' : 'Created: '}
                {new Date(ts).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={<Text style={{ opacity: 0.7 }}>No entries yet.</Text>}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { flex: 1, padding: 16, paddingTop: 40 },
  h1: { fontSize: 22, fontWeight: '600', marginBottom: 10 },
  newBtn: {
    borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10
  },
  newBtnText: { fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  meta: { marginTop: 6, fontSize: 12, opacity: 0.6 }
})
