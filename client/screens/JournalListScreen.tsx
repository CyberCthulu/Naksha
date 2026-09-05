// screens/JournalListScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { View, FlatList, Pressable, Alert, StyleSheet } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { listJournals, deleteJournal, JournalRow } from '../lib/journals'
import { AppText, MutedText } from '../components/ui/AppText'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { theme } from '../components/ui/theme'
import type { RootStackParamList } from '../navigation/types'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * An entry's own words come first; the title is optional.
 *
 * Unchanged from V1 and deliberately so -- this is the only place the naming
 * rule lives, and the list and its accessibility labels both read from it.
 */
function makeDisplayTitle(row: JournalRow) {
  if (row.title && row.title.trim()) return row.title.trim()
  const firstLine = (row.content ?? '')
    .split(/\r?\n/)
    .find((l) => l.trim().length > 0)
  return firstLine?.trim() || 'Untitled entry'
}

/**
 * "15 Sep 2026 · 1:55 PM", in the device's own zone.
 *
 * `toLocaleString()` produced a dense machine string whose length swung with
 * the locale. This keeps the same local-time semantics -- the Date is read
 * through local getters, exactly as before -- while saying the date the way a
 * reader would. The year is always present because a journal outlives one.
 *
 * An unparseable timestamp yields null and the line is simply omitted, rather
 * than printing "Invalid Date" over someone's writing.
 */
export function formatEntryTimestamp(
  value: string | null | undefined
): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const month = MONTHS[date.getMonth()]
  if (!month) return null

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${date.getDate()} ${month} ${date.getFullYear()} · ${time}`
}

/** "Edited" only when the row has genuinely been changed since creation. */
function entryDateLabel(row: JournalRow): string | null {
  const edited = !!row.updated_at && row.updated_at !== row.created_at
  const stamp = formatEntryTimestamp(row.updated_at ?? row.created_at)

  if (!stamp) return null
  return `${edited ? 'Edited' : 'Created'} ${stamp}`
}

export default function JournalListScreen() {
  const nav =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'JournalList'>
    >()
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

  /**
   * The one way a new entry is started.
   *
   * Both creation affordances route through this, so the empty state and the
   * header action can never drift into navigating differently.
   */
  const openNewEntry = useCallback(() => {
    nav.navigate('JournalEditor', {
      id: undefined,
      title: '',
      content: '',
    })
  }, [nav])

  const openEntry = useCallback(
    (row: JournalRow) => {
      nav.navigate('JournalEditor', {
        id: row.id,
        title: row.title ?? '',
        content: row.content,
        promptTemplateId: row.prompt_template,
      })
    },
    [nav]
  )

  const onDelete = useCallback(async (id: number) => {
    try {
      await deleteJournal(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e: any) {
      Alert.alert('Delete failed', e?.message ?? 'Unknown error')
    }
  }, [])

  /**
   * The single confirmation path.
   *
   * The trailing control, the long press and the accessibility action all
   * land here, so no route into deletion can skip the confirmation.
   */
  const confirmDelete = useCallback(
    (row: JournalRow) => {
      Alert.alert('Delete entry?', makeDisplayTitle(row), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(row.id),
        },
      ])
    },
    [onDelete]
  )

  if (loading) {
    return <LoadingState label="Loading journals" />
  }

  if (error) {
    return (
      <ErrorState
        testID="journal-list-error"
        title="Could not load your journal"
        description={error}
        action={{ label: 'Retry', onPress: load }}
      />
    )
  }

  const isEmpty = rows.length === 0

  return (
    <View style={styles.screen}>
      {/*
        One creation action at a time. When the list is empty the empty state
        is the invitation and carries it; once there are entries the header
        does. Rendering both would put two identical calls to action on one
        screen, which is the mistake the editor's duplicated Save was.
      */}
      <ScreenHeader
        title="Your Journal"
        onBack={() => nav.goBack()}
        rightAction={
          isEmpty
            ? undefined
            : {
                label: 'New',
                onPress: openNewEntry,
                accessibilityLabel: 'Write a new entry',
              }
        }
        style={[styles.header, { paddingTop: insets.top + theme.space.xs }]}
      />

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          isEmpty && styles.listEmpty,
          { paddingBottom: insets.bottom + theme.space.xxl },
        ]}
        ListEmptyComponent={
          <EmptyState
            testID="journal-list-empty"
            title="Nothing written yet"
            description="Your reflections live here. Start with whatever is on your mind."
            action={{
              label: 'Write your first entry',
              onPress: openNewEntry,
            }}
          />
        }
        renderItem={({ item }) => {
          const title = makeDisplayTitle(item)
          const dateLabel = entryDateLabel(item)

          return (
            <Card style={styles.row} testID={`journal-row-${item.id}`}>
              {/*
                The open region and the delete control are siblings.

                Nesting the second inside the first is the defect MyCharts
                already had to unpick: the outer press wins the touch, so the
                inner control either never fires or fires along with it.
              */}
              <Pressable
                testID={`journal-open-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={
                  dateLabel ? `${title}, ${dateLabel}` : title
                }
                accessibilityActions={[
                  { name: 'delete', label: 'Delete entry' },
                ]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'delete') {
                    confirmDelete(item)
                  }
                }}
                onPress={() => openEntry(item)}
                onLongPress={() => confirmDelete(item)}
                style={({ pressed }) => [
                  styles.rowMain,
                  pressed && styles.rowPressed,
                ]}
              >
                <AppText variant="subheading" numberOfLines={2} style={styles.entryTitle}>
                  {title}
                </AppText>

                <MutedText
                  variant="bodySmall"
                  numberOfLines={3}
                  style={styles.entryPreview}
                >
                  {item.content}
                </MutedText>

                {dateLabel ? (
                  <MutedText variant="caption" style={styles.entryMeta}>
                    {dateLabel}
                  </MutedText>
                ) : null}
              </Pressable>

              <Pressable
                testID={`journal-delete-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${title}`}
                onPress={() => confirmDelete(item)}
                style={({ pressed }) => [
                  styles.rowDelete,
                  pressed && styles.rowPressed,
                ]}
              >
                <Icon name="delete" size="sm" color={theme.state.danger} />
              </Pressable>
            </Card>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.space.xl,
  },
  list: {
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.sm,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    columnGap: theme.space.md,
  },
  rowMain: {
    flex: 1,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowDelete: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.touchTarget.min,
    minWidth: theme.touchTarget.min,
  },
  entryTitle: {
    color: theme.text.primary,
  },
  entryPreview: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
  entryMeta: {
    color: theme.text.tertiary,
    marginTop: theme.space.md,
  },
})
