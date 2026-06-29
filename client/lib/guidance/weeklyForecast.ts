import { DateTime } from 'luxon'
import type {
  GuidanceTone,
  ReflectionPrompt,
  SuggestedPractice,
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

const DAYS_PER_WEEK = 7
const MAX_STRONGEST_TRANSITS = 5
const MAX_WEEKLY_THEMES = 3
const MAX_PROMPTS = 3
const MAX_PRACTICES = 3

const TONE_PRIORITY: GuidanceTone[] = [
  'challenging',
  'intensifying',
  'supportive',
  'integrative',
]

const INTENSITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1,
} as const

const ASPECT_TITLES = {
  conj: 'conjunct',
  opp: 'opposite',
  trine: 'trine',
  square: 'square',
  sextile: 'sextile',
} as const

const TONE_COPY: Record<
  GuidanceTone,
  { title: string; body: string }
> = {
  supportive: {
    title: 'Openings to develop',
    body: 'Supportive openings recur this week. Notice what is flowing, then participate with a clear and proportionate step.',
  },
  challenging: {
    title: 'Adjustments to make',
    body: 'Some days emphasize friction or competing needs. Treat that pressure as information and choose practical adjustments over force.',
  },
  intensifying: {
    title: 'Focused energy',
    body: 'Certain themes may feel concentrated this week. Give them deliberate attention without allowing one concern to take over the whole picture.',
  },
  integrative: {
    title: 'Balance and integration',
    body: 'The week favors reflection, balance, and steady integration. Make room for more than one valid need before deciding what comes next.',
  },
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
    : `${
        guidance.transitMoonSign ?? 'Daily'
      } Moon background`

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

function strongestTransits(
  dailyThemes: readonly WeeklyDayTheme[]
): WeeklyTransitHighlight[] {
  const byTransit = new Map<string, WeeklyTransitHighlight>()

  dailyThemes.forEach((day) => {
    if (!day.primaryTransit) return

    const candidate = {
      ...day.primaryTransit,
      sourceIds: [...day.primaryTransit.sourceIds],
      date: day.date,
    }
    const key = transitKey(candidate)
    const existing = byTransit.get(key)

    if (
      !existing ||
      candidate.orb < existing.orb ||
      (candidate.orb === existing.orb &&
        candidate.date < existing.date)
    ) {
      byTransit.set(key, candidate)
    }
  })

  return [...byTransit.values()]
    .sort(
      (a, b) =>
        INTENSITY_WEIGHT[b.intensity] -
          INTENSITY_WEIGHT[a.intensity] ||
        a.orb - b.orb ||
        transitKey(a).localeCompare(transitKey(b)) ||
        a.date.localeCompare(b.date)
    )
    .slice(0, MAX_STRONGEST_TRANSITS)
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

  const toneCounts = new Map<GuidanceTone, number>()
  dailyThemes.forEach((day) => {
    toneCounts.set(day.tone, (toneCounts.get(day.tone) ?? 0) + 1)
  })

  return [...toneCounts.entries()]
    .sort(
      ([toneA, countA], [toneB, countB]) =>
        countB - countA ||
        TONE_PRIORITY.indexOf(toneA) -
          TONE_PRIORITY.indexOf(toneB)
    )
    .slice(0, MAX_WEEKLY_THEMES)
    .map(([tone]) => ({
      ...TONE_COPY[tone],
      tone,
      sourceIds: unique(
        dailyThemes
          .filter((day) => day.tone === tone)
          .flatMap((day) => day.sourceIds)
      ),
    }))
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

export function buildWeeklyForecast(
  input: BuildWeeklyForecastInput
): WeeklyForecast {
  const localEvaluation = validateInput(input)
  const weekStart = localEvaluation.startOf('week').startOf('day')
  const dailyThemes = Array.from(
    { length: DAYS_PER_WEEK },
    (_, index) => {
      const localNoon = weekStart.plus({ days: index }).set({
        hour: 12,
        minute: 0,
        second: 0,
        millisecond: 0,
      })
      const localDate = requireIsoDate(localNoon.toISODate())
      const guidance = buildDailyGuidance({
        natalPlanets: input.natalPlanets,
        evaluatedAt: localNoon.toJSDate(),
        orbMode: input.orbMode,
      })

      return buildDayTheme(guidance, localDate)
    }
  )
  const strongest = strongestTransits(dailyThemes)
  const weeklyThemes = aggregateWeeklyThemes(
    dailyThemes,
    strongest
  )
  const journalPrompts: ReflectionPrompt[] = distinctById(
    dailyThemes.map((day) => day.reflectionPrompt),
    MAX_PROMPTS
  )
  const suggestions: SuggestedPractice[] = distinctById(
    dailyThemes.map((day) => day.suggestedPractice),
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
    sourceIds,
  }
}
