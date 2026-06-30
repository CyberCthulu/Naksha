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
  buildDailyGuidance,
  buildWeeklyForecast,
  type DailyGuidance,
  type WeeklyForecast,
} from '../../lib/guidance'
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

jest.mock('../../lib/guidance', () => ({
  __esModule: true,
  buildDailyGuidance: jest.fn(),
  buildWeeklyForecast: jest.fn(),
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

function makeDailyGuidance(
  overrides: Partial<DailyGuidance> = {}
): DailyGuidance {
  return {
    schemaVersion: 1,
    source: 'deterministic',
    date: '2026-05-17',
    evaluatedAt: '2026-05-17T12:00:00.000Z',
    transitMoonSign: 'Virgo',
    transitSunSign: 'Taurus',
    primaryTransit: {
      transitPlanet: 'Moon',
      natalPlanet: 'Mars',
      aspect: 'square',
      orb: 0.75,
      tone: 'challenging',
      intensity: 'high',
      sourceIds: [
        'guidance.transit.moon',
        'guidance.target.mars',
        'guidance.aspect.square',
      ],
    },
    tone: 'challenging',
    mood: {
      title: 'Mood',
      body: 'A practical mood supports thoughtful adjustment.',
      sourceIds: ['guidance.sign.virgo'],
    },
    warning: {
      title: 'Watch for',
      body: 'Watch for forcing movement before the tension is understood.',
      sourceIds: ['guidance.aspect.square'],
    },
    opportunity: {
      title: 'Opportunity',
      body: 'Turn friction into one useful and proportionate adjustment.',
      sourceIds: ['guidance.aspect.square'],
    },
    transitSummary: {
      title: 'Transit summary',
      body: 'Moon squares natal Mars within 0.75°.',
      sourceIds: ['guidance.aspect.square'],
    },
    reflectionPrompt: {
      id: 'guidance.prompt.friction-adjustment',
      category: 'reflection-prompt',
      promptCategory: 'action',
      tone: 'challenging',
      intensity: 'high',
      tags: ['change', 'action', 'growth'],
      title: 'Use the friction',
      prompt: 'What recurring friction is asking for an adjustment?',
      followUp: 'What can change first?',
      sourceIds: ['guidance.aspect.square'],
    },
    suggestedPractice: {
      id: 'guidance.practice.single-task-reset',
      category: 'practice',
      practiceCategory: 'focus',
      tone: 'supportive',
      intensity: 'low',
      tags: ['focus', 'structure', 'work', 'routines'],
      title: 'Single-task reset',
      summary: 'Reduce noise by completing one bounded task.',
      steps: ['Choose one task.', 'Work only on that task.'],
      durationMinutes: 15,
      sourceIds: ['guidance.transit.sun'],
    },
    sourceIds: [
      'guidance.sign.virgo',
      'guidance.aspect.square',
      'guidance.prompt.friction-adjustment',
      'guidance.practice.single-task-reset',
    ],
    ...overrides,
  }
}

function makeWeeklyForecast(
  overrides: Partial<WeeklyForecast> = {}
): WeeklyForecast {
  const daily = makeDailyGuidance()

  return {
    schemaVersion: 1,
    source: 'deterministic',
    startDate: '2026-05-11',
    endDate: '2026-05-17',
    timeZone: completeUser.time_zone!,
    evaluatedAt: daily.evaluatedAt,
    dailyThemes: [
      {
        date: '2026-05-11',
        evaluatedAt: daily.evaluatedAt,
        tone: daily.tone,
        title: 'Moon square natal Mars',
        summary: daily.transitSummary.body,
        primaryTransit: daily.primaryTransit,
        reflectionPrompt: daily.reflectionPrompt,
        suggestedPractice: daily.suggestedPractice,
        sourceIds: daily.sourceIds,
      },
    ],
    strongestTransits: [
      {
        ...daily.primaryTransit!,
        date: '2026-05-11',
      },
    ],
    weeklyThemes: [
      {
        title: 'Adjustments to make',
        body: 'Use friction as information and choose practical adjustments.',
        tone: 'challenging',
        sourceIds: ['guidance.aspect.square'],
      },
    ],
    suggestions: [daily.suggestedPractice],
    journalPrompts: [daily.reflectionPrompt],
    sourceIds: daily.sourceIds,
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

function mockedBuildDailyGuidance() {
  return buildDailyGuidance as jest.MockedFunction<
    typeof buildDailyGuidance
  >
}

function mockedBuildWeeklyForecast() {
  return buildWeeklyForecast as jest.MockedFunction<
    typeof buildWeeklyForecast
  >
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
    mockedBuildDailyGuidance().mockReturnValue(makeDailyGuidance())
    mockedBuildWeeklyForecast().mockReturnValue(makeWeeklyForecast())
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
    expect(mockedBuildDailyGuidance()).toHaveBeenCalledWith({
      natalPlanets: savedChart.planets,
      evaluatedAt: expect.any(Date),
    })
    expect(mockedBuildWeeklyForecast()).toHaveBeenCalledWith({
      natalPlanets: savedChart.planets,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expect(
      mockedBuildWeeklyForecast().mock.calls[0][0].evaluatedAt
    ).toBe(mockedBuildDailyGuidance().mock.calls[0][0].evaluatedAt)
  })

  it('stops with a safe error when saved-chart lookup fails', async () => {
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: null,
      chartError: new Error('Database unavailable'),
    })

    const screen = await renderScreen()

    expectText(
      screen,
      'Could not load your saved chart. Please try again.'
    )
    expectText(screen, 'Retry')
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedBuildDailyGuidance()).not.toHaveBeenCalled()
    expect(mockedBuildWeeklyForecast()).not.toHaveBeenCalled()
  })

  it('renders structured Today’s Energy guidance', async () => {
    const screen = await renderScreen()

    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Moon in Virgo | Sun in Taurus')
    expectText(screen, 'Mood')
    expectText(screen, 'A practical mood supports thoughtful adjustment.')
    expectText(screen, 'Watch for')
    expectText(screen, 'Opportunity')
    expectText(screen, 'Transit summary')
    expectText(screen, 'Moon squares natal Mars within 0.75°.')
    expectText(screen, 'Reflection prompt')
    expectText(screen, 'Use the friction')
    expectText(screen, 'Suggested practice')
    expectText(screen, 'Single-task reset')
  })

  it('renders Today’s Energy fallback when no strongest aspect exists', async () => {
    mockedBuildDailyGuidance().mockReturnValue(
      makeDailyGuidance({
        primaryTransit: null,
        tone: 'integrative',
        transitSummary: {
          title: 'Transit summary',
          body: 'No tight personal transit aspect is emphasized right now.',
          sourceIds: [
            'guidance.sign.virgo',
            'guidance.sign.taurus',
          ],
        },
      })
    )

    const screen = await renderScreen()

    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Mood')
    expectText(screen, 'Watch for')
    expectText(screen, 'Opportunity')
    expectText(
      screen,
      'No tight personal transit aspect is emphasized right now.'
    )
    expectText(screen, 'Reflection prompt')
    expectText(screen, 'Suggested practice')
  })

  it('renders the compact weekly forecast sections', async () => {
    const screen = await renderScreen()

    expectText(screen, 'Weekly Forecast')
    expectText(screen, 'May 11, 2026 - May 17, 2026')
    expectText(screen, 'Weekly themes')
    expectText(screen, 'Adjustments to make')
    expectText(screen, 'Strongest transits')
    expectText(screen, 'Moon square natal Mars')
    expectText(screen, 'Journal prompts')
    expectText(screen, 'Use the friction')
    expectText(screen, 'Suggested practices')
    expectText(screen, 'Single-task reset')
  })

  it('renders the weekly no-aspect fallback without transit rows', async () => {
    mockedBuildWeeklyForecast().mockReturnValue(
      makeWeeklyForecast({
        strongestTransits: [],
        weeklyThemes: [
          {
            title: 'Background rhythm',
            body: 'This week is guided more by the changing Sun and Moon background tone.',
            tone: 'integrative',
            sourceIds: [
              'guidance.sign.virgo',
              'guidance.sign.taurus',
            ],
          },
        ],
      })
    )

    const screen = await renderScreen()

    expectText(screen, 'Weekly Forecast')
    expectText(screen, 'Background rhythm')
    expectText(
      screen,
      'guided more by the changing Sun and Moon background tone'
    )
    expectText(screen, 'No tight personal transit highlights this week.')
    expectText(screen, 'Journal prompts')
    expectText(screen, 'Suggested practices')
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
