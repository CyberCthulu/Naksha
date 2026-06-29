import type { PlanetPos } from '../../astro'
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

  it('deduplicates repeated primary transit keys and retains their lowest orb', () => {
    const forecast = buildWeeklyForecast(
      input({
        natalPlanets: [{ name: 'Sun', lon: 54 }],
      })
    )
    const dailyPrimary = forecast.dailyThemes
      .map((day) =>
        day.primaryTransit
          ? { ...day.primaryTransit, date: day.date }
          : null
      )
      .filter((transit) => transit != null)
    const dailyKeys = dailyPrimary.map(
      (transit) =>
        `${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}`
    )
    const highlightKeys = forecast.strongestTransits.map(
      (transit) =>
        `${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}`
    )

    expect(new Set(dailyKeys).size).toBeLessThan(dailyKeys.length)
    expect(new Set(highlightKeys).size).toBe(highlightKeys.length)
    expect(forecast.strongestTransits.length).toBeLessThanOrEqual(5)

    forecast.strongestTransits.forEach((highlight) => {
      const key = `${highlight.transitPlanet}:${highlight.aspect}:${highlight.natalPlanet}`
      const matchingOrbs = dailyPrimary
        .filter(
          (transit) =>
            `${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}` ===
            key
        )
        .map((transit) => transit.orb)

      expect(highlight.orb).toBe(Math.min(...matchingOrbs))
    })
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
