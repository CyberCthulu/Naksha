//screens/MyCharts.tsx
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { View, FlatList, Pressable, Alert, StyleSheet } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { type ChartRow, listCharts, deleteChart } from '../lib/charts'
import {
  UNSUPPORTED_CHART_DATA_MESSAGE,
  validateChartData,
  type ChartDataValidationResult,
} from '../lib/chartDataValidation'
import { formatBirthMoment } from '../lib/time'

import { AppText, MutedText } from '../components/ui/AppText'
import { Card } from '../components/ui/Card'
import { ChartMark } from '../components/charts/ChartMark'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { theme } from '../components/ui/theme'
import type { RootStackParamList } from '../navigation/types'

/** The emblem's rendered size. See ChartMark for why it is drawn, not scaled. */
const MARK_SIZE = 64

type ChartListItem = {
  row: ChartRow
  validation: ChartDataValidationResult
  summary: string
}

/**
 * Validation happens once, here, when the rows arrive.
 *
 * Nothing below re-reads it: the row's emblem carries no chart data at all,
 * and `validation` is consulted only to decide whether the row can be opened
 * and which emblem state to show. A saved chart is parsed and checked exactly
 * once per load, never per frame.
 */
function toChartListItem(row: ChartRow): ChartListItem {
  const validation = validateChartData(row.chart_data)
  const meta = validation.status === 'valid' ? validation.data.meta : null

  const unavailableSummary =
    validation.status === 'unsupported'
      ? 'Update Naksha to view this chart'
      : 'Chart data unavailable'

  /*
   * Birth moment only.
   *
   * This line used to read "1997-09-15 · 13:55:00 · America/Los_Angeles ·
   * (37.49, -122.23)" -- a database row wearing a card. The zone and the
   * coordinates are still stored and still drive every calculation; they are
   * simply not what a reader needs to tell one saved chart from another.
   */
  return {
    row,
    validation,
    summary: meta
      ? formatBirthMoment(meta.birth_date, meta.birth_time) ?? unavailableSummary
      : unavailableSummary,
  }
}

export default function MyChartsScreen() {
  const nav =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'MyCharts'>>()
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    nav.setOptions({ headerShown: false })
  }, [nav])

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ChartRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not signed in')
      }

      const list = await listCharts(user.id)
      setRows(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load charts')
    } finally {
      setLoading(false)
    }
  }, [])

  /*
   * Focus is the only trigger.
   *
   * It fires on first mount as well as on every return, so pairing it with a
   * mount effect would fetch the list twice on the way in. Saving a chart
   * elsewhere and coming back now refreshes, which the mount-only version
   * never did.
   */
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const items = useMemo(() => rows.map(toChartListItem), [rows])

  const openNewChart = useCallback(() => {
    nav.navigate('CreateGuestChart')
  }, [nav])

  const openChart = useCallback(
    ({ row, validation }: ChartListItem) => {
      if (validation.status === 'unsupported') {
        Alert.alert('Chart update required', UNSUPPORTED_CHART_DATA_MESSAGE)
        return
      }

      if (validation.status === 'invalid') {
        Alert.alert(
          'Chart unavailable',
          'This saved chart data could not be read. Recreate the chart to open it again.'
        )
        return
      }

      const data = validation.data
      const meta = data.meta

      nav.navigate('Chart', {
        fromSaved: true,
        saved: data,
        profile: {
          birth_date: meta.birth_date ?? row.birth_date ?? null,
          birth_time: meta.birth_time ?? row.birth_time ?? null,
          time_zone: meta.time_zone ?? row.time_zone ?? null,
          first_name: row.name ?? null,
          last_name: null,
          birth_location: null,
          birth_lat: meta.birth_lat ?? row.birth_lat ?? null,
          birth_lon: meta.birth_lon ?? row.birth_lon ?? null,
        },
      })
    },
    [nav]
  )

  /**
   * The single confirmation path, shared by the icon, the long press and the
   * accessibility action -- the same arrangement the Journal list uses.
   */
  const confirmDelete = useCallback(
    (row: ChartRow) => {
      Alert.alert('Delete chart?', row.name, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser()

              if (!user) return

              await deleteChart(row.id, user.id)
              load()
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message ?? 'Unknown error')
            }
          },
        },
      ])
    },
    [load]
  )

  if (loading) {
    return <LoadingState label="Loading charts" size="large" />
  }

  if (error) {
    return (
      <ErrorState
        testID="my-charts-error"
        title="Could not load your charts"
        description={error}
        action={{ label: 'Retry', onPress: load }}
        secondaryAction={{ label: 'Go back', onPress: () => nav.goBack() }}
      />
    )
  }

  const isEmpty = items.length === 0

  return (
    <View style={styles.screen}>
      {/* One creation action at a time -- see the note on the Journal list. */}
      <ScreenHeader
        title="My Charts"
        onBack={() => nav.goBack()}
        rightAction={
          isEmpty
            ? undefined
            : {
                label: 'New',
                onPress: openNewChart,
                accessibilityLabel: 'Create a new chart',
              }
        }
        style={[styles.header, { paddingTop: insets.top + theme.space.xs }]}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.row.id)}
        contentContainerStyle={[
          styles.list,
          isEmpty && styles.listEmpty,
          { paddingBottom: insets.bottom + theme.space.xxl },
        ]}
        ListEmptyComponent={
          <EmptyState
            testID="my-charts-empty"
            title="No charts saved yet"
            description="Charts you save appear here, ready to open again."
            action={{ label: 'Create a chart', onPress: openNewChart }}
          />
        }
        renderItem={({ item }) => {
          const chart =
            item.validation.status === 'valid' ? item.validation.data : null

          return (
            <Card style={styles.row} testID={`chart-row-${item.row.id}`}>
              <Pressable
                testID={`chart-open-${item.row.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.row.name}, ${item.summary}`}
                accessibilityActions={[
                  { name: 'delete', label: 'Delete chart' },
                ]}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'delete') {
                    confirmDelete(item.row)
                  }
                }}
                onPress={() => openChart(item)}
                onLongPress={() => confirmDelete(item.row)}
                style={({ pressed }) => [
                  styles.rowMain,
                  pressed && styles.rowPressed,
                ]}
              >
                {/*
                  Decorative. The row's accessible label above carries every
                  piece of meaning, so this is hidden rather than described --
                  an emblem that announced itself would say "chart" twice.
                */}
                <View
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.mark, !chart && styles.markUnreadable]}
                >
                  {chart ? (
                    <ChartMark size={MARK_SIZE} />
                  ) : (
                    <Icon name="charts" size="sm" color={theme.text.disabled} />
                  )}
                </View>

                <View style={styles.rowText}>
                  <AppText variant="subheading" numberOfLines={2} style={styles.name}>
                    {item.row.name}
                  </AppText>
                  <MutedText variant="bodySmall" style={styles.summary}>
                    {item.summary}
                  </MutedText>
                </View>
              </Pressable>

              <Pressable
                testID={`chart-delete-${item.row.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.row.name}`}
                onPress={() => confirmDelete(item.row)}
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
    rowGap: theme.space.md,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: theme.space.md,
  },
  rowMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    columnGap: theme.space.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  mark: {
    alignItems: 'center',
    height: MARK_SIZE,
    justifyContent: 'center',
    width: MARK_SIZE,
  },
  /* An unreadable chart gets a plain outline: present, but plainly not a chart. */
  markUnreadable: {
    borderColor: theme.border.base,
    borderRadius: MARK_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: {
    color: theme.text.primary,
  },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.hair,
  },
  rowDelete: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.touchTarget.min,
    minWidth: theme.touchTarget.min,
  },
})
