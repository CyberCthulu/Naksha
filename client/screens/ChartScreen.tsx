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
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ParamListBase } from '@react-navigation/native'

import { useSpace } from '../components/space/SpaceProvider'
import { birthToUTC } from '../lib/time'
import { computeWholeSignHouses, PlanetPos, Aspect, HouseCusp } from '../lib/astro'
import { normalizeZone } from '../lib/timezones'
import supabase from '../lib/supabase'
import { saveChart, buildChartData } from '../lib/charts'

// chart components
import ChartHeader from '../components/charts/ChartHeader'
import ChartWheel from '../components/charts/ChartWheel'
import PlanetPositionsList from '../components/charts/PlanetPositionsList'
import HousesList from '../components/charts/HousesList'
import AspectsList from '../components/charts/AspectsList'
import ChartCompass from '../components/charts/ChartCompass'

// lexicon
import {
  zodiacNameFromLongitude,
  getPlanetSignMeaning,
  type PlanetKey,
} from '../lib/lexicon'

// shared UI
import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

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

export default function ChartScreen({ route }: ChartScreenProps) {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

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

  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Missing birth date, time, or time zone. Please complete your profile.
        </Text>
      </View>
    )
  }

  const tz = normalizeZone(profile.time_zone)
  if (!tz) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Your saved time zone isn’t valid. Update it in “Complete Profile”.
        </Text>
        <Text style={uiStyles.muted}>Current: {String(profile.time_zone)}</Text>
      </View>
    )
  }

  const chartName = `${profile.first_name ?? 'My'} Natal Chart`
  const birthLat = profile.birth_lat ?? null
  const birthLon = profile.birth_lon ?? null

  const loadChart = useCallback(async () => {
    setLoading(true)
    try {
      if (fromSaved && saved?.planets && saved?.aspects) {
        let localHouses: HouseCusp[] | null = (saved.houses as HouseCusp[] | null) ?? null

        if (!localHouses && birthLat != null && birthLon != null) {
          const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
          localHouses = computeWholeSignHouses(jsDate, birthLat, birthLon)
        }

        setPlanets(saved.planets)
        setAspects(saved.aspects)
        setHouses(localHouses)
        setIsSaved(true)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert('Not signed in')
        return
      }

      let existingQuery = supabase
        .from('charts')
        .select('id, chart_data')
        .eq('user_id', user.id)
        .eq('birth_date', profile.birth_date!)
        .eq('birth_time', profile.birth_time!)
        .eq('time_zone', tz)

      if (birthLat == null) {
        existingQuery = existingQuery.is('birth_lat', null)
      } else {
        existingQuery = existingQuery.eq('birth_lat', birthLat)
      }

      if (birthLon == null) {
        existingQuery = existingQuery.is('birth_lon', null)
      } else {
        existingQuery = existingQuery.eq('birth_lon', birthLon)
      }

      const { data: existing, error } = await existingQuery.maybeSingle()

      if (error) throw error

      if (existing) {
        const cd = existing.chart_data || {}
        const ps: PlanetPos[] = cd.planets ?? []
        const asps: Aspect[] = cd.aspects ?? []

        let localHouses: HouseCusp[] | null = (cd.houses as HouseCusp[] | null) ?? null

        if (!localHouses && birthLat != null && birthLon != null) {
          const { jsDate } = birthToUTC(profile.birth_date!, profile.birth_time!, tz)
          localHouses = computeWholeSignHouses(jsDate, birthLat, birthLon)
        }

        setPlanets(ps)
        setAspects(asps)
        setHouses(localHouses)
        setIsSaved(true)
      } else {
        const payload = buildChartData({
          name: chartName,
          birth_date: profile.birth_date!,
          birth_time: profile.birth_time!,
          time_zone: tz,
          birth_lat: birthLat,
          birth_lon: birthLon,
        })

        setPlanets(payload.planets)
        setAspects(payload.aspects)
        setHouses(payload.houses)
        setIsSaved(false)

        try {
          await saveChart(user.id, {
            name: chartName,
            birth_date: profile.birth_date!,
            birth_time: profile.birth_time!,
            time_zone: tz,
            birth_lat: birthLat,
            birth_lon: birthLon,
            chart_data: payload,
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
    tz,
    chartName,
    birthLat,
    birthLon,
  ])

  useEffect(() => {
    loadChart()
  }, [loadChart])

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

  const maxChart = 360
  const size = Math.min(Math.max(280, width - 32), maxChart)

  const onSavePress = async () => {
    if (isSaved) {
      return Alert.alert('Already Saved', 'This chart is already in your library.')
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Alert.alert('Not signed in')
    }

    try {
      const payload = buildChartData({
        name: chartName,
        birth_date: profile.birth_date!,
        birth_time: profile.birth_time!,
        time_zone: tz,
        birth_lat: birthLat,
        birth_lon: birthLon,
      })

      await saveChart(user.id, {
        name: chartName,
        birth_date: profile.birth_date!,
        birth_time: profile.birth_time!,
        time_zone: tz,
        birth_lat: birthLat,
        birth_lon: birthLon,
        chart_data: payload,
      })

      setPlanets(payload.planets)
      setAspects(payload.aspects)
      setHouses(payload.houses)
      setIsSaved(true)

      Alert.alert('Saved', 'Chart saved to your library.')
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    }
  }

  const subtitleLocation = savedMeta.birth_location ?? profile.birth_location ?? null
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
      <ChartHeader
        onBack={() => navigation.goBack()}
        title="Natal Chart"
        subtitleLocation={subtitleLocation}
        subtitleZone={subtitleZone}
        subtitleCoords={subtitleCoords}
        sunTitle={sunSummary ? `Sun in ${sunSummary.signName}` : null}
        sunShortMeaning={sunSummary?.meaning?.short ?? null}
      />

      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <Button
          title={isSaved ? 'Already Saved' : 'Save Chart Data'}
          onPress={onSavePress}
          disabled={isSaved}
        />
      </View>

      <View style={{ alignItems: 'center' }}>
        <ChartWheel
          size={size}
          planets={planets}
          aspects={aspects}
          houses={houses}
        />
      </View>

      <PlanetPositionsList
        planets={planets}
        focusedPlanet={focusedPlanet}
        onFocusPlanet={focusPlanet}
      />

      <View style={{ height: 16 }} />

      <HousesList houses={houses} />

      <View style={{ height: 16 }} />

      <ChartCompass style={{ marginBottom: 12 }} />

      <AspectsList aspects={aspects} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({})