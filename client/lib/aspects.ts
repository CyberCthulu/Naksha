import type { Aspect, PlanetPos } from './astro'

/** Naksha's medium orb policy. These tolerances are choices, not ephemeris errors. */
export const ASPECT_RULES = [
  { type: 'conj', label: 'Conjunction', angle: 0, orb: 6 },
  { type: 'opp', label: 'Opposition', angle: 180, orb: 6 },
  { type: 'trine', label: 'Trine', angle: 120, orb: 5 },
  { type: 'square', label: 'Square', angle: 90, orb: 5 },
  { type: 'sextile', label: 'Sextile', angle: 60, orb: 4 },
] as const

/** Smallest separation in ecliptic longitude, not the 3D sky angle. */
export function angularSeparation(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Aspect longitudes must be finite')
  }
  const norm = (angle: number) => ((angle % 360) + 360) % 360
  const difference = Math.abs(norm(a) - norm(b))
  return Math.min(difference, 360 - difference)
}

/** Classify each pair with unrounded longitudes and retain full numeric precision. */
export function calculateAspects(planets: PlanetPos[]): Aspect[] {
  const names = new Set<string>()
  for (const planet of planets) {
    if (
      !planet.name.trim() ||
      names.has(planet.name) ||
      !Number.isFinite(planet.lon)
    ) {
      throw new Error('Aspects require unique bodies with finite longitudes')
    }
    names.add(planet.name)
  }
  const aspects: Aspect[] = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i]
      const b = planets[j]
      const separation = angularSeparation(a.lon, b.lon)
      for (const rule of ASPECT_RULES) {
        const orb = Math.abs(separation - rule.angle)
        if (orb <= rule.orb) {
          aspects.push({ a: a.name, b: b.name, type: rule.type, orb })
        }
      }
    }
  }
  return aspects
}
