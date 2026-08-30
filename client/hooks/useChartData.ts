//hooks/useChartData.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'

import {
  type PlanetPos,
  type Aspect,
  type HouseCusp,
  type PlanetHousePlacement,
} from '../lib/astro'
import { hydrateChartData } from '../lib/chartHydration'
import supabase from '../lib/supabase'
import {
  buildChartData,
  getChartCalculationPreferences,
  saveChart,
  type ChartData,
} from '../lib/charts'
import {
  UNSUPPORTED_CHART_DATA_MESSAGE,
  validateChartData,
} from '../lib/chartDataValidation'
import type { ChartMode, ChartProfile } from '../lib/domainTypes'

type UseChartDataArgs = {
  profile: ChartProfile
  chartMode?: ChartMode
  fromSaved?: boolean
  saved?: ChartData
  tz: string
}

type UseChartDataResult = {
  loading: boolean
  planets: PlanetPos[]
  aspects: Aspect[]
  houses: HouseCusp[] | null
  planetHouses: PlanetHousePlacement[] | null
  isSaved: boolean
  canSaveChart: boolean
  saveWarning: string | null
  saveCurrentChart: () => Promise<void>
}

export default function useChartData({
  profile,
  chartMode = 'self',
  fromSaved,
  saved,
  tz,
}: UseChartDataArgs): UseChartDataResult {
  const initialSavedValidation = fromSaved
    ? validateChartData(saved)
    : null
  const initialSaved =
    initialSavedValidation?.status === 'valid'
      ? initialSavedValidation.data
      : null
  const mountedRef = useRef(true)
  const loadIdRef = useRef(0)
  const saveIdRef = useRef(0)

  const [loading, setLoading] = useState<boolean>(!initialSaved)
  const [planets, setPlanets] = useState<PlanetPos[]>(
    initialSaved?.planets ?? []
  )
  const [aspects, setAspects] = useState<Aspect[]>(
    initialSaved?.aspects ?? []
  )
  const [houses, setHouses] = useState<HouseCusp[] | null>(
    initialSaved?.houses ?? null
  )
  const [planetHouses, setPlanetHouses] = useState<PlanetHousePlacement[] | null>(
    initialSaved?.planet_houses ?? null
  )
  const [isSaved, setIsSaved] = useState<boolean>(!!initialSaved)
  const [saveWarning, setSaveWarning] = useState<string | null>(null)

  const birthDate = profile.birth_date!
  const birthTime = profile.birth_time!
  const chartName = `${profile.first_name ?? 'My'} Natal Chart`
  const birthLat = profile.birth_lat ?? null
  const birthLon = profile.birth_lon ?? null
  const canSaveChart = birthLat != null && birthLon != null

  const applyChartState = useCallback(
    (
      nextPlanets: PlanetPos[],
      nextAspects: Aspect[],
      nextHouses: HouseCusp[] | null,
      nextPlanetHouses: PlanetHousePlacement[] | null,
      nextIsSaved: boolean
    ) => {
      if (!mountedRef.current) return

      setPlanets(nextPlanets)
      setAspects(nextAspects)
      setHouses(nextHouses)
      setPlanetHouses(nextPlanetHouses)
      setIsSaved(nextIsSaved)
    },
    []
  )

  const hydrateSavedChart = useCallback(
    (chartData: ChartData) =>
      hydrateChartData({
        chartData,
        birthDate,
        birthTime,
        timeZone: tz,
        birthLat,
        birthLon,
      }),
    [birthDate, birthTime, tz, birthLat, birthLon]
  )

  const loadChart = useCallback(async () => {
    const loadId = loadIdRef.current + 1
    loadIdRef.current = loadId
    const isCurrentLoad = () =>
      mountedRef.current && loadIdRef.current === loadId

    setLoading(true)
    setSaveWarning(null)

    try {
      const savedValidation = fromSaved
        ? validateChartData(saved)
        : null

      if (savedValidation?.status === 'unsupported') {
        throw new Error(UNSUPPORTED_CHART_DATA_MESSAGE)
      }

      const parsedSaved =
        savedValidation?.status === 'valid' ? savedValidation.data : null

      if (!isCurrentLoad()) return

      if (parsedSaved) {
        const hydrated = hydrateSavedChart(parsedSaved)

        applyChartState(
          hydrated.planets,
          hydrated.aspects,
          hydrated.houses,
          hydrated.planet_houses,
          true
        )
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isCurrentLoad()) return

      if (!user) {
        Alert.alert('Not signed in')
        return
      }

      const calculationPreferences = await getChartCalculationPreferences(
        user.id
      )

      if (!isCurrentLoad()) return

      // Null coordinates do not form a stable Postgres unique identity, so render only.
      if (!canSaveChart) {
        const payload = buildChartData(
          {
            name: chartName,
            birth_date: birthDate,
            birth_time: birthTime,
            time_zone: tz,
            birth_lat: null,
            birth_lon: null,
          },
          calculationPreferences
        )

        applyChartState(
          payload.planets,
          payload.aspects,
          payload.houses,
          payload.planet_houses,
          false
        )
        return
      }

      let existingQuery = supabase
        .from('charts')
        .select('id, chart_data')
        .eq('user_id', user.id)
        .eq('birth_date', birthDate)
        .eq('birth_time', birthTime)
        .eq('time_zone', tz)
        .eq('birth_lat', birthLat)
        .eq('birth_lon', birthLon)

      const { data: existing, error } = await existingQuery.maybeSingle()

      if (!isCurrentLoad()) return

      if (error) throw error

      const existingValidation = existing
        ? validateChartData(existing.chart_data)
        : null

      if (existingValidation?.status === 'unsupported') {
        throw new Error(UNSUPPORTED_CHART_DATA_MESSAGE)
      }

      const cd =
        existingValidation?.status === 'valid'
          ? existingValidation.data
          : null
      if (cd) {
        const hydrated = hydrateSavedChart(cd)

        applyChartState(
          hydrated.planets,
          hydrated.aspects,
          hydrated.houses,
          hydrated.planet_houses,
          true
        )
        return
      }

      const payload = buildChartData(
        {
          name: chartName,
          birth_date: birthDate,
          birth_time: birthTime,
          time_zone: tz,
          birth_lat: birthLat,
          birth_lon: birthLon,
        },
        calculationPreferences
      )

      applyChartState(
        payload.planets,
        payload.aspects,
        payload.houses,
        payload.planet_houses,
        false
      )

      if (chartMode === 'self') {
        try {
          await saveChart(user.id, {
            name: payload.meta.name,
            birth_date: payload.meta.birth_date,
            birth_time: payload.meta.birth_time,
            time_zone: payload.meta.time_zone,
            birth_lat: payload.meta.birth_lat,
            birth_lon: payload.meta.birth_lon,
            chart_data: payload,
          })

          if (!isCurrentLoad()) return

          setIsSaved(true)
          setSaveWarning(null)
        } catch (e) {
          if (!isCurrentLoad()) return

          console.warn('Auto-save failed:', e)
          setIsSaved(false)
          setSaveWarning(
            'This chart is ready to view, but it was not saved automatically. Tap Save Chart Data to try again.'
          )
        }
      }
    } catch (e: any) {
      if (isCurrentLoad()) {
        Alert.alert('Error loading chart', e?.message ?? 'Unknown error')
      }
    } finally {
      if (isCurrentLoad()) {
        setLoading(false)
      }
    }
  }, [
    fromSaved,
    saved,
    chartMode,
    birthDate,
    birthTime,
    tz,
    birthLat,
    birthLon,
    chartName,
    canSaveChart,
    hydrateSavedChart,
    applyChartState,
  ])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      loadIdRef.current += 1
      saveIdRef.current += 1
    }
  }, [])

  useEffect(() => {
    loadChart()

    return () => {
      loadIdRef.current += 1
    }
  }, [loadChart])

  const saveCurrentChart = useCallback(async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This chart is already in your library.')
      return
    }

    if (!canSaveChart) {
      Alert.alert(
        'Birth location needed',
        'Add a birth location to save houses and chart data.'
      )
      return
    }

    const saveId = saveIdRef.current + 1
    saveIdRef.current = saveId
    const isCurrentSave = () =>
      mountedRef.current && saveIdRef.current === saveId

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!isCurrentSave()) return

    if (!user) {
      Alert.alert('Not signed in')
      return
    }

    try {
      const calculationPreferences = await getChartCalculationPreferences(
        user.id
      )

      if (!isCurrentSave()) return

      const payload = buildChartData(
        {
          name: chartName,
          birth_date: birthDate,
          birth_time: birthTime,
          time_zone: tz,
          birth_lat: birthLat,
          birth_lon: birthLon,
        },
        calculationPreferences
      )

      await saveChart(user.id, {
        name: payload.meta.name,
        birth_date: payload.meta.birth_date,
        birth_time: payload.meta.birth_time,
        time_zone: payload.meta.time_zone,
        birth_lat: payload.meta.birth_lat,
        birth_lon: payload.meta.birth_lon,
        chart_data: payload,
      })

      if (!isCurrentSave()) return

      applyChartState(
        payload.planets,
        payload.aspects,
        payload.houses,
        payload.planet_houses,
        true
      )
      setSaveWarning(null)

      Alert.alert('Saved', 'Chart saved to your library.')
    } catch (e: any) {
      if (isCurrentSave()) {
        Alert.alert('Save failed', e?.message ?? 'Unknown error')
      }
    }
  }, [
    isSaved,
    chartName,
    birthDate,
    birthTime,
    tz,
    birthLat,
    birthLon,
    canSaveChart,
    applyChartState,
  ])

  return {
    loading,
    planets,
    aspects,
    houses,
    planetHouses,
    isSaved,
    canSaveChart,
    saveWarning,
    saveCurrentChart,
  }
}
