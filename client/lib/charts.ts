import supabase from './supabase'
import { computeNatalPlanets, findAspects } from './astro'
import { birthToUTC } from './time'
import { normalizeZone } from './timezones'

export type ChartRow = {
    id: number
    user_id: string
    name: string
    chart_data: any
    created_at: string | null
    updated_at: string | null
}

export type BuildChartInput = {
    name: string
    birth_date: string
    birth_time: string
    time_zone: string
}

export function BuildChartData(input: BuildChartInput) {
    const tz = normalizeZone(input.time_zone)
    if (!tz) throw new Error('Invalid time zone')

    const { jsDate, dtUTC } = birthToUTC(input.birth_date, input.birth_time, tz)
    const planets = computeNatalPlanets(jsDate)
    const aspects = findAspects(planets)
    return {
    meta: {
      name: input.name,
      birth_date: input.birth_date,
      birth_time: input.birth_time,
      time_zone: tz,
      computed_at: new Date().toISOString(),
      instant_utc: dtUTC.toISO(),
    },
    planets,
    aspects,
  }
}

export async function saveChart(userId: string, input: BuildChartInput) {
  const payload = BuildChartData(input)
  const { data, error } = await supabase
    .from('charts')
    .insert({ user_id: userId, name: input.name, chart_data: payload })
    .select('*')
    .single()
  if (error) throw error
  return data as ChartRow
}

export async function listCharts(userId: string) {
  const { data, error } = await supabase
    .from('charts')
    .select('id,user_id,name,chart_data,created_at,updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ChartRow[]
}
