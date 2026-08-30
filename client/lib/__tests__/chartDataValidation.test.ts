import {
  parseChartData,
  validateChartData,
} from '../chartDataValidation'
import {
  CURRENT_CHART_CALCULATION_VERSION,
  CURRENT_CHART_SCHEMA_VERSION,
} from '../chartDataVersions'

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
  it('accepts unversioned valid chart data as legacy V1', () => {
    expect(validateChartData(validChartData)).toEqual({
      status: 'valid',
      compatibility: 'legacy-v1',
      data: validChartData,
    })
    expect(parseChartData(validChartData)).toEqual(validChartData)
  })

  it('accepts explicit current schema and calculation versions', () => {
    const currentChartData = {
      ...validChartData,
      schema_version: CURRENT_CHART_SCHEMA_VERSION,
      calculation_version: CURRENT_CHART_CALCULATION_VERSION,
    }

    expect(validateChartData(currentChartData)).toEqual({
      status: 'valid',
      compatibility: 'current',
      data: currentChartData,
    })
    expect(parseChartData(currentChartData)).toEqual(currentChartData)
  })

  it('detects an unsupported future schema version before shape parsing', () => {
    const futureChartData = {
      schema_version: CURRENT_CHART_SCHEMA_VERSION + 1,
      calculation_version: CURRENT_CHART_CALCULATION_VERSION,
    }
    const result = validateChartData(futureChartData)

    expect(result).toEqual({
      status: 'unsupported',
      field: 'schema_version',
      schemaVersion: CURRENT_CHART_SCHEMA_VERSION + 1,
      calculationVersion: CURRENT_CHART_CALCULATION_VERSION,
    })
    expect(parseChartData(futureChartData)).toBeNull()
  })

  it('detects an unsupported future calculation version', () => {
    const futureChartData = {
      ...validChartData,
      schema_version: CURRENT_CHART_SCHEMA_VERSION,
      calculation_version: CURRENT_CHART_CALCULATION_VERSION + 1,
    }

    expect(validateChartData(futureChartData)).toEqual({
      status: 'unsupported',
      field: 'calculation_version',
      schemaVersion: CURRENT_CHART_SCHEMA_VERSION,
      calculationVersion: CURRENT_CHART_CALCULATION_VERSION + 1,
    })
    expect(parseChartData(futureChartData)).toBeNull()
  })

  it.each([
    ['string schema version', '1', CURRENT_CHART_CALCULATION_VERSION],
    ['zero schema version', 0, CURRENT_CHART_CALCULATION_VERSION],
    ['negative calculation version', CURRENT_CHART_SCHEMA_VERSION, -1],
    ['NaN calculation version', CURRENT_CHART_SCHEMA_VERSION, Number.NaN],
    [
      'infinite calculation version',
      CURRENT_CHART_SCHEMA_VERSION,
      Number.POSITIVE_INFINITY,
    ],
  ])('rejects malformed version metadata: %s', (_, schema, calculation) => {
    expect(
      validateChartData({
        ...validChartData,
        schema_version: schema,
        calculation_version: calculation,
      })
    ).toEqual({ status: 'invalid', reason: 'malformed-version' })
  })

  it('rejects partial explicit version metadata', () => {
    expect(
      validateChartData({
        ...validChartData,
        schema_version: CURRENT_CHART_SCHEMA_VERSION,
      })
    ).toEqual({ status: 'invalid', reason: 'malformed-version' })
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
