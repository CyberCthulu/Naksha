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
  return bodies.map(b => ({ name: Astro.Body[b] ?? String(b), lon: eclipticLongitude(b, dateUTC) }))
}

// -------- optional aspect finder --------
export type Aspect = {
  a: string; b: string;
  type: 'conj'|'opp'|'trine'|'square'|'sextile';
  orb: number;
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
      const delta = Math.abs(((a.lon - b.lon + 540) % 360) - 180)
      for (const asp of ASPECTS) {
        const target = Math.abs(180 - asp.angle)
        const orb = Math.abs(delta - target)
        if (orb <= asp.orb) res.push({ a: a.name, b: b.name, type: asp.type, orb: +orb.toFixed(2) })
      }
    }
  }
  return res
}
