// lib/astro.ts
import * as Astro from 'astronomy-engine'

// Normalize angle into 0..360
const norm = (deg: number) => ((deg % 360) + 360) % 360

// Geocentric ecliptic longitude (true) for a body at a UTC Date
function eclipticLongitude(body: Astro.Body, date: Date): number {
  // Geocentric position vector of the body
  const vec = Astro.GeoVector(body, date, /*aberration*/ true)
  // Convert to ecliptic coordinates
  const ecl = Astro.Ecliptic(vec)
  return norm(ecl.elon)
}

export type PlanetPos = { name: string; lon: number }

export function computeNatalPlanets(dateUTC: Date): PlanetPos[] {
  const bodies: Astro.Body[] = [
    Astro.Body.Sun,
    Astro.Body.Moon,
    Astro.Body.Mercury,
    Astro.Body.Venus,
    Astro.Body.Mars,
    Astro.Body.Jupiter,
    Astro.Body.Saturn,
    Astro.Body.Uranus,
    Astro.Body.Neptune,
    Astro.Body.Pluto,
  ]
  return bodies.map(b => ({
    name: Astro.Body[b] ?? String(b),
    lon: eclipticLongitude(b, dateUTC),
  }))
}

// -------- Aspect finder --------
export type Aspect = {
  a: string
  b: string
  type: 'conj' | 'opp' | 'trine' | 'square' | 'sextile'
  orb: number
}

const ASPECTS = [
  { type: 'conj',    angle: 0,   orb: 6 },
  { type: 'opp',     angle: 180, orb: 6 },
  { type: 'trine',   angle: 120, orb: 5 },
  { type: 'square',  angle: 90,  orb: 5 },
  { type: 'sextile', angle: 60,  orb: 4 },
] as const

export function findAspects(planets: PlanetPos[]): Aspect[] {
  const res: Aspect[] = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i], b = planets[j]
      // smallest angular distance 0..180
      const sep = Math.abs(((a.lon - b.lon + 540) % 360) - 180)
      for (const asp of ASPECTS) {
        const diff = Math.abs(sep - asp.angle)
        if (diff <= asp.orb) {
          res.push({
            a: a.name,
            b: b.name,
            type: asp.type,
            orb: +diff.toFixed(2),
          })
        }
      }
    }
  }
  return res
}

// -------- House cusps (Whole Sign) --------

export type HouseCusp = {
  house: number  // 1–12
  lon: number    // ecliptic longitude in degrees 0–360
}

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

// Separate wrapper (same behavior as norm, just more explicit for this section)
const norm360 = (deg: number) => ((deg % 360) + 360) % 360

// Julian Date from a JS Date (UTC)
function toJulianDate(date: Date): number {
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

// Approximate mean obliquity of the ecliptic (degrees)
function meanObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525
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
 * - Uses an approximate Ascendant formula (good enough for UX)
 * - House 1 starts at 0° of the Ascendant’s sign
 * - Each subsequent house is the next sign (30° steps)
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

  // Ascendant longitude (approx Meeus-style formula)
  const num = Math.cos(lst)
  const den = -Math.sin(lst) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps)
  let lambdaAsc = Math.atan2(num, den) * RAD2DEG
  lambdaAsc = norm360(lambdaAsc)

  // Whole-sign: 1st house cusp at 0° of Ascendant's sign
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
