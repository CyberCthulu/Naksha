import { computeTransitPlanets, type Aspect, type PlanetPos } from './astro'
import { calculateAspects } from './aspects'
import { zodiacNameFromLongitude } from './lexicon'

export type CurrentSky = {
  evaluatedAt: Date
  planets: PlanetPos[]
  aspects: Aspect[]
}

/**
 * Same geocentric, tropical longitudes as the birth chart, for this instant.
 * GeoVector + Ecliptic produce true ecliptic-of-date coordinates:
 * https://github.com/cosinekitty/astronomy/tree/master/source/js#Ecliptic
 * This world-wide sky has no observer-dependent houses or natal comparisons.
 */
export function buildCurrentSky(at: Date): CurrentSky {
  if (!Number.isFinite(at.getTime())) throw new Error('Invalid sky timestamp')
  const evaluatedAt = new Date(at.getTime())
  const planets = computeTransitPlanets(evaluatedAt)
  if (
    planets.length !== 10 ||
    planets.some((planet) => !Number.isFinite(planet.lon))
  ) {
    throw new Error('Planetary positions are unavailable')
  }
  return { evaluatedAt, planets, aspects: calculateAspects(planets) }
}

/** Truncate to arcminutes so 29°59′ never appears in the wrong sign. */
export function formatSkyPosition(longitude: number) {
  if (!Number.isFinite(longitude)) throw new Error('Invalid sky longitude')
  const normalized = ((longitude % 360) + 360) % 360
  const minutes = Math.floor((normalized % 30) * 60)
  return `${Math.floor(minutes / 60)}°${String(minutes % 60).padStart(2, '0')}′ ${zodiacNameFromLongitude(normalized)}`
}

export function skyAspectKey(aspect: Aspect) {
  return `${aspect.a}:${aspect.type}:${aspect.b}`
}
