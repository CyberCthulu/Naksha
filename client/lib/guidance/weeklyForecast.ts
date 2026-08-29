import { DateTime } from 'luxon'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  REFLECTION_PROMPTS,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
  type GuidanceContentRecord,
  type GuidanceTag,
  type ReflectionPrompt,
  type SuggestedPractice,
} from '../lexicon/guidance'
import { buildDailyGuidance } from './dailyGuidance'
import type {
  BuildWeeklyForecastInput,
  DailyGuidance,
  WeeklyDayTheme,
  WeeklyForecast,
  WeeklyTheme,
  WeeklyTransitHighlight,
} from './types'
import {
  buildWeeklyTransitHighlights,
  type WeeklyTransitSnapshot,
} from './weeklyTransitEvents'

const DAYS_PER_WEEK = 7
const MAX_WEEKLY_THEMES = 3
const MAX_PROMPTS = 3
const MAX_PRACTICES = 3

const ASPECT_TITLES = {
  conj: 'conjunct',
  opp: 'opposite',
  trine: 'trine',
  square: 'square',
  sextile: 'sextile',
} as const

type SelectableGuidance = Pick<
  GuidanceContentRecord,
  'id' | 'tags' | 'tone'
> & {
  sourceIds: readonly string[]
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function requireIsoDate(value: string | null): string {
  if (!value) throw new Error('Could not resolve weekly forecast date')
  return value
}

function validateInput(input: BuildWeeklyForecastInput): DateTime {
  if (Number.isNaN(input.evaluatedAt.getTime())) {
    throw new Error('Invalid weekly forecast evaluation date')
  }

  const localEvaluation = DateTime.fromJSDate(input.evaluatedAt, {
    zone: input.timeZone,
  })

  if (!localEvaluation.isValid) {
    throw new Error('Invalid weekly forecast time zone')
  }

  return localEvaluation
}

function buildDayTheme(
  guidance: DailyGuidance,
  localDate: string
): WeeklyDayTheme {
  const primary = guidance.primaryTransit
  const title = primary
    ? `${primary.transitPlanet} ${
        ASPECT_TITLES[primary.aspect]
      } natal ${primary.natalPlanet}`
    : `${guidance.transitMoonSign ?? 'Daily'} Moon background`

  return {
    date: localDate,
    evaluatedAt: guidance.evaluatedAt,
    tone: guidance.tone,
    title,
    summary: primary
      ? guidance.transitSummary.body
      : guidance.mood.body,
    primaryTransit: primary,
    reflectionPrompt: guidance.reflectionPrompt,
    suggestedPractice: guidance.suggestedPractice,
    sourceIds: [...guidance.sourceIds],
  }
}

function transitKey(transit: WeeklyTransitHighlight): string {
  return [
    transit.transitPlanet,
    transit.aspect,
    transit.natalPlanet,
  ].join(':')
}

function themeForTransit(
  transit: WeeklyTransitHighlight
): WeeklyTheme {
  const transitGuidance =
    TRANSIT_PLANET_GUIDANCE[transit.transitPlanet]
  const targetGuidance = NATAL_TARGET_GUIDANCE[transit.natalPlanet]
  const dynamic = ASPECT_DYNAMIC_GUIDANCE[transit.aspect]
  const persistence =
    transit.activeDays > 1
      ? `This pattern remains within a focused orb across ${transit.activeDays} daily snapshots.`
      : 'This pattern is concentrated around one daily snapshot.'

  return {
    title: `${transit.transitPlanet} ${
      ASPECT_TITLES[transit.aspect]
    } natal ${transit.natalPlanet}`,
    body: `${persistence} ${dynamic.summary} It connects ${transitGuidance.focus} with ${targetGuidance.activation}.`,
    tone: transit.tone,
    sourceIds: unique([
      transitGuidance.id,
      targetGuidance.id,
      dynamic.id,
    ]),
  }
}

function aggregateWeeklyThemes(
  dailyThemes: readonly WeeklyDayTheme[],
  transits: readonly WeeklyTransitHighlight[]
): WeeklyTheme[] {
  if (transits.length === 0) {
    return [
      {
        title: 'Background rhythm',
        body: 'No tight personal transit aspect is emphasized in the seven daily snapshots. This week is guided more by the changing Sun and Moon background tone than by concentrated personal transit pressure.',
        tone: 'integrative',
        sourceIds: unique(
          dailyThemes.flatMap((day) => day.sourceIds)
        ),
      },
    ]
  }

  return transits.slice(0, MAX_WEEKLY_THEMES).map(themeForTransit)
}

function stableHash(value: string): number {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function patternRecords(transit: WeeklyTransitHighlight) {
  return [
    TRANSIT_PLANET_GUIDANCE[transit.transitPlanet],
    NATAL_TARGET_GUIDANCE[transit.natalPlanet],
    ASPECT_DYNAMIC_GUIDANCE[transit.aspect],
  ]
}

function selectForWeeklyPattern<T extends SelectableGuidance>(
  records: readonly T[],
  transit: WeeklyTransitHighlight,
  seed: string
): T {
  const pattern = patternRecords(transit)
  const sourceIds = pattern.map((record) => record.id)
  const tags = unique(
    pattern.flatMap((record) => [...record.tags])
  ) as GuidanceTag[]
  const ranked = records.map((record) => {
    const sourceMatches = record.sourceIds.filter((sourceId) =>
      sourceIds.includes(sourceId)
    ).length
    const tagMatches = record.tags.filter((tag) =>
      tags.includes(tag)
    ).length

    return {
      record,
      score:
        sourceMatches * 100 +
        tagMatches * 10 +
        (record.tone === transit.tone ? 1 : 0),
    }
  })
  const highestScore = Math.max(...ranked.map(({ score }) => score))
  const candidates = ranked
    .filter(({ score }) => score === highestScore)
    .map(({ record }) => record)
    .sort((a, b) => a.id.localeCompare(b.id))

  return candidates[stableHash(seed) % candidates.length]
}

function mostFrequentById<T extends { id: string }>(
  values: readonly T[]
): T {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    counts.set(value.id, (counts.get(value.id) ?? 0) + 1)
  })

  return [...values].sort(
    (a, b) =>
      (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
      a.id.localeCompare(b.id)
  )[0]
}

function distinctById<T extends { id: string }>(
  values: readonly T[],
  limit: number
): T[] {
  const seen = new Set<string>()
  const result: T[] = []

  for (const value of values) {
    if (seen.has(value.id)) continue
    seen.add(value.id)
    result.push(value)
    if (result.length === limit) break
  }

  return result
}

function chartSeed(input: BuildWeeklyForecastInput): string {
  return input.natalPlanets
    .map((planet) => `${planet.name}:${planet.lon.toFixed(6)}`)
    .join('|')
}

export function buildWeeklyForecast(
  input: BuildWeeklyForecastInput
): WeeklyForecast {
  const localEvaluation = validateInput(input)
  const weekStart = localEvaluation.startOf('week').startOf('day')
  const snapshots = Array.from(
    { length: DAYS_PER_WEEK },
    (_, index) => {
      const localNoon = weekStart.plus({ days: index }).set({
        hour: 12,
        minute: 0,
        second: 0,
        millisecond: 0,
      })

      return {
        date: requireIsoDate(localNoon.toISODate()),
        evaluatedAt: localNoon.toJSDate(),
      } satisfies WeeklyTransitSnapshot
    }
  )
  const dailyThemes = snapshots.map((snapshot) => {
    const guidance = buildDailyGuidance({
      natalPlanets: input.natalPlanets,
      evaluatedAt: snapshot.evaluatedAt,
      timeZone: input.timeZone,
      orbMode: input.orbMode,
    })

    return buildDayTheme(guidance, snapshot.date)
  })
  const strongest = buildWeeklyTransitHighlights({
    natalPlanets: input.natalPlanets,
    snapshots,
    orbMode: input.orbMode,
  })
  const weeklyThemes = aggregateWeeklyThemes(
    dailyThemes,
    strongest
  )
  const topTransit = strongest[0]
  const selectionSeed = [
    requireIsoDate(weekStart.toISODate()),
    topTransit ? transitKey(topTransit) : 'background-rhythm',
    chartSeed(input),
  ].join('|')
  const representativePrompt: ReflectionPrompt = topTransit
    ? selectForWeeklyPattern(
        REFLECTION_PROMPTS,
        topTransit,
        `${selectionSeed}|prompt`
      )
    : mostFrequentById(
        dailyThemes.map((day) => day.reflectionPrompt)
      )
  const representativePractice: SuggestedPractice = topTransit
    ? selectForWeeklyPattern(
        SUGGESTED_PRACTICES,
        topTransit,
        `${selectionSeed}|practice`
      )
    : mostFrequentById(
        dailyThemes.map((day) => day.suggestedPractice)
      )
  const journalPrompts = distinctById(
    [
      representativePrompt,
      ...dailyThemes.map((day) => day.reflectionPrompt),
    ],
    MAX_PROMPTS
  )
  const suggestions = distinctById(
    [
      representativePractice,
      ...dailyThemes.map((day) => day.suggestedPractice),
    ],
    MAX_PRACTICES
  )
  const sourceIds = unique([
    ...dailyThemes.flatMap((day) => day.sourceIds),
    ...strongest.flatMap((transit) => transit.sourceIds),
    ...weeklyThemes.flatMap((theme) => theme.sourceIds),
    ...journalPrompts.flatMap((prompt) => [
      prompt.id,
      ...prompt.sourceIds,
    ]),
    ...suggestions.flatMap((practice) => [
      practice.id,
      ...practice.sourceIds,
    ]),
    representativePrompt.id,
    ...representativePrompt.sourceIds,
    representativePractice.id,
    ...representativePractice.sourceIds,
  ])

  return {
    schemaVersion: 1,
    source: 'deterministic',
    startDate: requireIsoDate(weekStart.toISODate()),
    endDate: requireIsoDate(
      weekStart.plus({ days: DAYS_PER_WEEK - 1 }).toISODate()
    ),
    timeZone: input.timeZone,
    evaluatedAt: input.evaluatedAt.toISOString(),
    dailyThemes,
    strongestTransits: strongest,
    weeklyThemes,
    suggestions,
    journalPrompts,
    representativePrompt,
    representativePractice,
    sourceIds,
  }
}
