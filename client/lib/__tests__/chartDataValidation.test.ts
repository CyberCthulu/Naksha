import { parseChartData } from '../chartDataValidation'

const validChartData = {
  meta: {
    name: 'Ada Natal Chart',
    birth_date: '1815-12-10',
    birth_time: '12:00:00',
    time_zone: 'Europe/London',
    birth_lat: 51.5072,
    birth_lon: -0.1276,
    computed_at: '2026-05-11T00:00:00.000Z',
    instant_utc: '1815-12-10T12:00:00.000Z',
  },
  planets: [{ name: 'Sun', lon: 258.2 }],
  aspects: [{ a: 'Sun', b: 'Moon', type: 'trine', orb: 1.5 }],
  houses: [{ house: 1, lon: 240 }],
  planet_houses: [{ name: 'Sun', house: 1 }],
}

describe('parseChartData', () => {
  it('parses valid chart data', () => {
    expect(parseChartData(validChartData)).toEqual(validChartData)
  })

  it('accepts null coordinate and house fields', () => {
    const parsed = parseChartData({
      ...validChartData,
      meta: {
        ...validChartData.meta,
        birth_lat: null,
        birth_lon: null,
      },
      houses: null,
      planet_houses: null,
    })

    expect(parsed?.meta.birth_lat).toBeNull()
    expect(parsed?.houses).toBeNull()
    expect(parsed?.planet_houses).toBeNull()
  })

  it('returns null for malformed chart data', () => {
    expect(parseChartData(null)).toBeNull()
    expect(parseChartData({ ...validChartData, meta: null })).toBeNull()
    expect(
      parseChartData({
        ...validChartData,
        planets: [{ name: 'Sun', lon: '258.2' }],
      })
    ).toBeNull()
    expect(
      parseChartData({
        ...validChartData,
        aspects: [{ a: 'Sun', b: 'Moon', type: 'invalid', orb: 1 }],
      })
    ).toBeNull()
    expect(
      parseChartData({
        ...validChartData,
        houses: [{ house: 13, lon: 240 }],
      })
    ).toBeNull()
    expect(
      parseChartData({
        ...validChartData,
        planet_houses: [{ name: 'Sun', house: 0 }],
      })
    ).toBeNull()
  })
})
