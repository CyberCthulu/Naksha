//lib/charts.ts
import supabase from './supabase'
import {
  computeNatalPlanets,
  findAspects,
  computeWholeSignHouses,
  assignPlanetsToWholeSignHouses,
  PlanetPos,
  Aspect,
  HouseCusp,
  PlanetHousePlacement,
} from './astro'

import { birthToUTC } from './time'
import { normalizeZone } from './timezones'
import {
  DEFAULT_CHART_CALCULATION_PREFERENCES,
  parseChartCalculationPreferences,
  resolveChartCalculationPreferences,
  type ChartCalculationPreferences,
  type ChartPreferencesRow,
} from './domainTypes'

export type ChartMeta = {
  name: string
  birth_date: string
  birth_time: string
  time_zone: string
  birth_lat: number | null
  birth_lon: number | null
  computed_at: string
  instant_utc: string | null
}

export type ChartData = {
  meta: ChartMeta
  planets: PlanetPos[]
  aspects: Aspect[]
  houses: HouseCusp[] | null
  planet_houses: PlanetHousePlacement[] | null
}

export type ChartRow = {
  id: number
  user_id: string
  name: string
  birth_date: string | null
  birth_time: string | null
  time_zone: string | null
  birth_lat: number | null
  birth_lon: number | null
  chart_data: ChartData
  created_at: string | null
  updated_at: string | null
}

export type BuildChartInput = {
  name: string
  birth_date: string
  birth_time: string
  time_zone: string
  birth_lat?: number | null
  birth_lon?: number | null
}

const CHART_CALCULATION_PREFERENCES_SELECT =
  'house_system,zodiac_type,orb_mode,show_house_degrees'

export async function getChartCalculationPreferences(
  userId: string
): Promise<ChartCalculationPreferences> {
  const { data, error } = await supabase
    .from('chart_preferences')
    .select(CHART_CALCULATION_PREFERENCES_SELECT)
    .eq('user_id', userId)
    .maybeSingle<ChartPreferencesRow>()

  if (error) {
    console.warn('Chart preferences fetch failed:', error)
    return DEFAULT_CHART_CALCULATION_PREFERENCES
  }

  if (!data) return DEFAULT_CHART_CALCULATION_PREFERENCES

  const parsed = parseChartCalculationPreferences(data)
  if (!parsed) {
    console.warn('Unsupported chart preferences found; using defaults.')
    return DEFAULT_CHART_CALCULATION_PREFERENCES
  }

  return parsed
}

export function buildChartData(
  input: BuildChartInput,
  calculationPreferences?: ChartCalculationPreferences
): ChartData {
  const preferences = resolveChartCalculationPreferences(
    calculationPreferences
  )
  const tz = normalizeZone(input.time_zone)
  if (!tz) throw new Error('Invalid time zone')

  const { jsDate, dtUTC } = birthToUTC(input.birth_date, input.birth_time, tz)
  const planets = computeNatalPlanets(jsDate)
  const aspects = findAspects(planets, preferences.orb_mode)

  const hasLocation = input.birth_lat != null && input.birth_lon != null

  const houses = hasLocation
    ? computeWholeSignHouses(jsDate, input.birth_lat!, input.birth_lon!)
    : null
  
  const planet_houses =
  houses != null ? assignPlanetsToWholeSignHouses(planets, houses) : null

  return {
    meta: {
      name: input.name,
      birth_date: input.birth_date,
      birth_time: input.birth_time,
      time_zone: tz,
      birth_lat: hasLocation ? input.birth_lat ?? null : null,
      birth_lon: hasLocation ? input.birth_lon ?? null : null,
      computed_at: new Date().toISOString(),
      instant_utc: dtUTC.toISO(),
    },
    planets,
    aspects,
    houses,
    planet_houses,
  }
}

export type SaveChartInput = {
  name: string
  birth_date: string
  birth_time: string
  time_zone: string
  birth_lat?: number | null
  birth_lon?: number | null
  chart_data: ChartData
}

const CHART_IDENTITY_CONFLICT_TARGET =
  'user_id,birth_date,birth_time,time_zone,birth_lat,birth_lon'

export function hasChartIdentityCoordinates(input: {
  birth_lat?: number | null
  birth_lon?: number | null
}) {
  return input.birth_lat != null && input.birth_lon != null
}

export async function saveChart(userId: string, input: SaveChartInput) {
  if (!hasChartIdentityCoordinates(input)) {
    throw new Error('Birth coordinates are required to save a chart.')
  }

  const { data, error } = await supabase
    .from('charts')
    .upsert(
      {
        user_id: userId,
        ...input,
      },
      {
        onConflict: CHART_IDENTITY_CONFLICT_TARGET,
      }
    )
    .select(
      'id,user_id,name,chart_data,birth_date,birth_time,time_zone,birth_lat,birth_lon,created_at,updated_at'
    )
    .single()

  if (error) throw error
  return data as ChartRow
}

export async function listCharts(userId: string) {
  const { data, error } = await supabase
    .from('charts')
    .select(
      'id,user_id,name,chart_data,birth_date,birth_time,time_zone,birth_lat,birth_lon,created_at,updated_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ChartRow[]
}

export async function getChart(id: number, userId: string) {
  const { data, error } = await supabase
    .from('charts')
    .select(
      'id,user_id,name,chart_data,birth_date,birth_time,time_zone,birth_lat,birth_lon,created_at,updated_at'
    )
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as ChartRow | null
}

export async function deleteChart(id: number, userId: string) {
  const { error } = await supabase
    .from('charts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
