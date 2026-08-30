import {
  assignPlanetsToWholeSignHouses,
  computeWholeSignHouses,
} from '../astro'
import { hydrateChartData } from '../chartHydration'
import type { ChartData } from '../charts'
import {
  CURRENT_CHART_CALCULATION_VERSION,
  CURRENT_CHART_SCHEMA_VERSION,
} from '../chartDataVersions'
import { birthToUTC } from '../time'

const CONTEXT = {
  birthDate: '1815-12-10',
  birthTime: '12:00:00',
  timeZone: 'Europe/London',
  birthLat: 51.5072,
  birthLon: -0.1276,
}

function makeChartData(
  overrides: Partial<ChartData> = {}
): ChartData {
  const { jsDate } = birthToUTC(
    CONTEXT.birthDate,
    CONTEXT.birthTime,
    CONTEXT.timeZone
  )
  const houses = computeWholeSignHouses(
    jsDate,
    CONTEXT.birthLat,
    CONTEXT.birthLon
  )
  const planets = [
    { name: 'Sun', lon: 258.2 },
    { name: 'Moon', lon: 120.4 },
  ]

  return {
    meta: {
      name: 'Ada Natal Chart',
      birth_date: CONTEXT.birthDate,
      birth_time: CONTEXT.birthTime,
      time_zone: CONTEXT.timeZone,
      birth_lat: CONTEXT.birthLat,
      birth_lon: CONTEXT.birthLon,
      computed_at: '2026-05-11T00:00:00.000Z',
      instant_utc: '1815-12-10T12:00:00.000Z',
    },
    planets,
    aspects: [],
    houses,
    planet_houses: assignPlanetsToWholeSignHouses(planets, houses),
    ...overrides,
  }
}

describe('hydrateChartData', () => {
  it('preserves valid persisted houses and placements', () => {
    const chartData = makeChartData()

    expect(hydrateChartData({ chartData, ...CONTEXT })).toBe(chartData)
  })

  it('reconstructs missing legacy houses from valid birth context', () => {
    const chartData = makeChartData({
      houses: null,
      planet_houses: null,
    })
    const { jsDate } = birthToUTC(
      CONTEXT.birthDate,
      CONTEXT.birthTime,
      CONTEXT.timeZone
    )
    const expectedHouses = computeWholeSignHouses(
      jsDate,
      CONTEXT.birthLat,
      CONTEXT.birthLon
    )

    const hydrated = hydrateChartData({ chartData, ...CONTEXT })

    expect(hydrated.houses).toEqual(expectedHouses)
    expect(hydrated.planet_houses).toEqual(
      assignPlanetsToWholeSignHouses(chartData.planets, expectedHouses)
    )
    expect(hydrated).not.toHaveProperty('schema_version')
    expect(hydrated).not.toHaveProperty('calculation_version')
  })

  it('preserves explicit version metadata while hydrating houses', () => {
    const chartData = makeChartData({
      schema_version: CURRENT_CHART_SCHEMA_VERSION,
      calculation_version: CURRENT_CHART_CALCULATION_VERSION,
      houses: null,
      planet_houses: null,
    })

    const hydrated = hydrateChartData({ chartData, ...CONTEXT })

    expect(hydrated.schema_version).toBe(CURRENT_CHART_SCHEMA_VERSION)
    expect(hydrated.calculation_version).toBe(
      CURRENT_CHART_CALCULATION_VERSION
    )
  })

  it('leaves missing houses absent without complete coordinates', () => {
    const chartData = makeChartData({
      houses: null,
      planet_houses: null,
    })

    const hydrated = hydrateChartData({
      chartData,
      ...CONTEXT,
      birthLat: null,
    })

    expect(hydrated).toBe(chartData)
    expect(hydrated.houses).toBeNull()
    expect(hydrated.planet_houses).toBeNull()
  })

  it('does not mutate legacy chart input while hydrating it', () => {
    const chartData = makeChartData({
      houses: null,
      planet_houses: null,
    })
    const before = JSON.parse(JSON.stringify(chartData))

    const hydrated = hydrateChartData({ chartData, ...CONTEXT })

    expect(chartData).toEqual(before)
    expect(hydrated).not.toBe(chartData)
  })
})
