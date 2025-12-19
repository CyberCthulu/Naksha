// screens/ChartScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Alert,
  Button,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ParamListBase } from '@react-navigation/native'

import { useSpace } from '../components/space/SpaceProvider'
import { birthToUTC } from '../lib/time'
import {
  computeNatalPlanets,
  findAspects,
  computeWholeSignHouses,
  PlanetPos,
  Aspect,
  HouseCusp,
} from '../lib/astro'
import { normalizeZone } from '../lib/timezones'
import ChartCompass from '../components/ChartCompass'
import supabase from '../lib/supabase'
import { saveChart } from '../lib/charts'

// lexicon
import {
  zodiacNameFromLongitude,
  signIndexFromLongitude,
  getPlanetSignMeaning,
  getHouseMeaning,
  getAspectMeaning,
  type PlanetKey,
  type HouseNumber,
  type AspectType,
} from '../lib/lexicon'

// shared UI
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

const ZODIAC_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']
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

type ChartScreenProps = NativeStackScreenProps<ParamListBase, 'Chart'>

function asPlanetKey(name: string): PlanetKey | null {
  const allowed: PlanetKey[] = [
    'Sun',
    'Moon',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ]
  return (allowed as string[]).includes(name) ? (name as PlanetKey) : null
}

function asHouseNumber(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
}

function asAspectType(t: string): AspectType | null {
  const allowed: AspectType[] = ['conj', 'opp', 'square', 'trine', 'sextile']
  return (allowed as string[]).includes(t) ? (t as AspectType) : null
}

export default function ChartScreen({ route }: ChartScreenProps) {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  // ✅ prevent “double header” clash like ProfileScreen does
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  const { profile, fromSaved, saved } = route.params as RouteParams
  const savedMeta = saved?.meta || {}

  const { focusedPlanet, focusPlanet, clearFocus } = useSpace()

  const [loading, setLoading] = useState<boolean>(!fromSaved || !saved?.planets)
  const [planets, setPlanets] = useState<PlanetPos[]>(saved?.planets ?? [])
  const [aspects, setAspects] = useState<Aspect[]>(saved?.aspects ?? [])
  const [houses, setHouses] = useState<HouseCusp[] | null>(saved?.houses ?? null)
  const [isSaved, setIsSaved] = useState<boolean>(!!fromSaved)

  // Guard
  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>Missing birth date, time, or time zone. Please complete your profile.</Text>
      </View>
    )
  }

  const tz = normalizeZone(profile.time_zone)
  if (!tz) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>Your saved time zone isn’t valid. Update it in “Complete Profile”.</Text>
        <Text style={uiStyles.muted}>Current: {String(profile.time_zone)}</Text>
      </View>
    )
  }

  const loadChart = useCallback(async () => {
    setLoading(true)
    try {
      // --- CASE 1: coming from MyCharts with saved payload ---
      if (fromSaved && saved?.planets && saved?.aspects) {
        let localHouses: HouseCusp[] | null = (saved.houses as HouseCusp[] | null) ?? null

        if (
          !localHouses &&
          profile.birth_lat != null &&
          profile.birth_lon != null
        ) {
          const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
          localHouses = computeWholeSignHouses(jsDate, profile.birth_lat, profile.birth_lon)
        }

        setPlanets(saved.planets)
        setAspects(saved.aspects)
        setHouses(localHouses)
        setIsSaved(true)
        return
      }

      // --- CASE 2: load from Supabase or compute ---
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Not signed in')
        return
      }

      const { data: existing, error } = await supabase
        .from('charts')
        .select('chart_data')
        .eq('user_id', user.id)
        .eq('birth_date', profile.birth_date!)
        .eq('birth_time', profile.birth_time!)
        .eq('time_zone', tz)
        .maybeSingle()

      if (error) throw error

      if (existing?.chart_data) {
        const cd = existing.chart_data
        const ps: PlanetPos[] = cd.planets ?? []
        const asps: Aspect[] = cd.aspects ?? []

        let localHouses: HouseCusp[] | null = (cd.houses as HouseCusp[] | null) ?? null
        if (
          !localHouses &&
          profile.birth_lat != null &&
          profile.birth_lon != null
        ) {
          const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
          localHouses = computeWholeSignHouses(jsDate, profile.birth_lat, profile.birth_lon)
        }

        setPlanets(ps)
        setAspects(asps)
        setHouses(localHouses)
        setIsSaved(true)
      } else {
        const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
        const ps = computeNatalPlanets(jsDate)
        const asps = findAspects(ps)

        let localHouses: HouseCusp[] | null = null
        if (profile.birth_lat != null && profile.birth_lon != null) {
          localHouses = computeWholeSignHouses(jsDate, profile.birth_lat, profile.birth_lon)
        }

        setPlanets(ps)
        setAspects(asps)
        setHouses(localHouses)
        setIsSaved(false)

        // auto-save best-effort
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
        } catch (e) {
          console.warn('Auto-save failed:', e)
        }
      }
    } catch (e: any) {
      Alert.alert('Error loading chart', e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [
    fromSaved,
    saved,
    profile.birth_date,
    profile.birth_time,
    profile.birth_lat,
    profile.birth_lon,
    profile.first_name,
    tz,
  ])

  useEffect(() => {
    loadChart()
  }, [loadChart])

  // Default background focus: Sun if possible
  useEffect(() => {
    if (!planets.length) return
    const sun = planets.find((p) => p.name === 'Sun')
    const fallback = planets[0]
    const pk = asPlanetKey(sun?.name ?? fallback?.name ?? '')
    if (pk && !focusedPlanet) focusPlanet(pk)

    return () => {
      clearFocus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, focusPlanet, clearFocus])

  // Sizing + geometry
  const maxChart = 360
  const pad = 16
  const size = Math.min(Math.max(280, width - 32), maxChart)
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 26
  const rPlanets = (rOuter + rInner) / 2
  const rAspect = rInner - 6

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
    if (isSaved) return Alert.alert('Already Saved', 'This chart is already in your library.')
    const { data: { user } } = await supabase.auth.getUser()
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

  const subtitleLocation = savedMeta.birth_location ?? (profile as any).birth_location ?? null
  const subtitleZone = savedMeta.time_zone ?? tz
  const subtitleCoords =
    savedMeta.birth_lat != null && savedMeta.birth_lon != null
      ? ` (${Number(savedMeta.birth_lat).toFixed(2)}, ${Number(savedMeta.birth_lon).toFixed(2)})`
      : ''

  const sunSummary = useMemo(() => {
    const sun = planets.find((p) => p.name === 'Sun')
    if (!sun) return null
    const signName = zodiacNameFromLongitude(sun.lon)
    const meaning = getPlanetSignMeaning('Sun', signName)
    return { signName, meaning }
  }, [planets])

  if (loading) {
    return (
      <View style={uiStyles.center}>
        <ActivityIndicator size="large" />
        <Text style={[uiStyles.text, { marginTop: 8 }]}>Loading chart…</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: theme.spacing.screen,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 28,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top bar (match ProfileScreen) */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Natal Chart</Text>

        <View style={styles.rightSlot} />
      </View>

      {(subtitleLocation || subtitleZone) && (
        <Text style={styles.subtitle}>
          {subtitleLocation ? `${subtitleLocation}` : ''}
          {subtitleLocation && subtitleZone ? ' · ' : ''}
          {subtitleZone}
          {subtitleCoords}
        </Text>
      )}

      {!!sunSummary?.meaning?.short && (
        <View style={[uiStyles.card, { alignItems: 'center' }]}>
          <Text style={[uiStyles.cardTitle, { textAlign: 'center' }]}>
            {`Sun in ${sunSummary.signName}`}
          </Text>
          <Text style={[uiStyles.text, { opacity: 0.9, textAlign: 'center' }]}>
            {sunSummary.meaning.short}
          </Text>
        </View>
      )}

      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <Button
          title={isSaved ? 'Already Saved' : 'Save Chart Data'}
          onPress={onSavePress}
          disabled={isSaved}
        />
      </View>

      {/* Wheel */}
      <View style={{ alignItems: 'center' }}>
        <Svg
          width={size}
          height={size}
          viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
        >
          <Circle cx={cx} cy={cy} r={rOuter} stroke={theme.colors.border} strokeWidth={1} fill="none" />
          <Circle cx={cx} cy={cy} r={rInner} stroke="rgba(255,255,255,0.25)" strokeWidth={1} fill="none" />

          {/* Sign divisions + labels */}
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = i * 30
            const { x: x1, y: y1 } = toXY(ang, rInner)
            const { x: x2, y: y2 } = toXY(ang, rOuter)
            const { x: lx, y: ly } = toXY(ang, rOuter + 12)
            return (
              <G key={`sign-${i}`}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
                <SvgText x={lx} y={ly} fontSize={10} textAnchor="middle" dy={3} fill={theme.colors.text}>
                  {ZODIAC_ABBR[i]}
                </SvgText>
              </G>
            )
          })}

          {/* Houses (Whole Sign) */}
          {houses?.map((h) => {
            const { x: x1, y: y1 } = toXY(h.lon, rHouseInner)
            const { x: x2, y: y2 } = toXY(h.lon, rHouseOuter)
            const midLon = h.lon + 15
            const { x: lx, y: ly } = toXY(midLon, rHouseLabel)

            return (
              <G key={`house-${h.house}`}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
                <SvgText x={lx} y={ly} fontSize={9} textAnchor="middle" dy={3} fill={theme.colors.text}>
                  {h.house}
                </SvgText>
              </G>
            )
          })}

          {/* Aspects */}
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
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={aspectStroke[a.type]}
                opacity={0.85}
                strokeDasharray={
                  a.type === 'sextile' ? '4 4' : a.type === 'trine' ? '8 6' : undefined
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
                <Circle
                  cx={x}
                  cy={y}
                  r={9}
                  fill="rgba(0,0,0,0.55)"
                  stroke={theme.colors.border}
                  strokeWidth={1}
                />
                <SvgText x={x} y={y} fontSize={9} fill={theme.colors.text} textAnchor="middle" dy={3}>
                  {glyph}
                </SvgText>
              </G>
            )
          })}
        </Svg>
      </View>

      <Text style={styles.h2}>Positions</Text>
      {planets.map((p) => {
        const signIdx = signIndexFromLongitude(p.lon)
        const degFloat = degInSign(p.lon)
        const deg = Math.floor(degFloat)
        const min = Math.round((degFloat - deg) * 60)
        const mm = String(min).padStart(2, '0')

        const pk = asPlanetKey(p.name)
        const signName = zodiacNameFromLongitude(p.lon)
        const meaning = pk ? getPlanetSignMeaning(pk, signName) : null
        const isActive = pk != null && focusedPlanet === pk

        return (
          <Pressable
            key={p.name}
            disabled={!pk}
            onPress={() => pk && focusPlanet(pk)}
            style={[styles.itemRow, pk && styles.pressableRow, isActive && styles.activeRow]}
          >
            <Text style={styles.itemLeft}>
              {`${p.name.padEnd(7)} ${ZODIAC_ABBR[signIdx]} ${deg}°${mm}′`}
            </Text>
            <Text style={styles.itemRight} numberOfLines={3}>
              {meaning?.short ?? ''}
            </Text>
          </Pressable>
        )
      })}

      <View style={{ height: 16 }} />

      <Text style={styles.h2}>Houses (Whole Sign)</Text>
      {!houses ? (
        <Text style={uiStyles.muted}>
          Houses require a birth location. Add or update your birth place to view house cusps.
        </Text>
      ) : (
        houses.map((h) => {
          const signIdx = signIndexFromLongitude(h.lon)
          const hn = asHouseNumber(h.house)
          const meaning = hn ? getHouseMeaning(hn) : null

          return (
            <View key={`house-row-${h.house}`} style={styles.itemRow}>
              <Text style={styles.itemLeft}>{`House ${String(h.house).padStart(2, ' ')}  ${ZODIAC_ABBR[signIdx]}`}</Text>
              <Text style={styles.itemRight} numberOfLines={3}>
                {meaning?.short ?? ''}
              </Text>
            </View>
          )
        })
      )}

      <View style={{ height: 16 }} />
      <ChartCompass style={{ marginBottom: 12 }} />

      <Text style={styles.h2}>Aspects</Text>
      {aspects.length === 0 ? (
        <Text style={uiStyles.muted}>None (within default orbs)</Text>
      ) : (
        aspects
          .slice()
          .sort((a, b) => a.orb - b.orb)
          .map((a, i) => {
            const at = asAspectType(a.type)
            const meaning = at ? getAspectMeaning(at) : null
            return (
              <View key={`${a.a}-${a.b}-${i}`} style={styles.itemRow}>
                <Text style={styles.itemLeft}>{`${a.a} ${a.type} ${a.b} (${a.orb.toFixed(2)}°)`}</Text>
                <Text style={styles.itemRight} numberOfLines={3}>
                  {meaning?.short ?? ''}
                </Text>
              </View>
            )
          })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // in-screen header like ProfileScreen
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  rightSlot: { width: 44 }, // balances title centering

  subtitle: {
    color: theme.colors.sub,
    textAlign: 'center',
    marginBottom: 10,
  },

  h2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pressableRow: { borderRadius: 8, paddingVertical: 4 },
  activeRow: { backgroundColor: 'rgba(255,255,255,0.06)' },

  itemLeft: {
    width: 150,
    fontFamily: 'monospace' as any,
    color: theme.colors.text,
  },
  itemRight: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.sub,
    paddingLeft: 10,
    lineHeight: 16,
  },
})
