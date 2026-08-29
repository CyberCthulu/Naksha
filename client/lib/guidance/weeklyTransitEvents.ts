import {
  computeTransitPlanets,
  findAspects,
  type Aspect,
  type AspectOrbMode,
  type PlanetPos,
} from '../astro'
import type { AspectType, PlanetKey } from '../lexicon'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  GUIDANCE_TRANSIT_PLANETS,
  NATAL_TARGET_GUIDANCE,
  TRANSIT_PLANET_GUIDANCE,
  type GuidanceTransitPlanet,
} from '../lexicon/guidance'
import type { WeeklyTransitHighlight } from './types'

export type WeeklyTransitSnapshot = {
  date: string
  evaluatedAt: Date
}

type TransitIdentity = {
  kind: 'transit'
  id: string
  name: GuidanceTransitPlanet
  lon: number
}

type NatalIdentity = {
  kind: 'natal'
  id: string
  name: PlanetKey
  lon: number
}

type PlanetIdentity = TransitIdentity | NatalIdentity

type SampledTransit = Omit<
  WeeklyTransitHighlight,
  'activeDays' | 'significanceScore'
>

const WEEKLY_TRANSIT_PLANET_SET = new Set<string>(
  GUIDANCE_TRANSIT_PLANETS
)

const PLANET_RELEVANCE: Record<GuidanceTransitPlanet, number> = {
  Moon: 0,
  Sun: 16,
  Mercury: 14,
  Venus: 18,
  Mars: 22,
  Jupiter: 30,
  Saturn: 32,
}

const ASPECT_RELEVANCE: Record<AspectType, number> = {
  conj: 10,
  opp: 9,
  square: 9,
  trine: 7,
  sextile: 5,
}

const FAST_WEEKLY_ORB_LIMIT: Record<AspectType, number> = {
  conj: 3,
  opp: 3,
  square: 2.5,
  trine: 2.5,
  sextile: 2,
}

const SLOW_WEEKLY_ORB_LIMIT: Record<AspectType, number> = {
  conj: 1.5,
  opp: 1.5,
  square: 1.25,
  trine: 1.25,
  sextile: 1,
}

const MAX_WEEKLY_HIGHLIGHTS = 5
const MAX_HIGHLIGHTS_PER_PLANET = 2

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function isGuidanceTransitPlanet(
  name: string
): name is GuidanceTransitPlanet {
  return WEEKLY_TRANSIT_PLANET_SET.has(name)
}

function isPlanetKey(name: string): name is PlanetKey {
  return Object.prototype.hasOwnProperty.call(
    NATAL_TARGET_GUIDANCE,
    name
  )
}

function toAspectPlanet(identity: PlanetIdentity): PlanetPos {
  return { name: identity.id, lon: identity.lon }
}

function transitKey(transit: {
  transitPlanet: GuidanceTransitPlanet
  aspect: AspectType
  natalPlanet: PlanetKey
}): string {
  return [
    transit.transitPlanet,
    transit.aspect,
    transit.natalPlanet,
  ].join(':')
}

function orbLimit(
  planet: GuidanceTransitPlanet,
  aspect: AspectType
): number {
  return planet === 'Jupiter' || planet === 'Saturn'
    ? SLOW_WEEKLY_ORB_LIMIT[aspect]
    : FAST_WEEKLY_ORB_LIMIT[aspect]
}

function toSampledTransit(
  aspect: Aspect,
  identitiesById: Map<string, PlanetIdentity>,
  date: string
): SampledTransit | null {
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
    first.kind === 'natal'
      ? first
      : second.kind === 'natal'
      ? second
      : null

  if (
    !transit ||
    !natal ||
    aspect.orb > orbLimit(transit.name, aspect.type)
  ) {
    return null
  }

  const transitGuidance = TRANSIT_PLANET_GUIDANCE[transit.name]
  const targetGuidance = NATAL_TARGET_GUIDANCE[natal.name]
  const dynamic = ASPECT_DYNAMIC_GUIDANCE[aspect.type]

  return {
    transitPlanet: transit.name,
    natalPlanet: natal.name,
    aspect: aspect.type,
    orb: aspect.orb,
    tone: dynamic.tone,
    intensity: dynamic.intensity,
    sourceIds: unique([
      transitGuidance.id,
      targetGuidance.id,
      dynamic.id,
    ]),
    date,
  }
}

function sampleSnapshot(
  natalPlanets: readonly PlanetPos[],
  snapshot: WeeklyTransitSnapshot,
  orbMode: AspectOrbMode
): SampledTransit[] {
  const transitIdentities: TransitIdentity[] = computeTransitPlanets(
    snapshot.evaluatedAt
  ).flatMap((planet, index) =>
    isGuidanceTransitPlanet(planet.name)
      ? [
          {
            kind: 'transit' as const,
            id: `weekly-transit:${planet.name}:${index}`,
            name: planet.name,
            lon: planet.lon,
          },
        ]
      : []
  )
  const natalIdentities: NatalIdentity[] = natalPlanets.flatMap(
    (planet, index) =>
      isPlanetKey(planet.name)
        ? [
            {
              kind: 'natal' as const,
              id: `weekly-natal:${planet.name}:${index}`,
              name: planet.name,
              lon: planet.lon,
            },
          ]
        : []
  )
  const identities: PlanetIdentity[] = [
    ...transitIdentities,
    ...natalIdentities,
  ]
  const identitiesById = new Map(
    identities.map((identity) => [identity.id, identity])
  )

  return findAspects(identities.map(toAspectPlanet), orbMode)
    .map((aspect) =>
      toSampledTransit(aspect, identitiesById, snapshot.date)
    )
    .filter((transit): transit is SampledTransit => transit != null)
}

function significanceScore(
  transit: SampledTransit,
  activeDays: number
): number {
  const transitOrbLimit = orbLimit(
    transit.transitPlanet,
    transit.aspect
  )
  const orbCloseness = Math.max(
    0,
    (transitOrbLimit - transit.orb) / transitOrbLimit
  )

  return Number(
    (
      PLANET_RELEVANCE[transit.transitPlanet] +
      ASPECT_RELEVANCE[transit.aspect] +
      orbCloseness * 20 +
      Math.min(activeDays, 3) * 2
    ).toFixed(2)
  )
}

function compareHighlights(
  a: WeeklyTransitHighlight,
  b: WeeklyTransitHighlight
): number {
  return (
    b.significanceScore - a.significanceScore ||
    PLANET_RELEVANCE[b.transitPlanet] -
      PLANET_RELEVANCE[a.transitPlanet] ||
    a.orb - b.orb ||
    transitKey(a).localeCompare(transitKey(b)) ||
    a.date.localeCompare(b.date)
  )
}

function limitHighlights(
  highlights: readonly WeeklyTransitHighlight[]
): WeeklyTransitHighlight[] {
  const selected: WeeklyTransitHighlight[] = []
  const counts = new Map<GuidanceTransitPlanet, number>()

  for (const highlight of highlights) {
    const planetLimit =
      highlight.transitPlanet === 'Moon'
        ? 1
        : MAX_HIGHLIGHTS_PER_PLANET
    const count = counts.get(highlight.transitPlanet) ?? 0

    if (count >= planetLimit) continue

    selected.push(highlight)
    counts.set(highlight.transitPlanet, count + 1)
    if (selected.length === MAX_WEEKLY_HIGHLIGHTS) break
  }

  return selected
}

export function buildWeeklyTransitHighlights({
  natalPlanets,
  snapshots,
  orbMode = 'medium',
}: {
  natalPlanets: readonly PlanetPos[]
  snapshots: readonly WeeklyTransitSnapshot[]
  orbMode?: AspectOrbMode
}): WeeklyTransitHighlight[] {
  const byTransit = new Map<
    string,
    { best: SampledTransit; dates: Set<string> }
  >()

  snapshots.forEach((snapshot) => {
    sampleSnapshot(natalPlanets, snapshot, orbMode).forEach(
      (candidate) => {
        const key = transitKey(candidate)
        const existing = byTransit.get(key)

        if (!existing) {
          byTransit.set(key, {
            best: candidate,
            dates: new Set([candidate.date]),
          })
          return
        }

        existing.dates.add(candidate.date)
        if (
          candidate.orb < existing.best.orb ||
          (candidate.orb === existing.best.orb &&
            candidate.date < existing.best.date)
        ) {
          existing.best = candidate
        }
      }
    )
  })

  const highlights = [...byTransit.values()].map(
    ({ best, dates }) => {
      const activeDays = dates.size

      return {
        ...best,
        sourceIds: [...best.sourceIds],
        activeDays,
        significanceScore: significanceScore(best, activeDays),
      }
    }
  )

  return limitHighlights(highlights.sort(compareHighlights))
}
