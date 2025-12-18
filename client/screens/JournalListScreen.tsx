// screens/JournalListScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { listJournals, deleteJournal, JournalRow } from '../lib/journals'
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

function makeDisplayTitle(row: JournalRow) {
  if (row.title && row.title.trim()) return row.title.trim()
  const firstLine = (row.content ?? '')
    .split(/\r?\n/)
    .find((l) => l.trim().length > 0)
  return firstLine?.trim() || 'Untitled entry'
}

export default function JournalListScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false })
  }, [nav])

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<JournalRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listJournals()
      setRows(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load journals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const onDelete = async (id: number) => {
    try {
      await deleteJournal(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e: any) {
      Alert.alert('Delete failed', e?.message ?? 'Unknown error')
    }
  }

  const confirmDelete = (row: JournalRow) => {
    const title = makeDisplayTitle(row)
    Alert.alert('Delete entry?', title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(row.id) },
    ])
  }

  if (loading) {
    return (
      <View style={uiStyles.center}>
        <ActivityIndicator />
        <Text style={[uiStyles.text, { marginTop: 8 }]}>Loading journals…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load} style={{ marginTop: 10 }}>
          <Text style={styles.link}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar */}
      <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Your Journal</Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: theme.spacing.screen,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() =>
              nav.navigate('JournalEditor', {
                id: undefined,
                title: '',
                content: '',
              })
            }
          >
            <Text style={styles.newBtnText}>+ Share your thoughts</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <Text style={uiStyles.muted}>No entries yet.</Text>
        }
        renderItem={({ item }) => {
          const ts = item.updated_at ?? item.created_at
          const edited = !!item.updated_at && item.updated_at !== item.created_at
          const title = makeDisplayTitle(item)

          return (
            <TouchableOpacity
              style={uiStyles.card}
              onPress={() =>
                nav.navigate('JournalEditor', {
                  id: item.id,
                  title: item.title ?? '',
                  content: item.content,
                })
              }
              onLongPress={() => confirmDelete(item)}
            >
              <Text style={styles.entryTitle} numberOfLines={1}>
                {title}
              </Text>

              <Text style={styles.entryBody} numberOfLines={3}>
                {item.content}
              </Text>

              <Text style={styles.meta}>
                {edited ? 'Edited: ' : 'Created: '}
                {new Date(ts).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen,
    marginBottom: 8,
  },
  backText: {
    fontSize: 28,
    color: theme.colors.text,
    width: 24,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },

  link: { fontWeight: '600', color: '#007AFF' },

  newBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  newBtnText: {
    color: theme.colors.text,
    fontWeight: '700',
  },

  entryTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  entryBody: {
    color: theme.colors.sub,
    marginTop: 6,
    lineHeight: 18,
  },
  meta: {
    marginTop: 10,
    fontSize: 12,
    color: theme.colors.muted,
  },
})
