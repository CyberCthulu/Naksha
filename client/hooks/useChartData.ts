//hooks/useChartData.ts
import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'

import {
  computeWholeSignHouses,
  assignPlanetsToWholeSignHouses,
  type PlanetPos,
  type Aspect,
  type HouseCusp,
  type PlanetHousePlacement,
} from '../lib/astro'
import { birthToUTC } from '../lib/time'
import { normalizeZone } from '../lib/timezones'
import supabase from '../lib/supabase'
import { buildChartData, saveChart, type ChartData } from '../lib/charts'
import type { ChartProfile } from '../lib/domainTypes'

type UseChartDataArgs = {
  profile: ChartProfile
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
  saveCurrentChart: () => Promise<void>
}

export default function useChartData({
  profile,
  fromSaved,
  saved,
  tz,
}: UseChartDataArgs): UseChartDataResult {
  const [loading, setLoading] = useState<boolean>(!fromSaved || !saved?.planets)
  const [planets, setPlanets] = useState<PlanetPos[]>(saved?.planets ?? [])
  const [aspects, setAspects] = useState<Aspect[]>(saved?.aspects ?? [])
  const [houses, setHouses] = useState<HouseCusp[] | null>(saved?.houses ?? null)
  const [planetHouses, setPlanetHouses] = useState<PlanetHousePlacement[] | null>(
    saved?.planet_houses ?? null
  )
  const [isSaved, setIsSaved] = useState<boolean>(!!fromSaved)

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
      setPlanets(nextPlanets)
      setAspects(nextAspects)
      setHouses(nextHouses)
      setPlanetHouses(nextPlanetHouses)
      setIsSaved(nextIsSaved)
    },
    []
  )

  const hydrateSavedChart = useCallback(
    (
      basePlanets: PlanetPos[],
      baseAspects: Aspect[],
      baseHouses: HouseCusp[] | null,
      basePlanetHouses: PlanetHousePlacement[] | null
    ) => {
      let localHouses = baseHouses
      if (!localHouses && birthLat != null && birthLon != null) {
        const { jsDate } = birthToUTC(birthDate, birthTime, tz)
        localHouses = computeWholeSignHouses(jsDate, birthLat, birthLon)
      }

      const localPlanetHouses =
        basePlanetHouses ??
        (localHouses
          ? assignPlanetsToWholeSignHouses(basePlanets, localHouses)
          : null)

      return {
        houses: localHouses,
        planetHouses: localPlanetHouses,
        planets: basePlanets,
        aspects: baseAspects,
      }
    },
    [birthDate, birthTime, tz, birthLat, birthLon]
  )

  const loadChart = useCallback(async () => {
    setLoading(true)

    try {
      if (fromSaved && saved?.planets && saved?.aspects) {
        const hydrated = hydrateSavedChart(
          saved.planets,
          saved.aspects,
          saved.houses ?? null,
          saved.planet_houses ?? null
        )

        applyChartState(
          hydrated.planets,
          hydrated.aspects,
          hydrated.houses,
          hydrated.planetHouses,
          true
        )
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert('Not signed in')
        return
      }

      // Null coordinates do not form a stable Postgres unique identity, so render only.
      if (!canSaveChart) {
        const payload = buildChartData({
          name: chartName,
          birth_date: birthDate,
          birth_time: birthTime,
          time_zone: tz,
          birth_lat: null,
          birth_lon: null,
        })

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
      if (error) throw error

      if (existing) {
        const cd = existing.chart_data as ChartData
        const hydrated = hydrateSavedChart(
          cd.planets ?? [],
          cd.aspects ?? [],
          cd.houses ?? null,
          cd.planet_houses ?? null
        )

        applyChartState(
          hydrated.planets,
          hydrated.aspects,
          hydrated.houses,
          hydrated.planetHouses,
          true
        )
        return
      }

      const payload = buildChartData({
        name: chartName,
        birth_date: birthDate,
        birth_time: birthTime,
        time_zone: tz,
        birth_lat: birthLat,
        birth_lon: birthLon,
      })

      applyChartState(
        payload.planets,
        payload.aspects,
        payload.houses,
        payload.planet_houses,
        false
      )

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
        setIsSaved(true)
      } catch (e) {
        console.warn('Auto-save failed:', e)
      }
    } catch (e: any) {
      Alert.alert('Error loading chart', e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [
    fromSaved,
    saved,
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
    loadChart()
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      Alert.alert('Not signed in')
      return
    }

    try {
      const payload = buildChartData({
        name: chartName,
        birth_date: birthDate,
        birth_time: birthTime,
        time_zone: tz,
        birth_lat: birthLat,
        birth_lon: birthLon,
      })

      await saveChart(user.id, {
        name: payload.meta.name,
        birth_date: payload.meta.birth_date,
        birth_time: payload.meta.birth_time,
        time_zone: payload.meta.time_zone,
        birth_lat: payload.meta.birth_lat,
        birth_lon: payload.meta.birth_lon,
        chart_data: payload,
      })

      applyChartState(
        payload.planets,
        payload.aspects,
        payload.houses,
        payload.planet_houses,
        true
      )

      Alert.alert('Saved', 'Chart saved to your library.')
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
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
    saveCurrentChart,
  }
}
