import {
  computeTransitPlanets,
  findAspects,
  type Aspect,
  type AspectOrbMode,
  type PlanetPos,
} from './astro'
import {
  getAspectMeaning,
  type PlanetKey,
  type ZodiacName,
  zodiacNameFromLongitude,
} from './lexicon'

export const DAILY_TRANSIT_PLANET_NAMES = [
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
] as const

export type DailyTransitPlanetName =
  (typeof DAILY_TRANSIT_PLANET_NAMES)[number]

export type DailyTransitPlanetIdentity = {
  kind: 'transit'
  id: string
  name: DailyTransitPlanetName
  lon: number
}

export type DailyNatalPlanetIdentity = {
  kind: 'natal'
  id: string
  name: string
  lon: number
}

type DailyPlanetIdentity =
  | DailyTransitPlanetIdentity
  | DailyNatalPlanetIdentity

export type DailyTransitAspect = {
  transit: DailyTransitPlanetIdentity
  natal: DailyNatalPlanetIdentity
  type: Aspect['type']
  orb: number
  aspectMeaning: string | null
}

export type TodayEnergy = {
  transitSunSign: ZodiacName | null
  transitMoonSign: ZodiacName | null
  strongestAspect: DailyTransitAspect | null
}

const DAILY_TRANSIT_PLANET_SET = new Set<PlanetKey>(
  DAILY_TRANSIT_PLANET_NAMES
)

function asDailyTransitPlanetName(
  name: string
): DailyTransitPlanetName | null {
  return DAILY_TRANSIT_PLANET_SET.has(name as PlanetKey)
    ? (name as DailyTransitPlanetName)
    : null
}

function transitPriority(name: DailyTransitPlanetName): number {
  return DAILY_TRANSIT_PLANET_NAMES.indexOf(name)
}

function compareTransitAspects(
  a: DailyTransitAspect,
  b: DailyTransitAspect
): number {
  return (
    a.orb - b.orb ||
    transitPriority(a.transit.name) - transitPriority(b.transit.name) ||
    a.natal.name.localeCompare(b.natal.name) ||
    a.type.localeCompare(b.type)
  )
}

function buildTransitIdentity(
  planet: PlanetPos,
  index: number
): DailyTransitPlanetIdentity | null {
  const name = asDailyTransitPlanetName(planet.name)
  if (!name) return null

  return {
    kind: 'transit',
    id: `transit:${name}:${index}`,
    name,
    lon: planet.lon,
  }
}

function buildNatalIdentity(
  planet: PlanetPos,
  index: number
): DailyNatalPlanetIdentity {
  return {
    kind: 'natal',
    id: `natal:${planet.name}:${index}`,
    name: planet.name,
    lon: planet.lon,
  }
}

function toAspectPlanet(identity: DailyPlanetIdentity): PlanetPos {
  return {
    name: identity.id,
    lon: identity.lon,
  }
}

function toDailyTransitAspect(
  aspect: Aspect,
  identitiesById: Map<string, DailyPlanetIdentity>
): DailyTransitAspect | null {
  const first = identitiesById.get(aspect.a)
  const second = identitiesById.get(aspect.b)

  if (!first || !second) return null

  const transit =
    first.kind === 'transit'
      ? first
      : second.kind === 'transit'
      ? second
      : null
  const natal =
    first.kind === 'natal' ? first : second.kind === 'natal' ? second : null

  if (!transit || !natal) return null

  return {
    transit,
    natal,
    type: aspect.type,
    orb: aspect.orb,
    aspectMeaning: getAspectMeaning(aspect.type)?.short ?? null,
  }
}

export function findDailyTransitAspects(
  natalPlanets: PlanetPos[],
  transitPlanets: PlanetPos[],
  orbMode: AspectOrbMode = 'medium'
): DailyTransitAspect[] {
  const transitIdentities = transitPlanets.flatMap((planet, index) => {
    const identity = buildTransitIdentity(planet, index)
    return identity ? [identity] : []
  })
  const natalIdentities = natalPlanets.map(buildNatalIdentity)
  const identities = [...transitIdentities, ...natalIdentities]
  const identitiesById = new Map(
    identities.map((identity) => [identity.id, identity])
  )

  return findAspects(identities.map(toAspectPlanet), orbMode)
    .map((aspect) => toDailyTransitAspect(aspect, identitiesById))
    .filter((aspect): aspect is DailyTransitAspect => aspect != null)
    .sort(compareTransitAspects)
}

export function findStrongestDailyTransitAspect(
  natalPlanets: PlanetPos[],
  transitPlanets: PlanetPos[],
  orbMode: AspectOrbMode = 'medium'
): DailyTransitAspect | null {
  return (
    findDailyTransitAspects(natalPlanets, transitPlanets, orbMode)[0] ?? null
  )
}

export function buildTodayEnergy(
  natalPlanets: PlanetPos[],
  dateUTC: Date,
  orbMode: AspectOrbMode = 'medium'
): TodayEnergy {
  const transitPlanets = computeTransitPlanets(dateUTC)
  const transitSun = transitPlanets.find((planet) => planet.name === 'Sun')
  const transitMoon = transitPlanets.find((planet) => planet.name === 'Moon')

  return {
    transitSunSign: transitSun
      ? zodiacNameFromLongitude(transitSun.lon)
      : null,
    transitMoonSign: transitMoon
      ? zodiacNameFromLongitude(transitMoon.lon)
      : null,
    strongestAspect: findStrongestDailyTransitAspect(
      natalPlanets,
      transitPlanets,
      orbMode
    ),
  }
}
