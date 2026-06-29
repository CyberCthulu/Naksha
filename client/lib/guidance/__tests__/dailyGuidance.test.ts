import {
  computeTransitPlanets,
  type PlanetPos,
} from '../../astro'
import { findDailyTransitAspects } from '../../dailyTransits'
import {
  ASPECT_DYNAMIC_GUIDANCE,
  HOUSE_GUIDANCE,
  NATAL_TARGET_GUIDANCE,
  REFLECTION_PROMPTS,
  SIGN_GUIDANCE,
  SUGGESTED_PRACTICES,
  TRANSIT_PLANET_GUIDANCE,
} from '../../lexicon/guidance'
import { buildDailyGuidance, type DailyGuidance } from '../index'

const FIXED_DATE = new Date('2026-05-17T12:00:00.000Z')

function planet(name: string, lon: number): PlanetPos {
  return {
    name,
    lon: ((lon % 360) + 360) % 360,
  }
}

function transitLongitude(name: string): number {
  const transit = computeTransitPlanets(FIXED_DATE).find(
    (item) => item.name === name
  )

  if (!transit) throw new Error(`Missing fixed-date ${name} transit`)
  return transit.lon
}

function chartForMoonAspect(
  natalPlanet: string,
  angle: number
): PlanetPos[] {
  return [planet(natalPlanet, transitLongitude('Moon') + angle)]
}

function chartWithoutTransitAspects(): PlanetPos[] {
  const transits = computeTransitPlanets(FIXED_DATE)

  for (let lon = 0; lon < 360; lon += 0.25) {
    const candidate = planet('Pluto', lon)
    if (findDailyTransitAspects([candidate], transits).length === 0) {
      return [candidate]
    }
  }

  throw new Error('Could not find a no-aspect chart fixture')
}

function expectCompleteGuidance(guidance: DailyGuidance) {
  expect(guidance.schemaVersion).toBe(1)
  expect(guidance.source).toBe('deterministic')
  expect(guidance.date).toBe('2026-05-17')
  expect(guidance.evaluatedAt).toBe(FIXED_DATE.toISOString())
  expect(guidance.transitSunSign).not.toBeNull()
  expect(guidance.transitMoonSign).not.toBeNull()
  expect(guidance.mood.body).not.toHaveLength(0)
  expect(guidance.warning.body).not.toHaveLength(0)
  expect(guidance.opportunity.body).not.toHaveLength(0)
  expect(guidance.transitSummary.body).not.toHaveLength(0)
  expect(guidance.reflectionPrompt.prompt).not.toHaveLength(0)
  expect(guidance.suggestedPractice.steps.length).toBeGreaterThan(0)
  expect(guidance.sourceIds.length).toBeGreaterThan(0)
}

describe('buildDailyGuidance', () => {
  it('returns deterministic output for a fixed chart and evaluation date', () => {
    const input = {
      natalPlanets: chartForMoonAspect('Mars', 90),
      evaluatedAt: FIXED_DATE,
    }

    expect(buildDailyGuidance(input)).toEqual(buildDailyGuidance(input))
  })

  it('builds a complete guidance object around the strongest aspect', () => {
    const guidance = buildDailyGuidance({
      natalPlanets: chartForMoonAspect('Mars', 90),
      evaluatedAt: FIXED_DATE,
    })

    expectCompleteGuidance(guidance)
    expect(guidance.primaryTransit).toEqual(
      expect.objectContaining({
        transitPlanet: 'Moon',
        natalPlanet: 'Mars',
        aspect: 'square',
        orb: 0,
        tone: 'challenging',
      })
    )
    expect(guidance.transitSummary.body).toContain(
      'Moon squares natal Mars'
    )
  })

  it('returns complete Moon and Sun guidance when no aspect qualifies', () => {
    const guidance = buildDailyGuidance({
      natalPlanets: chartWithoutTransitAspects(),
      evaluatedAt: FIXED_DATE,
    })

    expectCompleteGuidance(guidance)
    expect(guidance.primaryTransit).toBeNull()
    expect(guidance.transitSummary.body).toContain(
      'No tight personal transit aspect is emphasized'
    )
    expect(guidance.mood.sourceIds).toEqual([
      `guidance.sign.${guidance.transitMoonSign?.toLowerCase()}`,
    ])
    expect(guidance.opportunity.sourceIds).toEqual([
      `guidance.sign.${guidance.transitSunSign?.toLowerCase()}`,
    ])
  })

  it('uses supportive aspect guidance for a trine opportunity', () => {
    const guidance = buildDailyGuidance({
      natalPlanets: chartForMoonAspect('Venus', 120),
      evaluatedAt: FIXED_DATE,
    })

    expect(guidance.primaryTransit?.aspect).toBe('trine')
    expect(guidance.tone).toBe('supportive')
    expect(guidance.opportunity.body).toContain(
      ASPECT_DYNAMIC_GUIDANCE.trine.opportunityModifier
    )
  })

  it('uses challenging aspect guidance for square and opposition warnings', () => {
    const square = buildDailyGuidance({
      natalPlanets: chartForMoonAspect('Mars', 90),
      evaluatedAt: FIXED_DATE,
    })
    const opposition = buildDailyGuidance({
      natalPlanets: chartForMoonAspect('Saturn', 180),
      evaluatedAt: FIXED_DATE,
    })

    expect(square.tone).toBe('challenging')
    expect(square.warning.body).toContain(
      ASPECT_DYNAMIC_GUIDANCE.square.warningModifier
    )
    expect(opposition.primaryTransit?.aspect).toBe('opp')
    expect(opposition.tone).toBe('challenging')
    expect(opposition.warning.body).toContain(
      ASPECT_DYNAMIC_GUIDANCE.opp.warningModifier
    )
  })

  it('selects prompts and practices stably without using wall-clock time', () => {
    const input = {
      natalPlanets: chartForMoonAspect('Sun', 0),
      evaluatedAt: FIXED_DATE,
    }

    jest.useFakeTimers()
    try {
      jest.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))
      const first = buildDailyGuidance(input)
      jest.setSystemTime(new Date('2040-12-31T23:59:59.000Z'))
      const second = buildDailyGuidance(input)

      expect(first).toEqual(second)
      expect(first.tone).toBe('intensifying')
      expect(first.reflectionPrompt.id).toBe(second.reflectionPrompt.id)
      expect(first.suggestedPractice.id).toBe(
        second.suggestedPractice.id
      )
    } finally {
      jest.useRealTimers()
    }
  })

  it('uses known guidance source IDs and does not mutate chart input', () => {
    const natalPlanets = chartForMoonAspect('Mercury', 60)
    const before = JSON.parse(JSON.stringify(natalPlanets))
    const guidance = buildDailyGuidance({
      natalPlanets,
      evaluatedAt: FIXED_DATE,
    })
    const validIds = new Set([
      ...Object.values(TRANSIT_PLANET_GUIDANCE).map((item) => item.id),
      ...Object.values(NATAL_TARGET_GUIDANCE).map((item) => item.id),
      ...Object.values(ASPECT_DYNAMIC_GUIDANCE).map((item) => item.id),
      ...Object.values(SIGN_GUIDANCE).map((item) => item.id),
      ...Object.values(HOUSE_GUIDANCE).map((item) => item.id),
      ...REFLECTION_PROMPTS.map((item) => item.id),
      ...SUGGESTED_PRACTICES.map((item) => item.id),
    ])

    expect(natalPlanets).toEqual(before)
    expect(guidance.sourceIds.every((id) => validIds.has(id))).toBe(true)
  })
})
