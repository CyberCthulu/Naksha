// screens/ChartScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Alert, Button, ActivityIndicator } from 'react-native'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { birthToUTC } from '../lib/time'
import { computeNatalPlanets, findAspects, PlanetPos, Aspect } from '../lib/astro'
import { normalizeZone } from '../lib/timezones'
import ChartCompass from '../components/ChartCompass'
import supabase from '../lib/supabase'
import { saveChart } from '../lib/charts'

const ZODIAC = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
const signOf = (lon: number) => Math.floor(lon / 30)
const degInSign = (lon: number) => ((lon % 30) + 30) % 30

const GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
}

type ProfileForChart = {
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  first_name?: string | null
  last_name?: string | null
  birth_location?: string | null
}

export default function ChartScreen({ route }: any) {
  const { profile } = route.params as { profile: ProfileForChart }
  const savedMeta = (route.params?.saved?.meta) || {}
  const { width } = useWindowDimensions()
  const [loading, setLoading] = useState(true)
  const [planets, setPlanets] = useState<PlanetPos[]>([])
  const [aspects, setAspects] = useState<Aspect[]>([])
  const [isSaved, setIsSaved] = useState(false)

  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <Text style={styles.h1}>Natal Chart</Text>
        <Text style={{ opacity: 0.8, textAlign: 'center' }}>
          Missing birth date, time, or time zone. Please complete your profile.
        </Text>
      </View>
    )
  }

  const tz = normalizeZone(profile.time_zone)
  if (!tz) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <Text style={styles.h1}>Natal Chart</Text>
        <Text style={{ opacity: 0.8, textAlign: 'center' }}>
          Your saved time zone isn’t valid. Please update it in “Complete Profile”.
        </Text>
        <Text style={{ opacity: 0.6, marginTop: 6 }}>
          Current value: {String(profile.time_zone)}
        </Text>
      </View>
    )
  }

  useEffect(() => {
    let alive = true
    const loadChart = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (alive) setLoading(false)
          Alert.alert('Not signed in')
          return
        }

        // 1) Try to load saved
        const { data: existing, error } = await supabase
          .from('charts')
          .select('id, updated_at, chart_data')
          .eq('user_id', user.id)
          .eq('birth_date', profile.birth_date!)
          .eq('birth_time', profile.birth_time!)
          .eq('time_zone', tz)
          .maybeSingle()

        if (error) throw error

        if (existing?.chart_data) {
          if (!alive) return
          setPlanets(existing.chart_data.planets ?? [])
          setAspects(existing.chart_data.aspects ?? [])
          setIsSaved(true)
        } else {
          // 2) Compute, set state, and (optionally) auto-save once
          const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
          const ps = computeNatalPlanets(jsDate)
          const asps = findAspects(ps)
          if (!alive) return
          setPlanets(ps)
          setAspects(asps)
          setIsSaved(false)

          // Auto-save first time so future loads are instant
          try {
            await saveChart(user.id, {
              name: `${profile.first_name ?? 'My'} Natal Chart`,
              birth_date: profile.birth_date!,
              birth_time: profile.birth_time!,
              time_zone: tz,
            })
            if (alive) setIsSaved(true)
          } catch (e) {
            console.warn('Auto-save failed:', e)
          }
        }
      } catch (e: any) {
        Alert.alert('Error loading chart', e?.message ?? 'Unknown error')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadChart()
    return () => { alive = false }
  }, [profile.birth_date, profile.birth_time, tz])

  // Sizing
  const maxChart = 360
  const pad = 16
  const size = Math.min(Math.max(280, width - 32), maxChart)
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 26
  const rPlanets = (rOuter + rInner) / 2
  const rAspect = rInner - 6

  const toXY = (lonDeg: number, radius: number) => {
    const ang = (lonDeg * Math.PI) / 180
    const x = cx + Math.cos(-ang + Math.PI / 2) * radius
    const y = cy + Math.sin(-ang + Math.PI / 2) * radius
    return { x, y }
  }

  const aspectStroke: Record<Aspect['type'], number> = {
    conj: 2.0, opp: 1.8, trine: 1.6, square: 1.6, sextile: 1.2
  }

  const onSavePress = async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This chart is already in your library.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Alert.alert('Not signed in')
    try {
      await saveChart(user.id, {
        name: `${profile.first_name ?? 'My'} Natal Chart`,
        birth_date: profile.birth_date!,
        birth_time: profile.birth_time!,
        time_zone: tz,
      })
      setIsSaved(true)
      Alert.alert('Saved', 'Chart saved to your library.')
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading chart…</Text>
      </View>
    )
  }

  // subtitle pieces (prefer saved meta when available)
  const subtitleLocation = savedMeta.birth_location ?? (profile as any).birth_location ?? null
  const subtitleZone = savedMeta.time_zone ?? tz
  const subtitleCoords =
    (savedMeta.birth_lat != null && savedMeta.birth_lon != null)
      ? ` (${Number(savedMeta.birth_lat).toFixed(2)}, ${Number(savedMeta.birth_lon).toFixed(2)})`
      : ''

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>
        {`Natal Chart${profile.first_name ? ` — ${profile.first_name}` : ''}`}
      </Text>

      {(subtitleLocation || subtitleZone) && (
        <Text style={styles.sub}>
          {subtitleLocation ? `${subtitleLocation}` : ''}{subtitleLocation && subtitleZone ? ' • ' : ''}{subtitleZone}{subtitleCoords}
        </Text>
      )}

      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Button title={isSaved ? 'Already Saved' : 'Save Chart Data'} onPress={onSavePress} disabled={isSaved || loading}/>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Svg width={size} height={size} viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}>
          {/* Rings */}
          <Circle cx={cx} cy={cy} r={rOuter} stroke="#ccc" strokeWidth={1} fill="none" />
          <Circle cx={cx} cy={cy} r={rInner} stroke="#eee" strokeWidth={1} fill="none" />

          {/* 12 sign dividers + labels */}
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = i * 30
            const { x: x1, y: y1 } = toXY(ang, rInner)
            const { x: x2, y: y2 } = toXY(ang, rOuter)
            const { x: lx, y: ly } = toXY(ang, rOuter + 12)
            return (
              <G key={i}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth={1} />
                <SvgText x={lx} y={ly} fontSize="10" textAnchor="middle" dy="3">
                  {ZODIAC[i]}
                </SvgText>
              </G>
            )
          })}

          {/* Aspect lines */}
          {aspects.map((a, idx) => {
            const A = planets.find(p => p.name === a.a)
            const B = planets.find(p => p.name === a.b)
            if (!A || !B) return null
            const { x: x1, y: y1 } = toXY(A.lon, rAspect)
            const { x: x2, y: y2 } = toXY(B.lon, rAspect)
            return (
              <Line
                key={`${a.a}-${a.b}-${idx}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#777"
                strokeWidth={aspectStroke[a.type]}
                opacity={0.85}
                strokeDasharray={
                  a.type === 'sextile' ? '4 4'
                  : a.type === 'trine' ? '8 6'
                  : undefined
                }
              />
            )
          })}

          {/* Planets */}
          {planets.map((p) => {
            const { x, y } = toXY(p.lon, rPlanets)
            const glyph = GLYPH[p.name] ?? p.name[0]
            return (
              <G key={p.name}>
                <Circle cx={x} cy={y} r={9} fill="#222" />
                <SvgText x={x} y={y} fontSize="9" fill="#fff" textAnchor="middle" dy="3">
                  {glyph}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>

      <Text style={styles.h2}>Positions</Text>
      {planets.map((p) => {
        const s = signOf(p.lon)
        const degFloat = degInSign(p.lon)
        const deg = Math.floor(degFloat)
        const min = Math.round((degFloat - deg) * 60)
        const mm = String(min).padStart(2, '0')
        return (
          <Text key={p.name} style={styles.row}>
            {`${p.name.padEnd(7)} ${ZODIAC[s]} ${deg}°${mm}′`}
          </Text>
        )
      })}

      <View style={{ height: 16 }} />
      <ChartCompass style={{ marginBottom: 12 }} />

      <Text style={styles.h2}>Aspects</Text>
      {aspects.length === 0 ? (
        <Text style={styles.muted}>None (within default orbs)</Text>
      ) : (
        aspects
          .slice()
          .sort((a, b) => a.orb - b.orb)
          .map((a, i) => (
            <Text key={`${a.a}-${a.b}-${i}`} style={styles.row}>
              {`${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(2)}°)`}
            </Text>
          ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  h1: { fontSize: 18, fontWeight: '600', marginBottom: 4, alignSelf: 'center' },
  sub: { opacity: 0.7, alignSelf: 'center', marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: '600', marginTop: 16, alignSelf: 'flex-start' },
  row: { fontFamily: 'monospace' as any, alignSelf: 'flex-start' },
  muted: { opacity: 0.7, alignSelf: 'flex-start' },
})
