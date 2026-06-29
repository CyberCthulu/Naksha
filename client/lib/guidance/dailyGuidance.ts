import {
  buildTodayEnergy,
  type DailyTransitAspect,
} from '../dailyTransits'
import type { PlanetKey } from '../lexicon'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  REFLECTION_PROMPTS,
  SIGN_GUIDANCE,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
  type GuidanceContentRecord,
  type GuidanceTag,
  type GuidanceTone,
  type ReflectionPrompt,
  type SuggestedPractice,
} from '../lexicon/guidance'
import type {
  BuildDailyGuidanceInput,
  DailyGuidance,
  DailyGuidanceSection,
  DailyGuidanceTransit,
} from './types'

type SelectableGuidance = Pick<
  GuidanceContentRecord,
  'id' | 'tags'
> & {
  sourceIds: readonly string[]
}

type PrimaryTransitContext = {
  result: DailyGuidanceTransit
  aspect: DailyTransitAspect
  transit: (typeof TRANSIT_PLANET_GUIDANCE)[DailyTransitAspect['transit']['name']]
  target: (typeof NATAL_TARGET_GUIDANCE)[PlanetKey]
  dynamic: (typeof ASPECT_DYNAMIC_GUIDANCE)[DailyTransitAspect['type']]
}

const ASPECT_LABELS: Record<DailyTransitAspect['type'], string> = {
  conj: 'conjoins',
  opp: 'opposes',
  trine: 'trines',
  square: 'squares',
  sextile: 'forms a sextile to',
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function isPlanetKey(name: string): name is PlanetKey {
  return Object.prototype.hasOwnProperty.call(NATAL_TARGET_GUIDANCE, name)
}

function toneForAspect(
  aspect: DailyTransitAspect['type']
): GuidanceTone {
  switch (aspect) {
    case 'trine':
    case 'sextile':
      return 'supportive'
    case 'square':
    case 'opp':
      return 'challenging'
    case 'conj':
      return 'intensifying'
  }
}

function stableHash(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function selectDeterministically<T extends SelectableGuidance>(
  records: readonly T[],
  tags: readonly GuidanceTag[],
  sourceIds: readonly string[],
  seed: string
): T {
  const sourceMatches = records.filter((record) =>
    record.sourceIds.some((sourceId) => sourceIds.includes(sourceId))
  )
  const tagMatches = records.filter((record) =>
    record.tags.some((tag) => tags.includes(tag))
  )
  const candidates =
    sourceMatches.length > 0
      ? sourceMatches
      : tagMatches.length > 0
      ? tagMatches
      : records
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id))

  return sorted[stableHash(seed) % sorted.length]
}

function buildPrimaryTransit(
  aspect: DailyTransitAspect | null
): PrimaryTransitContext | null {
  if (!aspect || !isPlanetKey(aspect.natal.name)) return null

  const transit = TRANSIT_PLANET_GUIDANCE[aspect.transit.name]
  const target = NATAL_TARGET_GUIDANCE[aspect.natal.name]
  const dynamic = ASPECT_DYNAMIC_GUIDANCE[aspect.type]
  const sourceIds = [transit.id, target.id, dynamic.id]

  return {
    aspect,
    transit,
    target,
    dynamic,
    result: {
      transitPlanet: aspect.transit.name,
      natalPlanet: aspect.natal.name,
      aspect: aspect.type,
      orb: aspect.orb,
      tone: toneForAspect(aspect.type),
      intensity: dynamic.intensity,
      sourceIds,
    },
  }
}

function section(
  title: string,
  body: string,
  sourceIds: readonly string[]
): DailyGuidanceSection {
  return {
    title,
    body,
    sourceIds: unique(sourceIds),
  }
}

function chartSeed(input: BuildDailyGuidanceInput): string {
  return input.natalPlanets
    .map((planet) => `${planet.name}:${planet.lon.toFixed(6)}`)
    .join('|')
}

export function buildDailyGuidance(
  input: BuildDailyGuidanceInput
): DailyGuidance {
  const evaluatedAt = input.evaluatedAt.toISOString()
  const date = evaluatedAt.slice(0, 10)
  const todayEnergy = buildTodayEnergy(
    input.natalPlanets,
    input.evaluatedAt,
    input.orbMode
  )
  const moonSign = todayEnergy.transitMoonSign
    ? SIGN_GUIDANCE[todayEnergy.transitMoonSign]
    : null
  const sunSign = todayEnergy.transitSunSign
    ? SIGN_GUIDANCE[todayEnergy.transitSunSign]
    : null
  const primary = buildPrimaryTransit(todayEnergy.strongestAspect)
  const moonTransit = TRANSIT_PLANET_GUIDANCE.Moon
  const sunTransit = TRANSIT_PLANET_GUIDANCE.Sun

  const mood = primary
    ? section(
        'Mood',
        `${moonSign?.atmosphere ?? moonTransit.focus} ${primary.dynamic.summary}`,
        [moonSign?.id ?? moonTransit.id, primary.dynamic.id]
      )
    : section(
        'Mood',
        `${moonSign?.atmosphere ?? moonTransit.focus} ${
          moonSign?.constructive ?? moonTransit.constructive
        }`,
        [moonSign?.id ?? moonTransit.id]
      )

  const warning = primary
    ? section(
        'Watch for',
        `${primary.dynamic.warningModifier} ${primary.transit.watchFor} ${primary.target.watchFor}`,
        [primary.dynamic.id, primary.transit.id, primary.target.id]
      )
    : section(
        'Watch for',
        moonSign?.watchFor ??
          'A passing mood may feel more urgent than the situation requires.',
        [moonSign?.id ?? moonTransit.id]
      )

  const opportunity = primary
    ? section(
        'Opportunity',
        `${primary.dynamic.opportunityModifier} ${primary.transit.constructive} ${primary.target.constructive}`,
        [primary.dynamic.id, primary.transit.id, primary.target.id]
      )
    : section(
        'Opportunity',
        `${sunSign?.opportunity ?? sunTransit.constructive} ${
          sunSign?.constructive ?? ''
        }`.trim(),
        [sunSign?.id ?? sunTransit.id]
      )

  const transitSummary = primary
    ? section(
        'Transit summary',
        `${primary.aspect.transit.name} ${
          ASPECT_LABELS[primary.aspect.type]
        } natal ${primary.aspect.natal.name} within ${primary.aspect.orb.toFixed(
          2
        )}°. This brings ${primary.transit.focus} into contact with ${
          primary.target.activation
        }.`,
        primary.result.sourceIds
      )
    : section(
        'Transit summary',
        'No tight personal transit aspect is emphasized at this evaluation time. The Sun and Moon sign guidance can still offer a reflective daily focus.',
        [
          moonSign?.id ?? moonTransit.id,
          sunSign?.id ?? sunTransit.id,
        ]
      )

  const activeRecords = [
    moonSign ?? moonTransit,
    sunSign ?? sunTransit,
    ...(primary
      ? [primary.transit, primary.target, primary.dynamic]
      : []),
  ]
  const activeTags = unique(
    activeRecords.flatMap((record) => [...record.tags])
  ) as GuidanceTag[]
  const activeSourceIds = unique(
    activeRecords.map((record) => record.id)
  )
  const selectionSeed = [
    date,
    todayEnergy.transitMoonSign ?? 'unknown-moon',
    todayEnergy.transitSunSign ?? 'unknown-sun',
    primary
      ? `${primary.result.transitPlanet}:${primary.result.aspect}:${primary.result.natalPlanet}`
      : 'no-aspect',
    chartSeed(input),
  ].join('|')

  const reflectionPrompt: ReflectionPrompt = selectDeterministically(
    REFLECTION_PROMPTS,
    activeTags,
    activeSourceIds,
    `${selectionSeed}|prompt`
  )
  const suggestedPractice: SuggestedPractice = selectDeterministically(
    SUGGESTED_PRACTICES,
    activeTags,
    activeSourceIds,
    `${selectionSeed}|practice`
  )
  const sourceIds = unique([
    ...mood.sourceIds,
    ...warning.sourceIds,
    ...opportunity.sourceIds,
    ...transitSummary.sourceIds,
    reflectionPrompt.id,
    ...reflectionPrompt.sourceIds,
    suggestedPractice.id,
    ...suggestedPractice.sourceIds,
  ])

  return {
    schemaVersion: 1,
    source: 'deterministic',
    date,
    evaluatedAt,
    transitSunSign: todayEnergy.transitSunSign,
    transitMoonSign: todayEnergy.transitMoonSign,
    primaryTransit: primary?.result ?? null,
    tone: primary?.result.tone ?? moonSign?.tone ?? 'integrative',
    mood,
    warning,
    opportunity,
    transitSummary,
    reflectionPrompt,
    suggestedPractice,
    sourceIds,
  }
}
