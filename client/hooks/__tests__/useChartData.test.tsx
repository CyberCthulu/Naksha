import React from 'react'
import { Alert } from 'react-native'
import TestRenderer from 'react-test-renderer'

import useChartData from '../useChartData'
import supabase from '../../lib/supabase'
import type { ChartData } from '../../lib/charts'
import {
  buildChartData,
  getChartCalculationPreferences,
  saveChart,
} from '../../lib/charts'
import {
  DEFAULT_CHART_CALCULATION_PREFERENCES,
  type ChartProfile,
} from '../../lib/domainTypes'

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('../../lib/charts', () => ({
  __esModule: true,
  buildChartData: jest.fn(),
  getChartCalculationPreferences: jest.fn(),
  saveChart: jest.fn(),
}))

type HookArgs = Parameters<typeof useChartData>[0]
type HookResult = ReturnType<typeof useChartData>

const { act, create } = TestRenderer

let latest: HookResult | null = null
let renderer: ReturnType<typeof create> | null = null

const validProfile: ChartProfile = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1815-12-10',
  birth_time: '12:00:00',
  birth_location: 'London, UK',
  time_zone: 'Europe/London',
  birth_lat: 51.5072,
  birth_lon: -0.1276,
}

function makeChartData(overrides: Partial<ChartData> = {}): ChartData {
  return {
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
    ...overrides,
  }
}

function Probe(props: HookArgs) {
  latest = useChartData(props)
  return null
}

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderUseChartData(args: HookArgs) {
  await act(async () => {
    renderer = create(<Probe {...args} />)
    await settleAsyncWork()
  })

  if (!latest) throw new Error('useChartData did not render')

  return latest
}

function currentResult() {
  if (!latest) throw new Error('useChartData did not render')
  return latest
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getUser: jest.Mock
    }
    from: jest.Mock
  }
}

function mockedBuildChartData() {
  return buildChartData as jest.MockedFunction<typeof buildChartData>
}

function mockedGetChartCalculationPreferences() {
  return getChartCalculationPreferences as jest.MockedFunction<
    typeof getChartCalculationPreferences
  >
}

function mockedSaveChart() {
  return saveChart as jest.MockedFunction<typeof saveChart>
}

function mockSignedInUser(userId = 'user-1') {
  mockedSupabase().auth.getUser.mockResolvedValue({
    data: {
      user: { id: userId },
    },
  })
}

function mockChartLookup(data: unknown = null, error: unknown = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error })
  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle,
  }

  mockedSupabase().from.mockReturnValue(query)

  return query
}

describe('useChartData', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    jest.spyOn(console, 'warn').mockImplementation(jest.fn())

    latest = null
    renderer = null

    mockSignedInUser()
    mockChartLookup()
    mockedBuildChartData().mockReturnValue(makeChartData())
    mockedGetChartCalculationPreferences().mockResolvedValue(
      DEFAULT_CHART_CALCULATION_PREFERENCES
    )
    mockedSaveChart().mockResolvedValue({ id: 1 } as any)
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
    latest = null
    jest.restoreAllMocks()
  })

  it('loads valid fromSaved chart data without auth or recompute', async () => {
    const saved = makeChartData({
      planets: [{ name: 'Moon', lon: 120 }],
    })

    const result = await renderUseChartData({
      profile: validProfile,
      fromSaved: true,
      saved,
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.planets).toEqual(saved.planets)
    expect(result.aspects).toEqual(saved.aspects)
    expect(result.houses).toEqual(saved.houses)
    expect(result.planetHouses).toEqual(saved.planet_houses)
    expect(result.isSaved).toBe(true)
    expect(result.canSaveChart).toBe(true)
    expect(mockedSupabase().auth.getUser).not.toHaveBeenCalled()
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
  })

  it('recomputes safely when fromSaved chart data is invalid', async () => {
    const recomputed = makeChartData({
      planets: [{ name: 'Mars', lon: 44 }],
    })
    mockedBuildChartData().mockReturnValue(recomputed)

    const result = await renderUseChartData({
      profile: validProfile,
      fromSaved: true,
      saved: { malformed: true } as any,
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.planets).toEqual(recomputed.planets)
    expect(result.aspects).toEqual(recomputed.aspects)
    expect(mockedBuildChartData()).toHaveBeenCalledTimes(1)
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).toHaveBeenCalledTimes(1)
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Error loading chart',
      expect.any(String)
    )
  })

  it('sets missing-coordinate charts to view-only and does not save', async () => {
    const profileWithoutCoordinates: ChartProfile = {
      ...validProfile,
      birth_lat: null,
      birth_lon: null,
    }
    const viewOnlyChart = makeChartData({
      meta: {
        ...makeChartData().meta,
        birth_lat: null,
        birth_lon: null,
      },
      houses: null,
      planet_houses: null,
    })
    mockedBuildChartData().mockReturnValue(viewOnlyChart)

    const result = await renderUseChartData({
      profile: profileWithoutCoordinates,
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.canSaveChart).toBe(false)
    expect(result.isSaved).toBe(false)
    expect(result.planets).toEqual(viewOnlyChart.planets)
    expect(mockedBuildChartData()).toHaveBeenCalledWith(
      {
        name: 'Ada Natal Chart',
        birth_date: '1815-12-10',
        birth_time: '12:00:00',
        time_zone: 'Europe/London',
        birth_lat: null,
        birth_lon: null,
      },
      DEFAULT_CHART_CALCULATION_PREFERENCES
    )
    expect(mockedSupabase().from).not.toHaveBeenCalled()
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).not.toHaveBeenCalled()
  })

  it('auto-saves self charts with coordinates', async () => {
    const result = await renderUseChartData({
      profile: validProfile,
      chartMode: 'self',
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.isSaved).toBe(true)
    expect(result.saveWarning).toBeNull()
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).toHaveBeenCalledTimes(1)
  })

  it('does not auto-save guest charts with coordinates', async () => {
    const result = await renderUseChartData({
      profile: validProfile,
      chartMode: 'guest',
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.canSaveChart).toBe(true)
    expect(result.isSaved).toBe(false)
    expect(result.saveWarning).toBeNull()
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).not.toHaveBeenCalled()
  })

  it('sets a save warning and leaves self charts unsaved when auto-save fails', async () => {
    mockedSaveChart().mockRejectedValueOnce(new Error('network down'))

    const result = await renderUseChartData({
      profile: validProfile,
      chartMode: 'self',
      tz: 'Europe/London',
    })

    expect(result.loading).toBe(false)
    expect(result.isSaved).toBe(false)
    expect(result.saveWarning).toBe(
      'This chart is ready to view, but it was not saved automatically. Tap Save Chart Data to try again.'
    )
    expect(console.warn).toHaveBeenCalledWith(
      'Auto-save failed:',
      expect.any(Error)
    )
  })

  it('clears saveWarning and marks saved after successful manual save', async () => {
    mockedSaveChart()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ id: 2 } as any)

    await renderUseChartData({
      profile: validProfile,
      chartMode: 'self',
      tz: 'Europe/London',
    })

    expect(currentResult().saveWarning).toBeTruthy()
    expect(currentResult().isSaved).toBe(false)

    await act(async () => {
      await currentResult().saveCurrentChart()
      await settleAsyncWork()
    })

    expect(mockedSaveChart()).toHaveBeenCalledTimes(2)
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledTimes(2)
    expect(currentResult().saveWarning).toBeNull()
    expect(currentResult().isSaved).toBe(true)
    expect(Alert.alert).toHaveBeenCalledWith(
      'Saved',
      'Chart saved to your library.'
    )
  })
})
