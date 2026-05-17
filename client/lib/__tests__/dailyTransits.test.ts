import {
  computeNatalPlanets,
  computeTransitPlanets,
  type PlanetPos,
} from '../astro'
import {
  buildTodayEnergy,
  findDailyTransitAspects,
  findStrongestDailyTransitAspect,
} from '../dailyTransits'
import { getAspectMeaning, zodiacNameFromLongitude } from '../lexicon'

const FIXED_DATE = new Date('2026-05-17T12:00:00.000Z')

function planet(name: string, lon: number): PlanetPos {
  return {
    name,
    lon: ((lon % 360) + 360) % 360,
  }
}

function findNoAspectLongitude(transitPlanets: PlanetPos[]): number {
  for (let lon = 0; lon < 360; lon += 0.25) {
    const candidate = Number(lon.toFixed(2))
    const aspects = findDailyTransitAspects(
      [planet('NoAspect', candidate)],
      transitPlanets
    )

    if (aspects.length === 0) return candidate
  }

  throw new Error('Could not find a no-aspect test longitude')
}

describe('computeTransitPlanets', () => {
  it('returns deterministic PlanetPos-like transit positions for a fixed date', () => {
    const transitPlanets = computeTransitPlanets(FIXED_DATE)

    expect(transitPlanets).toEqual(computeNatalPlanets(FIXED_DATE))
    expect(transitPlanets).toHaveLength(10)
    expect(transitPlanets.map((planet) => planet.name)).toEqual(
      expect.arrayContaining(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'])
    )

    transitPlanets.forEach((transitPlanet) => {
      expect(transitPlanet).toEqual({
        name: expect.any(String),
        lon: expect.any(Number),
      })
      expect(transitPlanet.lon).toBeGreaterThanOrEqual(0)
      expect(transitPlanet.lon).toBeLessThan(360)
    })
  })
})

describe('daily transit helpers', () => {
  it('returns transit-to-natal aspects only with separated identities', () => {
    const transitPlanets = [
      planet('Moon', 0),
      planet('Sun', 90),
      planet('Mercury', 200),
      planet('Pluto', 0),
    ]
    const natalPlanets = [planet('Moon', 0), planet('Mars', 45)]

    const aspects = findDailyTransitAspects(natalPlanets, transitPlanets)

    expect(aspects).toHaveLength(2)
    expect(
      aspects.map(
        (aspect) =>
          `${aspect.transit.name}-${aspect.type}-${aspect.natal.name}`
      )
    ).toEqual(['Moon-conj-Moon', 'Sun-square-Moon'])
    expect(
      aspects.every(
        (aspect) =>
          aspect.transit.kind === 'transit' &&
          aspect.natal.kind === 'natal' &&
          aspect.transit.id.startsWith('transit:') &&
          aspect.natal.id.startsWith('natal:')
      )
    ).toBe(true)
    expect(aspects[0].transit.id).not.toBe(aspects[0].natal.id)
    expect(
      aspects.some((aspect) => String(aspect.transit.name) === 'Pluto')
    ).toBe(false)
  })

  it('chooses the lowest orb among allowed fast transit aspects', () => {
    const transitPlanets = [
      planet('Moon', 10),
      planet('Mars', 200),
      planet('Pluto', 10.9),
    ]
    const natalPlanets = [planet('Sun', 10.9), planet('Venus', 290.25)]

    const strongest = findStrongestDailyTransitAspect(
      natalPlanets,
      transitPlanets
    )

    expect(strongest).toEqual(
      expect.objectContaining({
        type: 'square',
        orb: 0.25,
      })
    )
    expect(strongest?.transit.name).toBe('Mars')
    expect(strongest?.natal.name).toBe('Venus')
  })

  it('builds today energy with Sun/Moon signs and generic aspect meaning', () => {
    const transitPlanets = computeTransitPlanets(FIXED_DATE)
    const transitSun = transitPlanets.find((item) => item.name === 'Sun')
    const transitMoon = transitPlanets.find((item) => item.name === 'Moon')

    if (!transitSun || !transitMoon) {
      throw new Error('Expected fixed-date transit Sun and Moon')
    }

    const energy = buildTodayEnergy(
      [planet('Mars', transitMoon.lon + 90)],
      FIXED_DATE
    )

    expect(energy.transitSunSign).toBe(zodiacNameFromLongitude(transitSun.lon))
    expect(energy.transitMoonSign).toBe(
      zodiacNameFromLongitude(transitMoon.lon)
    )
    expect(energy.strongestAspect).toEqual(
      expect.objectContaining({
        type: 'square',
        orb: 0,
        aspectMeaning: getAspectMeaning('square')?.short,
      })
    )
    expect(energy.strongestAspect?.transit.name).toBe('Moon')
    expect(energy.strongestAspect?.natal.name).toBe('Mars')
  })

  it('returns a null strongestAspect when no allowed transit aspect exists', () => {
    const transitPlanets = computeTransitPlanets(FIXED_DATE)
    const noAspectLongitude = findNoAspectLongitude(transitPlanets)
    const energy = buildTodayEnergy(
      [planet('NoAspect', noAspectLongitude)],
      FIXED_DATE
    )

    expect(energy.transitSunSign).not.toBeNull()
    expect(energy.transitMoonSign).not.toBeNull()
    expect(energy.strongestAspect).toBeNull()
  })
})
