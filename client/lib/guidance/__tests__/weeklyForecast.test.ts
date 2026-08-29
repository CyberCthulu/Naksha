import { computeTransitPlanets, type PlanetPos } from '../../astro'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  HOUSE_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  REFLECTION_PROMPTS,
  SIGN_GUIDANCE,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
} from '../../lexicon/guidance'
import {
  buildWeeklyForecast,
  type BuildWeeklyForecastInput,
} from '../index'

const EVALUATED_AT = new Date('2026-05-14T18:00:00.000Z')
const TIME_ZONE = 'America/Los_Angeles'
const NATAL_PLANETS: PlanetPos[] = [
  { name: 'Sun', lon: 54 },
  { name: 'Moon', lon: 112 },
  { name: 'Mercury', lon: 18 },
  { name: 'Venus', lon: 201 },
  { name: 'Mars', lon: 275 },
  { name: 'Jupiter', lon: 330 },
  { name: 'Saturn', lon: 146 },
  { name: 'Uranus', lon: 72 },
  { name: 'Neptune', lon: 244 },
  { name: 'Pluto', lon: 305 },
]

function input(
  overrides: Partial<BuildWeeklyForecastInput> = {}
): BuildWeeklyForecastInput {
  return {
    natalPlanets: NATAL_PLANETS.map((planet) => ({ ...planet })),
    evaluatedAt: EVALUATED_AT,
    timeZone: TIME_ZONE,
    ...overrides,
  }
}

function transitLongitude(name: string, evaluatedAt: Date): number {
  const planet = computeTransitPlanets(evaluatedAt).find(
    (candidate) => candidate.name === name
  )

  if (!planet) throw new Error(`Missing transit planet ${name}`)
  return planet.lon
}

function weeklyRelevantNatalPlanets({
  includeMoonEvent = false,
}: {
  includeMoonEvent?: boolean
} = {}): PlanetPos[] {
  const midweekNoon = new Date('2026-05-13T19:00:00.000Z')
  const mondayNoon = new Date('2026-05-11T19:00:00.000Z')

  return [
    {
      name: 'Sun',
      lon: transitLongitude('Jupiter', midweekNoon),
    },
    {
      name: 'Moon',
      lon: transitLongitude('Saturn', midweekNoon),
    },
    ...(includeMoonEvent
      ? [
          {
            name: 'Mars',
            lon: transitLongitude('Moon', mondayNoon),
          },
        ]
      : []),
  ]
}

describe('buildWeeklyForecast', () => {
  it('returns deterministic output for a fixed chart and local week', () => {
    const forecastInput = input()

    expect(buildWeeklyForecast(forecastInput)).toEqual(
      buildWeeklyForecast(forecastInput)
    )
  })

  it('builds exactly seven Monday-through-Sunday local day themes', () => {
    const forecast = buildWeeklyForecast(input())

    expect(forecast.startDate).toBe('2026-05-11')
    expect(forecast.endDate).toBe('2026-05-17')
    expect(forecast.timeZone).toBe(TIME_ZONE)
    expect(forecast.evaluatedAt).toBe(EVALUATED_AT.toISOString())
    expect(forecast.dailyThemes).toHaveLength(7)
    expect(forecast.dailyThemes.map((day) => day.date)).toEqual([
      '2026-05-11',
      '2026-05-12',
      '2026-05-13',
      '2026-05-14',
      '2026-05-15',
      '2026-05-16',
      '2026-05-17',
    ])
    forecast.dailyThemes.forEach((day) => {
      expect(day.title.trim()).not.toBe('')
      expect(day.summary.trim()).not.toBe('')
      expect(day.sourceIds.length).toBeGreaterThan(0)
    })
  })

  it('evaluates each snapshot at local noon across a DST boundary', () => {
    const forecast = buildWeeklyForecast(
      input({
        evaluatedAt: new Date('2026-03-05T18:00:00.000Z'),
      })
    )

    expect(forecast.startDate).toBe('2026-03-02')
    expect(forecast.endDate).toBe('2026-03-08')
    expect(forecast.dailyThemes[0].evaluatedAt).toBe(
      '2026-03-02T20:00:00.000Z'
    )
    expect(forecast.dailyThemes[6].evaluatedAt).toBe(
      '2026-03-08T19:00:00.000Z'
    )
  })

  it('returns bounded, non-empty themes, prompts, and practices without duplicate IDs', () => {
    const forecast = buildWeeklyForecast(input())
    const promptIds = forecast.journalPrompts.map(
      (prompt) => prompt.id
    )
    const practiceIds = forecast.suggestions.map(
      (practice) => practice.id
    )

    expect(forecast.weeklyThemes.length).toBeGreaterThan(0)
    expect(forecast.weeklyThemes.length).toBeLessThanOrEqual(3)
    expect(forecast.journalPrompts.length).toBeGreaterThan(0)
    expect(forecast.journalPrompts.length).toBeLessThanOrEqual(3)
    expect(forecast.suggestions.length).toBeGreaterThan(0)
    expect(forecast.suggestions.length).toBeLessThanOrEqual(3)
    expect(new Set(promptIds).size).toBe(promptIds.length)
    expect(new Set(practiceIds).size).toBe(practiceIds.length)
  })

  it('includes eligible Jupiter and Saturn events in weekly highlights', () => {
    const forecast = buildWeeklyForecast(
      input({
        natalPlanets: weeklyRelevantNatalPlanets(),
      })
    )

    expect(forecast.strongestTransits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transitPlanet: 'Jupiter',
          aspect: 'conj',
          natalPlanet: 'Sun',
        }),
        expect.objectContaining({
          transitPlanet: 'Saturn',
          aspect: 'conj',
          natalPlanet: 'Moon',
        }),
      ])
    )
  })

  it('ranks weekly-relevant events ahead of the Moon and caps Moon highlights', () => {
    const forecast = buildWeeklyForecast(
      input({
        natalPlanets: weeklyRelevantNatalPlanets({
          includeMoonEvent: true,
        }),
      })
    )
    const slowPlanetIndex = forecast.strongestTransits.findIndex(
      (transit) =>
        transit.transitPlanet === 'Jupiter' ||
        transit.transitPlanet === 'Saturn'
    )
    const moonIndexes = forecast.strongestTransits.flatMap(
      (transit, index) =>
        transit.transitPlanet === 'Moon' ? [index] : []
    )

    expect(slowPlanetIndex).toBe(0)
    expect(moonIndexes.length).toBeLessThanOrEqual(1)
    if (moonIndexes.length > 0) {
      expect(slowPlanetIndex).toBeLessThan(moonIndexes[0])
    }
  })

  it('deduplicates persistent slow events and keeps their minimum-orb snapshot', () => {
    const forecast = buildWeeklyForecast(
      input({ natalPlanets: weeklyRelevantNatalPlanets() })
    )
    const highlightKeys = forecast.strongestTransits.map(
      (transit) =>
        `${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}`
    )
    const jupiterEvent = forecast.strongestTransits.find(
      (transit) =>
        transit.transitPlanet === 'Jupiter' &&
        transit.aspect === 'conj' &&
        transit.natalPlanet === 'Sun'
    )

    expect(new Set(highlightKeys).size).toBe(highlightKeys.length)
    expect(forecast.strongestTransits.length).toBeLessThanOrEqual(5)
    expect(jupiterEvent).toEqual(
      expect.objectContaining({
        date: '2026-05-13',
        orb: 0,
      })
    )
    expect(jupiterEvent?.activeDays).toBeGreaterThan(1)
    expect(
      forecast.strongestTransits.filter(
        (transit) => transit.transitPlanet === 'Jupiter'
      ).length
    ).toBeLessThanOrEqual(2)
  })

  it('sorts highlights deterministically by weekly significance', () => {
    const forecastInput = input({
      natalPlanets: weeklyRelevantNatalPlanets({
        includeMoonEvent: true,
      }),
    })
    const first = buildWeeklyForecast(forecastInput)
    const second = buildWeeklyForecast(forecastInput)
    const scores = first.strongestTransits.map(
      (transit) => transit.significanceScore
    )

    expect(first.strongestTransits).toEqual(second.strongestTransits)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('derives weekly themes and reflection from the strongest weekly pattern', () => {
    const forecastInput = input({
      natalPlanets: weeklyRelevantNatalPlanets(),
    })
    const first = buildWeeklyForecast(forecastInput)
    const second = buildWeeklyForecast(forecastInput)
    const topTransit = first.strongestTransits[0]
    const topTheme = first.weeklyThemes[0]

    expect(topTheme.title).toBe(
      `${topTransit.transitPlanet} conjunct natal ${topTransit.natalPlanet}`
    )
    expect(topTheme.body).toContain(
      `${topTransit.activeDays} of 7 sampled days`
    )
    expect(topTheme.sourceIds).toEqual(
      expect.arrayContaining(topTransit.sourceIds)
    )
    expect(topTheme.title).not.toBe('Openings to develop')
    expect(topTheme.title).not.toBe('Adjustments to make')
    expect(first.representativePrompt).toEqual(
      second.representativePrompt
    )
    expect(first.representativePractice).toEqual(
      second.representativePractice
    )
    expect(first.journalPrompts[0]).toEqual(
      first.representativePrompt
    )
    expect(first.suggestions[0]).toEqual(
      first.representativePractice
    )
    expect(
      first.representativePrompt.sourceIds.some((sourceId) =>
        topTransit.sourceIds.includes(sourceId)
      )
    ).toBe(true)
  })

  it('returns a usable background forecast when no personal aspects exist', () => {
    const forecast = buildWeeklyForecast(
      input({ natalPlanets: [] })
    )

    expect(forecast.dailyThemes).toHaveLength(7)
    expect(
      forecast.dailyThemes.every(
        (day) =>
          day.primaryTransit == null &&
          day.title.trim() !== '' &&
          day.summary.trim() !== ''
      )
    ).toBe(true)
    expect(forecast.strongestTransits).toEqual([])
    expect(forecast.weeklyThemes).toHaveLength(1)
    expect(forecast.weeklyThemes[0].body).toContain(
      'guided more by the changing Sun and Moon background tone'
    )
    expect(forecast.journalPrompts.length).toBeGreaterThan(0)
    expect(forecast.suggestions.length).toBeGreaterThan(0)
    expect(forecast.representativePrompt.id).toBe(
      forecast.journalPrompts[0].id
    )
    expect(forecast.representativePractice.id).toBe(
      forecast.suggestions[0].id
    )
  })

  it('does not depend on wall-clock time or mutate its input', () => {
    const forecastInput = input()
    const beforePlanets = JSON.parse(
      JSON.stringify(forecastInput.natalPlanets)
    )

    jest.useFakeTimers()
    try {
      jest.setSystemTime(new Date('2035-01-01T00:00:00.000Z'))
      const first = buildWeeklyForecast(forecastInput)
      jest.setSystemTime(new Date('2045-12-31T23:59:59.000Z'))
      const second = buildWeeklyForecast(forecastInput)

      expect(first).toEqual(second)
    } finally {
      jest.useRealTimers()
    }

    expect(forecastInput.natalPlanets).toEqual(beforePlanets)
    expect(forecastInput.evaluatedAt).toBe(EVALUATED_AT)
  })

  it('uses non-empty source IDs that resolve to deterministic guidance records', () => {
    const forecast = buildWeeklyForecast(input())
    const validIds = new Set([
      ...Object.values(TRANSIT_PLANET_GUIDANCE).map((item) => item.id),
      ...Object.values(NATAL_TARGET_GUIDANCE).map((item) => item.id),
      ...Object.values(ASPECT_DYNAMIC_GUIDANCE).map((item) => item.id),
      ...Object.values(SIGN_GUIDANCE).map((item) => item.id),
      ...Object.values(HOUSE_GUIDANCE).map((item) => item.id),
      ...REFLECTION_PROMPTS.map((item) => item.id),
      ...SUGGESTED_PRACTICES.map((item) => item.id),
    ])

    expect(forecast.sourceIds.length).toBeGreaterThan(0)
    expect(forecast.sourceIds.every((id) => validIds.has(id))).toBe(
      true
    )
  })
})
