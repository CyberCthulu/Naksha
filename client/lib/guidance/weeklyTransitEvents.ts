import {
  computeTransitPlanets,
  findAspectsWithFullPrecision,
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
> & {
  selectionOrb: number
}

type RankedWeeklyTransitHighlight = WeeklyTransitHighlight & {
  selectionOrb: number
}

const WEEKLY_TRANSIT_PLANET_SET = new Set<string>(
  GUIDANCE_TRANSIT_PLANETS
)

export const WEEKLY_PLANET_RELEVANCE: Record<
  GuidanceTransitPlanet,
  number
> = {
  Moon: 0,
  Sun: 16,
  Mercury: 14,
  Venus: 18,
  Mars: 22,
  Jupiter: 30,
  Saturn: 32,
}

export const WEEKLY_ASPECT_RELEVANCE: Record<AspectType, number> = {
  conj: 10,
  opp: 9,
  square: 9,
  trine: 7,
  sextile: 5,
}

export const FAST_WEEKLY_ORB_LIMIT: Record<AspectType, number> = {
  conj: 3,
  opp: 3,
  square: 2.5,
  trine: 2.5,
  sextile: 2,
}

export const SLOW_WEEKLY_ORB_LIMIT: Record<AspectType, number> = {
  conj: 1.5,
  opp: 1.5,
  square: 1.25,
  trine: 1.25,
  sextile: 1,
}

export const MAX_WEEKLY_HIGHLIGHTS = 5
export const MAX_HIGHLIGHTS_PER_PLANET = 2
export const MAX_WEEKLY_MOON_HIGHLIGHTS = 1
export const WEEKLY_SIGNIFICANCE_RANKING_POLICY = {
  orbClosenessWeight: 20,
  activeDayCap: 3,
  activeDayWeight: 2,
  scoreDecimalPlaces: 2,
  orbInputPrecision: 'fullPrecision',
  ordering: [
    'significanceScoreDescending',
    'planetRelevanceDescending',
    'orbAscending',
    'directionalIdentityAscending',
    'dateAscending',
  ],
} as const

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

export function isWithinWeeklyOrbLimit(
  planet: GuidanceTransitPlanet,
  aspect: AspectType,
  orb: number
): boolean {
  return orb <= orbLimit(planet, aspect)
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
    !isWithinWeeklyOrbLimit(transit.name, aspect.type, aspect.orb)
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
    orb: +aspect.orb.toFixed(2),
    selectionOrb: aspect.orb,
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

  return findAspectsWithFullPrecision(
    identities.map(toAspectPlanet),
    orbMode
  )
    .map((aspect) =>
      toSampledTransit(aspect, identitiesById, snapshot.date)
    )
    .filter((transit): transit is SampledTransit => transit != null)
}

export function calculateWeeklySignificanceScore(
  transit: Pick<
    WeeklyTransitHighlight,
    'transitPlanet' | 'aspect' | 'orb'
  >,
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
      WEEKLY_PLANET_RELEVANCE[transit.transitPlanet] +
      WEEKLY_ASPECT_RELEVANCE[transit.aspect] +
      orbCloseness *
        WEEKLY_SIGNIFICANCE_RANKING_POLICY.orbClosenessWeight +
      Math.min(
        activeDays,
        WEEKLY_SIGNIFICANCE_RANKING_POLICY.activeDayCap
      ) * WEEKLY_SIGNIFICANCE_RANKING_POLICY.activeDayWeight
    ).toFixed(WEEKLY_SIGNIFICANCE_RANKING_POLICY.scoreDecimalPlaces)
  )
}

export function compareWeeklyHighlights(
  a: WeeklyTransitHighlight & { selectionOrb?: number },
  b: WeeklyTransitHighlight & { selectionOrb?: number }
): number {
  return (
    b.significanceScore - a.significanceScore ||
    WEEKLY_PLANET_RELEVANCE[b.transitPlanet] -
      WEEKLY_PLANET_RELEVANCE[a.transitPlanet] ||
    (a.selectionOrb ?? a.orb) - (b.selectionOrb ?? b.orb) ||
    transitKey(a).localeCompare(transitKey(b)) ||
    a.date.localeCompare(b.date)
  )
}

function limitHighlights(
  highlights: readonly RankedWeeklyTransitHighlight[]
): RankedWeeklyTransitHighlight[] {
  const selected: RankedWeeklyTransitHighlight[] = []
  const counts = new Map<GuidanceTransitPlanet, number>()

  for (const highlight of highlights) {
    const planetLimit =
      highlight.transitPlanet === 'Moon'
        ? MAX_WEEKLY_MOON_HIGHLIGHTS
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
          candidate.selectionOrb < existing.best.selectionOrb ||
          (candidate.selectionOrb === existing.best.selectionOrb &&
            candidate.date < existing.best.date)
        ) {
          existing.best = candidate
        }
      }
    )
  })

  const highlights: RankedWeeklyTransitHighlight[] = [
    ...byTransit.values(),
  ].map(
    ({ best, dates }) => {
      const activeDays = dates.size

      return {
        ...best,
        sourceIds: [...best.sourceIds],
        activeDays,
        significanceScore: calculateWeeklySignificanceScore(
          {
            transitPlanet: best.transitPlanet,
            aspect: best.aspect,
            orb: best.selectionOrb,
          },
          activeDays
        ),
      }
    }
  )

  return limitHighlights(highlights.sort(compareWeeklyHighlights)).map(
    ({ selectionOrb: _selectionOrb, ...highlight }) => highlight
  )
}
