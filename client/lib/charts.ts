import supabase from './supabase'
import { computeNatalPlanets, findAspects } from './astro'
import { birthToUTC } from './time'
import { normalizeZone } from './timezones'

export type ChartRow = {
  id: number
  user_id: string
  name: string
  birth_date: string | null
  birth_time: string | null
  birth_lat: number | null
  birth_lon: number | null 
  time_zone: string | null
  chart_data: any
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

export type HouseCusp = {
    house: number
    lon: number
}

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

export function norm360(deg: number) {
    return ((deg % 360) + 360) % 360
}

export function toJulianDate(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const D =
    date.getUTCDate() +
    (date.getUTCHours() +
      (date.getUTCMinutes() + date.getUTCSeconds() / 60) / 60) /
      24

  let Y = y
  let M = m
  if (m <= 2) {
    Y = y - 1
    M = m + 12
  }

  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)

  const JD =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    D +
    B -
    1524.5

  return JD
}

// approximate mean obliquity of ecliptic (good enough for house cusps)
function meanObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525
  // arcseconds
  const epsSec =
    21.448 -
    T * (46.8150 + T * (0.00059 - T * 0.001813))
  const epsDeg = 23 + 26 / 60 + epsSec / 3600
  return epsDeg
}

// Greenwich Mean Sidereal Time (degrees)
function gmstDegrees(jd: number): number {
  const T = (jd - 2451545.0) / 36525
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000
  return norm360(gmst)
}

// Local sidereal time in degrees (lon: east>0, west<0)
function localSiderealDegrees(jd: number, lonDeg: number): number {
  return norm360(gmstDegrees(jd) + lonDeg)
}

/**
 * Compute Whole-Sign house cusps from birth date/time and location.
 * This uses an approximate Ascendant calculation – good enough for UX.
 */
export function computeWholeSignHouses(
  jsDate: Date,
  latDeg: number,
  lonDeg: number
): HouseCusp[] {
  const jd = toJulianDate(jsDate)
  const eps = meanObliquity(jd) * DEG2RAD
  const phi = latDeg * DEG2RAD
  const lst = localSiderealDegrees(jd, lonDeg) * DEG2RAD

  // Ascendant longitude (Meeus-style formula, approx)
  const num = Math.cos(lst)
  const den = -Math.sin(lst) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps)
  let lambdaAsc = Math.atan2(num, den) * RAD2DEG
  lambdaAsc = norm360(lambdaAsc)

  // Whole-sign: 1st house starts at 0° of Ascendant’s sign
  const ascSign = Math.floor(lambdaAsc / 30)
  const firstCusp = ascSign * 30

  const houses: HouseCusp[] = []
  for (let i = 0; i < 12; i++) {
    houses.push({
      house: i + 1,
      lon: norm360(firstCusp + i * 30),
    })
  }
  return houses
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
      birth_lat: input.birth_lat ?? null,
      birth_lon: input.birth_lon ?? null,       
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
    .upsert(
      {
        user_id: userId,
        name: input.name,
        birth_date: input.birth_date,   
        birth_time: input.birth_time,     
        time_zone: input.time_zone,
        birth_lat: input.birth_lat ?? null,
        birth_lon: input.birth_lon ?? null,       
        chart_data: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,birth_date,birth_time,time_zone' } 
    )    
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

export async function getChart(id: number, userId: string) {
  const { data, error } = await supabase
    .from('charts')
    .select('*')
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