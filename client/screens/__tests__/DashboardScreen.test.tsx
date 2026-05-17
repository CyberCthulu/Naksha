import React from 'react'
import { InteractionManager, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import DashboardScreen from '../DashboardScreen'
import supabase from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import {
  buildChartData,
  getChartCalculationPreferences,
  saveChart,
  type ChartData,
} from '../../lib/charts'
import {
  buildTodayEnergy,
  type TodayEnergy,
} from '../../lib/dailyTransits'
import {
  DEFAULT_CHART_CALCULATION_PREFERENCES,
  type UserProfileFields,
  type UserRow,
} from '../../lib/domainTypes'

const mockNavigation = {
  navigate: jest.fn(),
}

jest.mock('@react-navigation/native', () => {
  const React = require('react')

  return {
    useNavigation: () => mockNavigation,
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}))

jest.mock('../../lib/auth', () => ({
  __esModule: true,
  signOut: jest.fn(),
}))

jest.mock('../../lib/charts', () => ({
  __esModule: true,
  buildChartData: jest.fn(),
  getChartCalculationPreferences: jest.fn(),
  saveChart: jest.fn(),
}))

jest.mock('../../lib/dailyTransits', () => ({
  __esModule: true,
  buildTodayEnergy: jest.fn(),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const completeUser: UserRow = {
  id: 'user-1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1815-12-10',
  birth_time: '12:00:00',
  birth_location: 'London, UK',
  time_zone: 'Europe/London',
  birth_lat: 51.5072,
  birth_lon: -0.1276,
  created_at: null,
  updated_at: null,
}

const completeMetadata: UserProfileFields = {
  first_name: completeUser.first_name,
  last_name: completeUser.last_name,
  birth_date: completeUser.birth_date,
  birth_time: completeUser.birth_time,
  birth_location: completeUser.birth_location,
  time_zone: completeUser.time_zone,
  birth_lat: completeUser.birth_lat,
  birth_lon: completeUser.birth_lon,
}

function makeChartData({
  sunLon = 10,
  moonLon = 40,
  birthLat = completeUser.birth_lat,
  birthLon = completeUser.birth_lon,
}: {
  sunLon?: number
  moonLon?: number
  birthLat?: number | null
  birthLon?: number | null
} = {}): ChartData {
  return {
    meta: {
      name: 'Ada Natal Chart',
      birth_date: completeUser.birth_date!,
      birth_time: completeUser.birth_time!,
      time_zone: completeUser.time_zone!,
      birth_lat: birthLat,
      birth_lon: birthLon,
      computed_at: '2026-05-11T00:00:00.000Z',
      instant_utc: '1815-12-10T12:00:00.000Z',
    },
    planets: [
      { name: 'Sun', lon: sunLon },
      { name: 'Moon', lon: moonLon },
    ],
    aspects: [{ a: 'Sun', b: 'Moon', type: 'trine', orb: 1.5 }],
    houses:
      birthLat == null || birthLon == null
        ? null
        : [{ house: 1, lon: 240 }],
    planet_houses:
      birthLat == null || birthLon == null
        ? null
        : [
            { name: 'Sun', house: 1 },
            { name: 'Moon', house: 2 },
          ],
  }
}

function makeTodayEnergy(
  overrides: Partial<TodayEnergy> = {}
): TodayEnergy {
  return {
    transitMoonSign: 'Virgo',
    transitSunSign: 'Taurus',
    strongestAspect: {
      transit: {
        kind: 'transit',
        id: 'transit:Moon:0',
        name: 'Moon',
        lon: 150,
      },
      natal: {
        kind: 'natal',
        id: 'natal:Mars:0',
        name: 'Mars',
        lon: 60,
      },
      type: 'square',
      orb: 0.75,
      aspectMeaning: 'Friction that pushes you toward growth and action.',
    },
    ...overrides,
  }
}

async function settleAsyncWork() {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<DashboardScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('DashboardScreen did not render')
  return renderer
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

function mockedBuildTodayEnergy() {
  return buildTodayEnergy as jest.MockedFunction<typeof buildTodayEnergy>
}

function mockSignedInUser(metadata: Record<string, unknown> = {}) {
  mockedSupabase().auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'ada@example.com',
        user_metadata: metadata,
      },
    },
    error: null,
  })
}

function mockDashboardQueries({
  userRow,
  repairedUserRow = null,
  chartRow = null,
  userError = null,
  repairError = null,
  chartError = null,
}: {
  userRow: UserRow | null
  repairedUserRow?: UserRow | null
  chartRow?: { chart_data: unknown } | null
  userError?: unknown
  repairError?: unknown
  chartError?: unknown
}) {
  const usersMaybeSingle = jest.fn().mockResolvedValue({
    data: userRow,
    error: userError,
  })
  const usersSelectQuery: any = {
    eq: jest.fn(() => usersSelectQuery),
    maybeSingle: usersMaybeSingle,
  }

  const repairMaybeSingle = jest.fn().mockResolvedValue({
    data: repairedUserRow,
    error: repairError,
  })
  const repairSelect = jest.fn(() => ({
    maybeSingle: repairMaybeSingle,
  }))
  const usersUpsert = jest.fn(() => ({
    select: repairSelect,
  }))
  const usersQuery = {
    upsert: usersUpsert,
    select: jest.fn(() => usersSelectQuery),
  }

  const chartsMaybeSingle = jest.fn().mockResolvedValue({
    data: chartRow,
    error: chartError,
  })
  const chartsQuery: any = {
    select: jest.fn(() => chartsQuery),
    eq: jest.fn(() => chartsQuery),
    maybeSingle: chartsMaybeSingle,
  }

  mockedSupabase().from.mockImplementation((table: string) => {
    if (table === 'users') return usersQuery
    if (table === 'charts') return chartsQuery
    throw new Error(`Unexpected Supabase table: ${table}`)
  })

  return {
    usersQuery,
    usersSelectQuery,
    usersUpsert,
    repairSelect,
    repairMaybeSingle,
    chartsQuery,
    chartsMaybeSingle,
  }
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function screenText(root: TestRenderer.ReactTestRenderer) {
  return root.root.findAllByType(Text).map((node) => textValue(node.props.children))
}

function expectText(root: TestRenderer.ReactTestRenderer, expected: string) {
  expect(screenText(root).some((text) => text.includes(expected))).toBe(true)
}

function findPressableByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.findAllByType(Text).some((textNode) =>
          textValue(textNode.props.children).includes(label)
        )
    )[0]

  if (!pressable) throw new Error(`Could not find pressable: ${label}`)
  return pressable
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      .mockImplementation((task?: any) => {
        if (typeof task === 'function') {
          task()
        }

        return {
          then: jest.fn(),
          done: jest.fn(),
          cancel: jest.fn(),
        } as any
      })

    renderer = null

    mockSignedInUser()
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: { chart_data: makeChartData() },
    })
    mockedBuildChartData().mockReturnValue(makeChartData())
    mockedGetChartCalculationPreferences().mockResolvedValue(
      DEFAULT_CHART_CALCULATION_PREFERENCES
    )
    mockedSaveChart().mockResolvedValue({ id: 1 } as any)
    mockedBuildTodayEnergy().mockReturnValue(makeTodayEnergy())
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('loads a complete profile without redirecting to CompleteProfile', async () => {
    const screen = await renderScreen()

    expect(mockNavigation.navigate).not.toHaveBeenCalledWith('CompleteProfile')
    expectText(screen, 'Welcome to Naksha')
    expectText(screen, 'Hello, Ada Lovelace!')
    expectText(screen, 'Your Birth Details')
    expectText(screen, 'Email: ada@example.com')
  })

  it('routes compact dashboard actions to their current targets', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findPressableByText(screen, 'View Birth Chart').props.onPress()
      findPressableByText(screen, 'Guest Chart').props.onPress()
      findPressableByText(screen, 'My Charts').props.onPress()
      findPressableByText(screen, 'Journal').props.onPress()
      findPressableByText(screen, 'Edit Details').props.onPress()
      findPressableByText(screen, 'My Profile').props.onPress()
      findPressableByText(screen, 'Sign Out').props.onPress()
      await settleAsyncWork()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Chart', {
      profile: completeUser,
      chartMode: 'self',
    })
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateGuestChart')
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MyCharts')
    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalList')
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CompleteProfile')
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile')
    expect(signOut).toHaveBeenCalled()
  })

  it('redirects incomplete profiles to CompleteProfile', async () => {
    const incompleteUser = {
      ...completeUser,
      birth_location: null,
    }
    mockSignedInUser()
    mockDashboardQueries({
      userRow: incompleteUser,
      chartRow: null,
    })

    await renderScreen()

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CompleteProfile')
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedSupabase().from).not.toHaveBeenCalledWith('charts')
  })

  it('repairs an incomplete users row from auth metadata before rendering', async () => {
    const incompleteUser = {
      ...completeUser,
      birth_location: null,
      birth_lat: null,
      birth_lon: null,
    }
    mockSignedInUser(completeMetadata)
    const query = mockDashboardQueries({
      userRow: incompleteUser,
      repairedUserRow: completeUser,
      chartRow: { chart_data: makeChartData({ sunLon: 20, moonLon: 50 }) },
    })

    const screen = await renderScreen()

    expect(query.usersUpsert).toHaveBeenNthCalledWith(
      2,
      {
        id: 'user-1',
        email: 'ada@example.com',
        ...completeMetadata,
      },
      { onConflict: 'id' }
    )
    expect(query.repairSelect).toHaveBeenCalledWith('*')
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith('CompleteProfile')
    expectText(screen, 'Location: London, UK')
  })

  it('hydrates the signs summary from valid saved chart_data', async () => {
    const savedChart = makeChartData({
      sunLon: 15,
      moonLon: 45,
    })
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: {
        chart_data: savedChart,
      },
    })

    const screen = await renderScreen()

    expectText(screen, 'Your Signs')
    expectText(screen, 'Aries')
    expectText(screen, 'Taurus')
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedBuildTodayEnergy()).toHaveBeenCalledWith(
      savedChart.planets,
      expect.any(Date)
    )
  })

  it('renders Today’s Energy with a strongest fast transit aspect', async () => {
    const screen = await renderScreen()

    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Transit Moon: Virgo')
    expectText(screen, 'Transit Sun: Taurus')
    expectText(screen, 'Transit Moon square natal Mars · 0.8°')
    expectText(screen, 'Friction that pushes you toward growth and action.')
  })

  it('renders Today’s Energy fallback when no strongest aspect exists', async () => {
    mockedBuildTodayEnergy().mockReturnValue(
      makeTodayEnergy({
        strongestAspect: null,
      })
    )

    const screen = await renderScreen()

    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Transit Moon: Virgo')
    expectText(screen, 'Transit Sun: Taurus')
    expectText(screen, 'No major fast transit aspect is exact right now.')
  })

  it('falls back to built chart data when saved chart_data is invalid', async () => {
    const fallbackChart = makeChartData({
      sunLon: 75,
      moonLon: 195,
    })
    mockedBuildChartData().mockReturnValue(fallbackChart)
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: {
        chart_data: { malformed: true },
      },
    })

    const screen = await renderScreen()

    expect(mockedBuildChartData()).toHaveBeenCalledWith(
      {
        name: 'Ada Natal Chart',
        birth_date: completeUser.birth_date,
        birth_time: completeUser.birth_time,
        time_zone: completeUser.time_zone,
        birth_lat: completeUser.birth_lat,
        birth_lon: completeUser.birth_lon,
      },
      DEFAULT_CHART_CALCULATION_PREFERENCES
    )
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).toHaveBeenCalledTimes(1)
    expectText(screen, 'Gemini')
    expectText(screen, 'Libra')
  })

  it('auto-saves a newly built self chart when coordinates are present', async () => {
    const builtChart = makeChartData({
      sunLon: 105,
      moonLon: 220,
    })
    mockedBuildChartData().mockReturnValue(builtChart)
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: null,
    })

    await renderScreen()

    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).toHaveBeenCalledWith('user-1', {
      name: builtChart.meta.name,
      birth_date: builtChart.meta.birth_date,
      birth_time: builtChart.meta.birth_time,
      time_zone: builtChart.meta.time_zone,
      birth_lat: builtChart.meta.birth_lat,
      birth_lon: builtChart.meta.birth_lon,
      chart_data: builtChart,
    })
  })

  it('builds a missing-coordinate summary without looking up or saving charts', async () => {
    const profileWithoutCoordinates = {
      ...completeUser,
      birth_lat: null,
      birth_lon: null,
    }
    const builtChart = makeChartData({
      sunLon: 335,
      moonLon: 5,
      birthLat: null,
      birthLon: null,
    })
    mockedBuildChartData().mockReturnValue(builtChart)
    mockDashboardQueries({
      userRow: profileWithoutCoordinates,
      chartRow: null,
    })

    const screen = await renderScreen()

    expect(mockedSupabase().from).not.toHaveBeenCalledWith('charts')
    expect(mockedBuildChartData()).toHaveBeenCalledWith(
      {
        name: 'Ada Natal Chart',
        birth_date: completeUser.birth_date,
        birth_time: completeUser.birth_time,
        time_zone: completeUser.time_zone,
        birth_lat: null,
        birth_lon: null,
      },
      DEFAULT_CHART_CALCULATION_PREFERENCES
    )
    expect(mockedGetChartCalculationPreferences()).toHaveBeenCalledWith(
      'user-1'
    )
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expectText(screen, 'Pisces')
    expectText(screen, 'Aries')
  })
})
