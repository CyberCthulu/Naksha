// screens/ChartScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Alert, Button, ActivityIndicator } from 'react-native'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ParamListBase } from '@react-navigation/native'
import { birthToUTC } from '../lib/time'
import { computeNatalPlanets, findAspects, computeWholeSignHouses, PlanetPos, Aspect, HouseCusp } from '../lib/astro'
import { zodiacNameFromLongitude, getPlanetSignMeaning, getHouseMeaning, getAspectMeaning } from '../lib/lexicon'
import { normalizeZone } from '../lib/timezones'
import ChartCompass from '../components/ChartCompass'
import supabase from '../lib/supabase'
import { saveChart } from '../lib/charts'

const ZODIAC = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
const signOf = (lon: number) => Math.floor(((lon % 360) + 360) / 30) % 12
const degInSign = (lon: number) => ((lon % 30) + 30) % 30

const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

type ProfileForChart = {
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  birth_lat?: number | null
  birth_lon?: number | null
  birth_location?: string | null
  first_name?: string | null
  last_name?: string | null
}

type SavedChartPayload = {
  meta?: any
  planets?: PlanetPos[]
  aspects?: Aspect[]
  houses?: HouseCusp[] | null
}

type RouteParams = {
  profile: ProfileForChart
  fromSaved?: boolean
  saved?: SavedChartPayload
}

// React Navigation props for this screen
type ChartScreenProps = NativeStackScreenProps<ParamListBase, 'Chart'>

export default function ChartScreen({ route }: ChartScreenProps) {
  const { profile, fromSaved, saved } = route.params as RouteParams
  const savedMeta = saved?.meta || {}
  const { width } = useWindowDimensions()

  const [loading, setLoading] = useState<boolean>(!fromSaved || !saved?.planets)
  const [planets, setPlanets] = useState<PlanetPos[]>(saved?.planets ?? [])
  const [aspects, setAspects] = useState<Aspect[]>(saved?.aspects ?? [])
  const [houses, setHouses] = useState<HouseCusp[] | null>(saved?.houses ?? null)
  const [isSaved, setIsSaved] = useState<boolean>(!!fromSaved)

  // Guard: must have core birth info
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

    // --- CASE 1: Navigated from MyCharts with saved payload ---
    if (fromSaved && saved?.planets && saved?.aspects) {
      if (!alive) return

      let localHouses: HouseCusp[] | null =
        (saved.houses as HouseCusp[] | null) ?? null

      // If houses weren't saved but we have full birth details + location, recompute
      if (
        !localHouses &&
        profile.birth_date &&
        profile.birth_time &&
        profile.birth_lat != null &&
        profile.birth_lon != null
      ) {
        const { jsDate } = birthToUTC(profile.birth_date, profile.birth_time, tz)
        localHouses = computeWholeSignHouses(
          jsDate,
          profile.birth_lat,
          profile.birth_lon
        )
      }

      setPlanets(saved.planets)
      setAspects(saved.aspects)
      setHouses(localHouses)
      setIsSaved(true)
      setLoading(false)
      return
    }

    // --- CASE 2: Compute / load from Supabase based on profile details ---
    const loadChart = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          if (alive) setLoading(false)
          Alert.alert('Not signed in')
          return
        }

        // 1) Try to load saved chart from Supabase
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
          const cd = existing.chart_data

          const ps: PlanetPos[] = cd.planets ?? []
          const asps: Aspect[] = cd.aspects ?? []

          let localHouses: HouseCusp[] | null =
            (cd.houses as HouseCusp[] | null) ?? null

          // same fallback: if houses weren’t stored but we know location, compute them
          if (
            !localHouses &&
            profile.birth_date &&
            profile.birth_time &&
            profile.birth_lat != null &&
            profile.birth_lon != null
          ) {
            const { jsDate } = birthToUTC(
              profile.birth_date,
              profile.birth_time,
              tz
            )
            localHouses = computeWholeSignHouses(
              jsDate,
              profile.birth_lat,
              profile.birth_lon
            )
          }

          setPlanets(ps)
          setAspects(asps)
          setHouses(localHouses)
          setIsSaved(true)
        } else {
          // 2) No saved chart → compute and (optionally) auto-save once
          const { jsDate } = birthToUTC(
            profile.birth_date!,
            profile.birth_time!,
            tz
          )
          const ps = computeNatalPlanets(jsDate)
          const asps = findAspects(ps)

          let localHouses: HouseCusp[] | null = null
          if (profile.birth_lat != null && profile.birth_lon != null) {
            localHouses = computeWholeSignHouses(
              jsDate,
              profile.birth_lat,
              profile.birth_lon
            )
          }

          if (!alive) return
          setPlanets(ps)
          setAspects(asps)
          setHouses(localHouses)
          setIsSaved(false)

          // Auto-save first time so future loads are instant
          try {
            await saveChart(user.id, {
              name: `${profile.first_name ?? 'My'} Natal Chart`,
              birth_date: profile.birth_date!,
              birth_time: profile.birth_time!,
              time_zone: tz,
              birth_lat: profile.birth_lat ?? null,
              birth_lon: profile.birth_lon ?? null,
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
    return () => {
      alive = false
    }
  }, [
    fromSaved,
    saved,
    profile.birth_date,
    profile.birth_time,
    profile.birth_lat,
    profile.birth_lon,
    tz,
  ])

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

  // House ring slightly inside the sign ring
  const rHouseOuter = rInner - 2
  const rHouseInner = rInner - 22
  const rHouseLabel = rHouseInner - 10

  const toXY = (lonDeg: number, radius: number) => {
    const ang = (lonDeg * Math.PI) / 180
    const x = cx + Math.cos(-ang + Math.PI / 2) * radius
    const y = cy + Math.sin(-ang + Math.PI / 2) * radius
    return { x, y }
  }

  const aspectStroke: Record<Aspect['type'], number> = {
    conj: 2.0,
    opp: 1.8,
    trine: 1.6,
    square: 1.6,
    sextile: 1.2,
  }

  const onSavePress = async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This chart is already in your library.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Alert.alert('Not signed in')
    try {
      await saveChart(user.id, {
        name: `${profile.first_name ?? 'My'} Natal Chart`,
        birth_date: profile.birth_date!,
        birth_time: profile.birth_time!,
        time_zone: tz,
        birth_lat: profile.birth_lat ?? null,
        birth_lon: profile.birth_lon ?? null,
      })
      setIsSaved(true)
      Alert.alert('Saved', 'Chart saved to your library.')
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { flex: 1, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading chart…</Text>
      </View>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Derived: Sun & Moon meanings via lexicon
  // ─────────────────────────────────────────────────────────────

  const sun = planets.find(p => p.name === 'Sun')
  const moon = planets.find(p => p.name === 'Moon')

  const sunSignName = sun ? zodiacNameFromLongitude(sun.lon) : null
  const moonSignName = moon ? zodiacNameFromLongitude(moon.lon) : null

  const sunMeaning =
    sunSignName ? getPlanetSignMeaning('Sun', sunSignName) : null

  const moonMeaning =
    moonSignName ? getPlanetSignMeaning('Moon', moonSignName) : null

  // Subtitle: prefer saved meta if present
  const subtitleLocation =
    savedMeta.birth_location ?? (profile as any).birth_location ?? null
  const subtitleZone = savedMeta.time_zone ?? tz
  const subtitleCoords =
    savedMeta.birth_lat != null && savedMeta.birth_lon != null
      ? ` (${Number(savedMeta.birth_lat).toFixed(2)}, ${Number(
          savedMeta.birth_lon
        ).toFixed(2)})`
      : ''

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>
        {`Natal Chart${profile.first_name ? ` — ${profile.first_name}` : ''}`}
      </Text>

      {(subtitleLocation || subtitleZone) && (
        <Text style={styles.sub}>
          {subtitleLocation ? `${subtitleLocation}` : ''}
          {subtitleLocation && subtitleZone ? ' • ' : ''}
          {subtitleZone}
          {subtitleCoords}
        </Text>
      )}

      {/* Quick interpretation highlights */}
      {(sunMeaning || moonMeaning) && (
        <View style={styles.highlightCard}>
          {sunMeaning && sunSignName && (
            <View style={{ marginBottom: moonMeaning ? 8 : 0 }}>
              <Text style={styles.highlightTitle}>
                Sun in {sunSignName}
              </Text>
              <Text style={styles.highlightText}>{sunMeaning.short}</Text>
            </View>
          )}
          {moonMeaning && moonSignName && (
            <View>
              <Text style={styles.highlightTitle}>
                Moon in {moonSignName}
              </Text>
              <Text style={styles.highlightText}>{moonMeaning.short}</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Button
          title={isSaved ? 'Already Saved' : 'Save Chart Data'}
          onPress={onSavePress}
          disabled={isSaved || loading}
        />
      </View>

      <View style={{ alignItems: 'center' }}>
        <Svg
          width={size}
          height={size}
          viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
        >
          {/* Outer & inner rings */}
          <Circle
            cx={cx}
            cy={cy}
            r={rOuter}
            stroke="#ccc"
            strokeWidth={1}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={rInner}
            stroke="#eee"
            strokeWidth={1}
            fill="none"
          />

          {/* 12 sign dividers + labels */}
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = i * 30
            const { x: x1, y: y1 } = toXY(ang, rInner)
            const { x: x2, y: y2 } = toXY(ang, rOuter)
            const { x: lx, y: ly } = toXY(ang, rOuter + 12)
            return (
              <G key={`sign-${i}`}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth={1} />
                <SvgText x={lx} y={ly} fontSize={10} textAnchor="middle" dy={3}>
                  {ZODIAC[i]}
                </SvgText>
              </G>
            )
          })}

          {/* House cusps & numbers (Whole Sign) */}
          {houses &&
            houses.map((h) => {
              const { x: x1, y: y1 } = toXY(h.lon, rHouseInner)
              const { x: x2, y: y2 } = toXY(h.lon, rHouseOuter)

              const midLon = h.lon + 15
              const { x: lx, y: ly } = toXY(midLon, rHouseLabel)

              return (
                <G key={`house-${h.house}`}>
                  <Line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#444"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <SvgText
                    x={lx}
                    y={ly}
                    fontSize={9}
                    textAnchor="middle"
                    dy={3}
                  >
                    {h.house}
                  </SvgText>
                </G>
              )
            })}

          {/* Aspect lines */}
          {aspects.map((a, idx) => {
            const A = planets.find((p) => p.name === a.a)
            const B = planets.find((p) => p.name === a.b)
            if (!A || !B) return null
            const { x: x1, y: y1 } = toXY(A.lon, rAspect)
            const { x: x2, y: y2 } = toXY(B.lon, rAspect)
            return (
              <Line
                key={`${a.a}-${a.b}-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#777"
                strokeWidth={aspectStroke[a.type]}
                opacity={0.85}
                strokeDasharray={
                  a.type === 'sextile'
                    ? '4 4'
                    : a.type === 'trine'
                    ? '8 6'
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
                <SvgText
                  x={x}
                  y={y}
                  fontSize={9}
                  fill="#fff"
                  textAnchor="middle"
                  dy={3}
                >
                  {glyph}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>

      {/* Planet positions */}
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

      {/* House listing: Whole Sign, no degrees */}
      <View style={{ height: 16 }} />
      <Text style={styles.h2}>Houses (Whole Sign)</Text>
      {!houses ? (
        <Text style={styles.muted}>
          Houses require a birth location. Add or update your birth place to view house cusps.
        </Text>
      ) : (
        houses.map((h) => {
          const signIndex = Math.floor(h.lon / 30) % 12
          const label = `House ${String(h.house).padStart(2, ' ')}`
          // We’re not showing house meanings yet, but this is ready when you want:
          // const houseMeaning = getHouseMeaning(h.house as any)
          return (
            <Text key={`house-row-${h.house}`} style={styles.row}>
              {`${label}  ${ZODIAC[signIndex]}`}
            </Text>
          )
        })
      )}

      <View style={{ height: 16 }} />
      <ChartCompass style={{ marginBottom: 12 }} />

      {/* Aspects listing */}
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

  // New styles for Sun/Moon highlight card
  highlightCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  highlightTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
})
