// screens/MyCharts.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { ChartRow, listCharts, deleteChart } from '../lib/charts'

import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

export default function MyChartsScreen() {
  const nav = useNavigation<any>()
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
      if (!user) throw new Error('Not signed in')

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

  const openChart = (row: ChartRow) => {
    const data = row.chart_data
    const meta = data?.meta || {}

    nav.navigate('Chart', {
      fromSaved: true,
      saved: data,
      profile: {
        birth_date: meta.birth_date ?? row.birth_date ?? null,
        birth_time: meta.birth_time ?? row.birth_time ?? null,
        time_zone: meta.time_zone ?? row.time_zone ?? null,
        first_name: meta.name ?? null,
        last_name: null,
        birth_location: meta.birth_location ?? null,
        birth_lat: meta.birth_lat ?? row.birth_lat ?? null,
        birth_lon: meta.birth_lon ?? row.birth_lon ?? null,
      },
    })
  }

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
    return (
      <View style={uiStyles.center}>
        <ActivityIndicator />
        <Text style={[uiStyles.text, { marginTop: 8 }]}>
          Loading charts…
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar */}
      <View
        style={[
          styles.topRow,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>My Charts</Text>

        <View style={{ width: 24 }} />
      </View>

      {rows.length === 0 ? (
        <View style={uiStyles.center}>
          <Text style={uiStyles.muted}>
            No charts yet. Save one from the chart screen.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            padding: theme.spacing.screen,
            paddingBottom: insets.bottom + 24,
          }}
          data={rows}
          keyExtractor={(r) => String(r.id)}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const meta = item.chart_data?.meta || {}
            const base = [meta.birth_date, meta.birth_time, meta.time_zone]
              .filter(Boolean)
              .join(' · ')

            const coords =
              meta.birth_lat != null && meta.birth_lon != null
                ? ` · (${Number(meta.birth_lat).toFixed(2)}, ${Number(
                    meta.birth_lon
                  ).toFixed(2)})`
                : ''

            const loc = meta.birth_location
              ? `${meta.birth_location} · `
              : ''

            return (
              <TouchableOpacity
                onPress={() => openChart(item)}
                style={uiStyles.card}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.sub}>
                    {loc}
                    {base}
                    {coords}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => remove(item)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )
          }}
        />
      )}
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
  delete: {
    color: theme.colors.danger,
    fontWeight: '600',
    marginLeft: 12,
  },
})
