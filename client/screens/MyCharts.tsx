import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native'
import supabase from '../lib/supabase'
import { ChartRow, listCharts, deleteChart } from '../lib/charts'
import { useNavigation } from '@react-navigation/native'

export default function MyChartsScreen() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ChartRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigation<any>()

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const list = await listCharts(user.id)
      setRows(list)
    } catch (e:any) {
      setError(e?.message ?? 'Failed to load charts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openChart = (row: ChartRow) => {
    const data = row.chart_data
    // Navigate to Chart screen showing the saved data instead of recomputing
    nav.navigate('Chart', { fromSaved: true, saved: data, profile: {
      // for header; also allows ChartScreen’s existing UI to fallback
      birth_date: data?.meta?.birth_date ?? null,
      birth_time: data?.meta?.birth_time ?? null,
      time_zone : data?.meta?.time_zone ?? null,
      first_name: data?.meta?.name ?? null,
      last_name : null,
    }})
  }

  const remove = async (row: ChartRow) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    Alert.alert('Delete chart?', row.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteChart(row.id, user.id); load() }
          catch (e:any) { Alert.alert('Delete failed', e.message ?? 'Unknown error') }
        }
      }
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /><Text>Loading charts…</Text></View>
  }
  if (error) {
    return <View style={styles.center}><Text style={{color:'crimson'}}>{error}</Text></View>
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>My Charts</Text>
      {rows.length === 0 ? (
        <Text style={{opacity:0.7}}>No charts yet. Save one from the chart screen.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          ItemSeparatorComponent={() => <View style={{height:10}} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openChart(item)} style={styles.row}>
              <View style={{flex:1}}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.chart_data?.meta?.birth_date} · {item.chart_data?.meta?.birth_time} · {item.chart_data?.meta?.time_zone}
                </Text>
              </View>
              <Text style={styles.delete} onPress={() => remove(item)}>Delete</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  container: { flex:1, padding:16, paddingTop:24 },
  h1: { fontSize:20, fontWeight:'600', marginBottom:12 },
  row: { flexDirection:'row', alignItems:'center', padding:12, borderWidth:1, borderColor:'#e6e6e6', borderRadius:8 },
  title: { fontWeight:'600' },
  sub: { opacity:0.7, marginTop:2 },
  delete: { color: 'crimson', marginLeft: 12 }
})
