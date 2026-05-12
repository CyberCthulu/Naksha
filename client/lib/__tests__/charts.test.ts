import supabase from '../supabase'
import {
  buildChartData,
  saveChart,
  type ChartData,
  type SaveChartInput,
} from '../charts'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
  },
}))

const CANONICAL_CHART_IDENTITY =
  'user_id,birth_date,birth_time,time_zone,birth_lat,birth_lon'

const CHART_SELECT =
  'id,user_id,name,chart_data,birth_date,birth_time,time_zone,birth_lat,birth_lon,created_at,updated_at'

function makeChartData(): ChartData {
  return {
    meta: {
      name: 'Test Natal Chart',
      birth_date: '1990-01-01',
      birth_time: '12:34:00',
      time_zone: 'America/Los_Angeles',
      birth_lat: 37.7749,
      birth_lon: -122.4194,
      computed_at: '2026-05-11T00:00:00.000Z',
      instant_utc: '1990-01-01T20:34:00.000Z',
    },
    planets: [{ name: 'Sun', lon: 280 }],
    aspects: [{ a: 'Sun', b: 'Moon', type: 'trine', orb: 1.5 }],
    houses: [{ house: 1, lon: 270 }],
    planet_houses: [{ name: 'Sun', house: 1 }],
  }
}

function makeSaveInput(
  overrides: Partial<SaveChartInput> = {}
): SaveChartInput {
  const chartData = makeChartData()

  return {
    name: chartData.meta.name,
    birth_date: chartData.meta.birth_date,
    birth_time: chartData.meta.birth_time,
    time_zone: chartData.meta.time_zone,
    birth_lat: chartData.meta.birth_lat,
    birth_lon: chartData.meta.birth_lon,
    chart_data: chartData,
    ...overrides,
  }
}

function mockChartUpsert({
  data = {
    id: 1,
    user_id: 'user-1',
    ...makeSaveInput(),
    created_at: '2026-05-11T00:00:00.000Z',
    updated_at: null,
  },
  error = null,
}: {
  data?: unknown
  error?: unknown
} = {}) {
  const single = jest.fn().mockResolvedValue({ data, error })
  const select = jest.fn(() => ({ single }))
  const upsert = jest.fn(() => ({ select }))
  const from = supabase.from as unknown as jest.Mock

  from.mockReturnValue({ upsert })

  return { upsert, select, single, data, error }
}

describe('buildChartData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns chart meta, planets, and aspects for valid input', () => {
    const chart = buildChartData({
      name: 'Test Natal Chart',
      birth_date: '1990-01-01',
      birth_time: '12:34:00',
      time_zone: 'America/Los_Angeles',
      birth_lat: 37.7749,
      birth_lon: -122.4194,
    })

    expect(chart.meta).toEqual(
      expect.objectContaining({
        name: 'Test Natal Chart',
        birth_date: '1990-01-01',
        birth_time: '12:34:00',
        time_zone: 'America/Los_Angeles',
        birth_lat: 37.7749,
        birth_lon: -122.4194,
      })
    )
    expect(typeof chart.meta.computed_at).toBe('string')
    expect(typeof chart.meta.instant_utc).toBe('string')
    expect(chart.planets.length).toBeGreaterThan(0)
    expect(chart.planets[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        lon: expect.any(Number),
      })
    )
    expect(Array.isArray(chart.aspects)).toBe(true)
  })

  it('returns houses and planet_houses when coordinates are present', () => {
    const chart = buildChartData({
      name: 'Test Natal Chart',
      birth_date: '1990-01-01',
      birth_time: '12:34:00',
      time_zone: 'America/Los_Angeles',
      birth_lat: 37.7749,
      birth_lon: -122.4194,
    })

    expect(chart.houses).not.toBeNull()
    expect(chart.houses).toHaveLength(12)
    expect(chart.houses?.[0]).toEqual(
      expect.objectContaining({
        house: expect.any(Number),
        lon: expect.any(Number),
      })
    )
    expect(chart.planet_houses).not.toBeNull()
    expect(chart.planet_houses?.length).toBe(chart.planets.length)
  })

  it('returns null houses and planet_houses without coordinates', () => {
    const chart = buildChartData({
      name: 'Test Natal Chart',
      birth_date: '1990-01-01',
      birth_time: '12:34:00',
      time_zone: 'America/Los_Angeles',
    })

    expect(chart.meta.birth_lat).toBeNull()
    expect(chart.meta.birth_lon).toBeNull()
    expect(chart.houses).toBeNull()
    expect(chart.planet_houses).toBeNull()
  })
})

describe('saveChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects when birth_lat is null', async () => {
    await expect(
      saveChart('user-1', makeSaveInput({ birth_lat: null }))
    ).rejects.toThrow('Birth coordinates are required to save a chart.')

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('rejects when birth_lon is null', async () => {
    await expect(
      saveChart('user-1', makeSaveInput({ birth_lon: null }))
    ).rejects.toThrow('Birth coordinates are required to save a chart.')

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('upserts the canonical chart identity payload', async () => {
    const input = makeSaveInput()
    const query = mockChartUpsert()

    const result = await saveChart('user-1', input)

    expect(supabase.from).toHaveBeenCalledWith('charts')
    expect(query.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        name: input.name,
        birth_date: input.birth_date,
        birth_time: input.birth_time,
        time_zone: input.time_zone,
        birth_lat: input.birth_lat,
        birth_lon: input.birth_lon,
        chart_data: input.chart_data,
      },
      {
        onConflict: CANONICAL_CHART_IDENTITY,
      }
    )
    expect(query.select).toHaveBeenCalledWith(CHART_SELECT)
    expect(query.single).toHaveBeenCalled()
    expect(result).toBe(query.data)
  })

  it('throws Supabase upsert errors', async () => {
    const error = new Error('upsert failed')
    mockChartUpsert({ data: null, error })

    await expect(saveChart('user-1', makeSaveInput())).rejects.toBe(error)
  })
})
