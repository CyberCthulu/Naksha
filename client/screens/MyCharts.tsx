//screens/MyCharts.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { type ChartRow, listCharts, deleteChart } from '../lib/charts'
import {
  UNSUPPORTED_CHART_DATA_MESSAGE,
  validateChartData,
  type ChartDataValidationResult,
} from '../lib/chartDataValidation'

import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { LoadingState } from '../components/ui/LoadingState'
import type { RootStackParamList } from '../navigation/types'

type ChartListItem = {
  row: ChartRow
  validation: ChartDataValidationResult
  summary: string
}

function toChartListItem(row: ChartRow): ChartListItem {
  const validation = validateChartData(row.chart_data)
  const meta = validation.status === 'valid' ? validation.data.meta : null

  const unavailableSummary =
    validation.status === 'unsupported'
      ? 'Update Naksha to view this chart'
      : 'Chart data unavailable'

  const base = meta
    ? [meta.birth_date, meta.birth_time, meta.time_zone]
        .filter(Boolean)
        .join(' · ')
    : unavailableSummary

  const coords =
    meta?.birth_lat != null && meta.birth_lon != null
      ? ` · (${meta.birth_lat.toFixed(2)}, ${meta.birth_lon.toFixed(2)})`
      : ''

  return { row, validation, summary: `${base}${coords}` }
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

  useEffect(() => {
    load()
  }, [load])

  const items = useMemo(() => rows.map(toChartListItem), [rows])

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

  const remove = async (row: ChartRow) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    Alert.alert('Delete chart?', row.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChart(row.id, user.id)
            load()
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? 'Unknown error')
          }
        },
      },
    ])
  }

  if (loading) {
    return <LoadingState label="Loading charts" size="large" />
  }

  if (error) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.errorText}>{error}</Text>
        <Button title="Retry" onPress={load} />
        <View style={{ height: 8 }} />
        <Button title="Go Back" variant="ghost" onPress={() => nav.goBack()} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title="My Charts"
        onBack={() => nav.goBack()}
        style={[styles.header, { paddingTop: insets.top + theme.space.md }]}
      />

      {items.length === 0 ? (
        <View style={uiStyles.center}>
          <Text style={uiStyles.muted}>No charts yet.</Text>
          <Text style={uiStyles.muted}>Save one from the chart screen to get started.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            padding: theme.spacing.screen,
            paddingBottom: insets.bottom + 24,
          }}
          data={items}
          keyExtractor={(item) => String(item.row.id)}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={uiStyles.card}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.row.name}`}
                onPress={() => openChart(item)}
                style={styles.openRegion}
              >
                <Text style={styles.title}>{item.row.name}</Text>
                <Text style={styles.sub}>{item.summary}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.row.name}`}
                onPress={() => remove(item.row)}
                style={styles.deleteButton}
              >
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.screen,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  sub: {
    color: theme.colors.muted,
    marginTop: 4,
    fontSize: 13,
  },
  openRegion: {
    flex: 1,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 48,
  },
  delete: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
})
