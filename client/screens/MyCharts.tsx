// screens/MyCharts.tsx
import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { ChartRow, listCharts, deleteChart } from '../lib/charts'

export default function MyChartsScreen() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ChartRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigation<any>()

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
            Alert.alert('Delete failed', e.message ?? 'Unknown error')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading charts…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'crimson' }}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>My Charts</Text>
      {rows.length === 0 ? (
        <Text style={{ opacity: 0.7 }}>
          No charts yet. Save one from the chart screen.
        </Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
            const loc = meta.birth_location ? `${meta.birth_location} · ` : ''

            return (
              <TouchableOpacity
                onPress={() => openChart(item)}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.sub}>
                    {loc}
                    {base}
                    {coords}
                  </Text>
                </View>
                <Text style={styles.delete} onPress={() => remove(item)}>
                  Delete
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, padding: 16, paddingTop: 24 },
  h1: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
  },
  title: { fontWeight: '600' },
  sub: { opacity: 0.7, marginTop: 2 },
  delete: { color: 'crimson', marginLeft: 12 },
})
