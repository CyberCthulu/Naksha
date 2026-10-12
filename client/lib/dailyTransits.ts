import {
  computeTransitPlanets,
  findAspectsWithFullPrecision,
  type Aspect,
  type AspectOrbMode,
  type PlanetPos,
} from './astro'
import {
  getAspectMeaning,
  isPlanetKey,
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
  name: PlanetKey
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

type DailyTransitCandidate = {
  result: DailyTransitAspect
  selectionOrb: number
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
  a: DailyTransitCandidate,
  b: DailyTransitCandidate
): number {
  return (
    a.selectionOrb - b.selectionOrb ||
    transitPriority(a.result.transit.name) -
      transitPriority(b.result.transit.name) ||
    a.result.natal.name.localeCompare(b.result.natal.name) ||
    a.result.type.localeCompare(b.result.type)
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
): DailyNatalPlanetIdentity | null {
  if (!isPlanetKey(planet.name)) return null

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
): DailyTransitCandidate | null {
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
    selectionOrb: aspect.orb,
    result: {
      transit,
      natal,
      type: aspect.type,
      orb: +aspect.orb.toFixed(2),
      aspectMeaning: getAspectMeaning(aspect.type)?.short ?? null,
    },
  }
}

function findDailyTransitCandidates(
  natalPlanets: PlanetPos[],
  transitPlanets: PlanetPos[],
  orbMode: AspectOrbMode
): DailyTransitCandidate[] {
  const transitIdentities = transitPlanets.flatMap((planet, index) => {
    const identity = buildTransitIdentity(planet, index)
    return identity ? [identity] : []
  })
  const natalIdentities = natalPlanets.flatMap((planet, index) => {
    const identity = buildNatalIdentity(planet, index)
    return identity ? [identity] : []
  })
  const identities = [...transitIdentities, ...natalIdentities]
  const identitiesById = new Map(
    identities.map((identity) => [identity.id, identity])
  )

  return findAspectsWithFullPrecision(
    identities.map(toAspectPlanet),
    orbMode
  )
    .map((aspect) => toDailyTransitAspect(aspect, identitiesById))
    .filter((aspect): aspect is DailyTransitCandidate => aspect != null)
    .sort(compareTransitAspects)
}

export function findDailyTransitAspects(
  natalPlanets: PlanetPos[],
  transitPlanets: PlanetPos[],
  orbMode: AspectOrbMode = 'medium'
): DailyTransitAspect[] {
  return findDailyTransitCandidates(
    natalPlanets,
    transitPlanets,
    orbMode
  ).map(({ result }) => result)
}

export function findStrongestDailyTransitAspect(
  natalPlanets: PlanetPos[],
  transitPlanets: PlanetPos[],
  orbMode: AspectOrbMode = 'medium'
): DailyTransitAspect | null {
  return (
    findDailyTransitCandidates(natalPlanets, transitPlanets, orbMode)[0]
      ?.result ?? null
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
