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

export function buildChartData(input: BuildChartInput): ChartData {
  const tz = normalizeZone(input.time_zone)
  if (!tz) throw new Error('Invalid time zone')

  const { jsDate, dtUTC } = birthToUTC(input.birth_date, input.birth_time, tz)
  const planets = computeNatalPlanets(jsDate)
  const aspects = findAspects(planets)

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

export async function saveChart(userId: string, input: SaveChartInput) {
  const { data, error } = await supabase
    .from('charts')
    .upsert(
      {
        user_id: userId,
        ...input,
      },
      {
        onConflict: 'user_id,birth_date,birth_time,time_zone',
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