import React from 'react'
import { InteractionManager, StyleSheet, Text, View } from 'react-native'
import TestRenderer from 'react-test-renderer'

import DashboardScreen from '../DashboardScreen'
import { Button } from '../../components/ui/Button'
import { theme } from '../../components/ui/theme'
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
import { HOUSE_GUIDANCE } from '../../lib/lexicon/guidance'
import {
  CURRENT_CHART_CALCULATION_VERSION,
  CURRENT_CHART_SCHEMA_VERSION,
} from '../../lib/chartDataVersions'
import { UNSUPPORTED_CHART_DATA_MESSAGE } from '../../lib/chartDataValidation'

const mockNavigation = {
  navigate: jest.fn(),
}

jest.mock('../../components/charts/CurrentSkyCompass', () => ({
  CurrentSkyCompass: () => {
    const { Text } = require('react-native')
    return <Text>Sky Now</Text>
  },
}))

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
    transitHouse: null,
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
  const rhythmTitles = [
    'Moon square natal Mars',
    'Mercury sextile natal Sun',
    'Venus trine natal Moon',
    'Mars square natal Mercury',
    'Sun conjunct natal Venus',
    'Moon trine natal Jupiter',
    'Mercury conjunct natal Saturn',
  ]
  const rhythmSummaries = rhythmTitles.map(
    (_, index) => `Day ${index + 1} rhythm summary.`
  )

  return {
    schemaVersion: 1,
    source: 'deterministic',
    startDate: '2026-05-11',
    endDate: '2026-05-17',
    timeZone: completeUser.time_zone!,
    evaluatedAt: daily.evaluatedAt,
    dailyThemes: rhythmTitles.map((title, index) => ({
      date: `2026-05-${String(11 + index).padStart(2, '0')}`,
      evaluatedAt: daily.evaluatedAt,
      tone: daily.tone,
      title,
      summary: rhythmSummaries[index],
      primaryTransit: daily.primaryTransit,
      transitHouse: daily.transitHouse,
      reflectionPrompt: daily.reflectionPrompt,
      suggestedPractice: daily.suggestedPractice,
      sourceIds: daily.sourceIds,
    })),
    strongestTransits: [
      {
        ...daily.primaryTransit!,
        date: '2026-05-11',
        activeDays: 1,
        significanceScore: 38,
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
    representativePrompt: daily.reflectionPrompt,
    representativePractice: daily.suggestedPractice,
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

function expectNoText(
  root: TestRenderer.ReactTestRenderer,
  expected: string
) {
  expect(screenText(root).some((text) => text.includes(expected))).toBe(false)
}

function findPressableByAccessibilityLabel(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.props.accessibilityLabel === label
    )[0]

  if (!pressable) {
    throw new Error(`Could not find accessible pressable: ${label}`)
  }
  return pressable
}

function findPressableByTestId(
  root: TestRenderer.ReactTestRenderer,
  testID: string
) {
  const matches = root.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      node.props.testID === testID
  )

  // A control wrapped in its own component matches twice -- once as the
  // wrapper, which was handed onPress and testID, and once as the Pressable
  // that actually declares the accessibility contract. Prefer the latter.
  const pressable =
    matches.find((node) => node.props.accessibilityRole != null) ?? matches[0]

  if (!pressable) {
    throw new Error(`Could not find pressable testID: ${testID}`)
  }
  return pressable
}

/**
 * Switch the guidance selector. Only the selected card is rendered, so any
 * assertion about Weekly has to choose its tab first.
 */
/** Pressable styles arrive as a function; resolve then flatten. */
function flattenStyle(style: unknown): Record<string, any> {
  const resolved = typeof style === 'function' ? style({ pressed: false }) : style
  return (StyleSheet.flatten(resolved as any) ?? {}) as Record<string, any>
}

async function selectTab(
  root: TestRenderer.ReactTestRenderer,
  tab: 'today' | 'week'
) {
  await act(async () => {
    findPressableByTestId(root, `dashboard-tab-${tab}`).props.onPress()
    await settleAsyncWork()
  })
}

/**
 * Collapsed/expanded read from the control's own accessibility state.
 *
 * These assertions used to key on the words "Tap to expand" / "Tap to
 * collapse". That copy is now a chevron, and the state was always the real
 * contract -- it is what a screen reader is told and what the card renders
 * from.
 */
function expectExpanded(
  root: TestRenderer.ReactTestRenderer,
  testID: string,
  expanded: boolean
) {
  const toggle = findPressableByTestId(root, testID)
  expect(toggle.props.accessibilityState).toEqual({ expanded })
}

function pressHandlersByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const handlers = root.root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.findAllByType(Text).some(
          (textNode) =>
            textValue(textNode.props.children) === label
        )
    )
    .map((node) => node.props.onPress as () => void)

  return [...new Set(handlers)]
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

    // The reader is the headline. The app's own name was previously the
    // largest thing on the screen.
    expectText(screen, 'Hello, Ada')
    expectNoText(screen, 'Welcome to Naksha')
    expectNoText(screen, '🌌')

    // Birth context is one quiet human line, not a five-row record.
    expectText(screen, '10 Dec 1815')
    expectText(screen, 'London')
    expectNoText(screen, 'Your Birth Details')

    // Account and machine data have no place on the Dashboard.
    expectNoText(screen, 'ada@example.com')
    expectNoText(screen, 'Europe/London')
    expectNoText(screen, '51.5072')
  })

  it('renders the signs line with planet glyphs and no emoji', async () => {
    const screen = await renderScreen()

    expectText(screen, '☉')
    expectText(screen, '☽')
    expectNoText(screen, '☀️')
    expectNoText(screen, '🌙')

    const signs = screen.root
      .findAll((node) => node.props?.testID === 'dashboard-signs')[0]
      .findAllByType(Text)
      .map((node) => textValue(node.props.children))
      .join('')

    // Both halves on one unboxed line, separated only when both are present.
    expect(signs).toContain('☉ ')
    expect(signs).toContain(' · ☽ ')
  })

  it('omits a missing birth segment without leaving a stray separator', async () => {
    mockDashboardQueries({
      userRow: { ...completeUser, birth_location: null },
      chartRow: { chart_data: makeChartData() },
    })

    const screen = await renderScreen()
    const context = screen.root
      .findAll((node) => node.props?.testID === 'dashboard-birth-context')[0]
      .findAllByType(Text)
      .map((node) => textValue(node.props.children))
      .join('')

    expect(context).toBe('10 Dec 1815 · 12:00 PM')
    expect(context.endsWith('·')).toBe(false)
    expect(context).not.toContain('· ·')
  })

  it('lets the birth context wrap instead of clamping it', async () => {
    const screen = await renderScreen()
    const context = screen.root.findAll(
      (node) => node.props?.testID === 'dashboard-birth-context'
    )[0]

    expect(context.props.numberOfLines).toBeUndefined()
  })

  it('orders the screen identity, quick nav, current sky, tabs, guidance', async () => {
    const screen = await renderScreen()
    const visibleText = screenText(screen)
    const at = (needle: string) =>
      visibleText.findIndex((text) => text.includes(needle))

    const greeting = at('Hello, Ada')
    const signs = at('☉')
    const birthContext = at('10 Dec 1815')
    const chart = at('Chart')
    const sky = at('Sky Now')
    const tab = at('This Week')
    const guidance = at('Today’s Energy')

    expect(greeting).toBeGreaterThanOrEqual(0)
    expect(signs).toBeGreaterThan(greeting)
    expect(birthContext).toBeGreaterThan(signs)

    // Everything a reader might go to sits above the guidance, including the
    // chart -- there is no gold slab further down the screen.
    expect(chart).toBeGreaterThan(birthContext)
    expect(sky).toBeGreaterThan(chart)
    expect(tab).toBeGreaterThan(sky)
    expect(guidance).toBeGreaterThan(tab)
  })

  it('keeps the chart above the guidance on either tab', async () => {
    const screen = await renderScreen()

    for (const [tab, heading] of [
      ['today', 'Today’s Energy'],
      ['week', 'Weekly Forecast'],
    ] as const) {
      await selectTab(screen, tab)

      const visibleText = screenText(screen)
      const chart = visibleText.findIndex((t) => t.includes('Chart'))
      const guidance = visibleText.findIndex((t) => t.includes(heading))

      expect(chart).toBeGreaterThanOrEqual(0)
      expect(guidance).toBeGreaterThan(chart)
    }
  })

  it('renders exactly one chart action, and no gold slab', async () => {
    const screen = await renderScreen()

    const chartActions = () => {
      const seen = new Set<string>()
      return screen.root
        .findAll(
          (node) =>
            typeof node.props.onPress === 'function' &&
            node.props.accessibilityLabel === 'View birth chart'
        )
        .filter((node) => {
          const id = String(node.props.testID)
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
    }

    expect(chartActions()).toHaveLength(1)

    // The full-width Button is gone; the chart lives in the strip now.
    expect(
      screen.root
        .findAllByType(Button)
        .filter((b) => b.props.title === 'View birth chart')
    ).toHaveLength(0)

    await selectTab(screen, 'week')
    expect(chartActions()).toHaveLength(1)
  })

  it('carries five quick destinations, with the chart the only gold one', async () => {
    const screen = await renderScreen()
    const seen = new Set<string>()
    const destinations = screen.root
      .findAll(
        (node) =>
          typeof node.props.onPress === 'function' &&
          node.props.accessibilityRole === 'button' &&
          typeof node.props.testID === 'string' &&
          node.props.testID.startsWith('dashboard-utility-')
      )
      .filter((node) => {
        if (seen.has(node.props.testID)) return false
        seen.add(node.props.testID)
        return true
      })

    expect(destinations).toHaveLength(5)
    expect(destinations.map((d) => d.props.accessibilityLabel)).toEqual([
      'View birth chart',
      'Create guest chart',
      'Open my charts',
      'Open journal',
      'Open my profile',
    ])

    for (const destination of destinations) {
      // Five equal columns that reflow, never a percentage basis that
      // overlaps once the font scale grows -- and no clamped label.
      const style = flattenStyle(destination.props.style)
      expect(style.flex).toBe(1)
      expect(style.minHeight).toBe(theme.touchTarget.min)
      expect(String(style.flexBasis ?? '')).not.toContain('%')
    }

    // Hierarchy is ink, not a slab: exactly one destination is gold.
    const tints = destinations.map((destination) =>
      destination
        .findAllByType(Text)
        .map((node) => flattenStyle(node.props.style).color)
        .join()
    )
    expect(tints.filter((tint) => tint === theme.accent.base)).toHaveLength(1)
    expect(tints[0]).toBe(theme.accent.base)
  })

  it('leaves no second utility row at the foot of the screen', async () => {
    const screen = await renderScreen()
    const visibleText = screenText(screen)

    expect(visibleText.filter((t) => t.includes('Guest'))).toHaveLength(1)
    expect(visibleText.filter((t) => t.includes('Saved'))).toHaveLength(1)
    expect(visibleText.filter((t) => t.includes('Journal') && t.length < 20))
      .toHaveLength(1)

    // Everything actionable is above the guidance; nothing repeats below it.
    const lastDestination = visibleText.findIndex((t) => t.includes('Profile'))
    const guidance = visibleText.findIndex((t) => t.includes('Today’s Energy'))
    expect(lastDestination).toBeLessThan(guidance)
  })

  it('drops Edit Details and Sign Out from ordinary navigation', async () => {
    const screen = await renderScreen()

    expectNoText(screen, 'Edit Details')
    expectNoText(screen, 'Sign Out')
    expectNoText(screen, 'Sign out')
    expect(signOut).not.toHaveBeenCalled()
  })

  it('explains why the chart is unavailable rather than doing nothing', async () => {
    // A profile that has not been completed: the chart cannot be opened, and
    // the reader has to be told why rather than pressing a dead control.
    mockDashboardQueries({
      userRow: { ...completeUser, birth_location: null },
      chartRow: null,
    })

    const screen = await renderScreen()
    const action = findPressableByTestId(
      screen,
      'dashboard-utility-birth-chart'
    )

    expect(action.props.accessibilityState).toEqual({ disabled: true })
    expectText(screen, 'Add your birth date, time and place')

    mockNavigation.navigate.mockClear()
    await act(async () => {
      action.props.onPress()
      await settleAsyncWork()
    })
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith(
      'Chart',
      expect.anything()
    )
  })

  it('enables the chart and drops the explanation once the profile is whole', async () => {
    const screen = await renderScreen()
    const action = findPressableByTestId(
      screen,
      'dashboard-utility-birth-chart'
    )

    expect(action.props.accessibilityState).toEqual({ disabled: false })
    expect(
      screen.root.findAll(
        (node) => node.props?.testID === 'dashboard-chart-unavailable'
      )
    ).toHaveLength(0)
  })

  it('bounds each guidance toggle so its label excludes body copy', async () => {
    const guidance = makeDailyGuidance()
    const screen = await renderScreen()

    for (const [tab, testID, label] of [
      ['today', 'today-energy-toggle', 'Expand Today’s Energy details'],
      ['week', 'weekly-forecast-toggle', 'Expand Weekly Forecast details'],
    ] as const) {
      await selectTab(screen, tab)
      const toggle = findPressableByTestId(screen, testID)

      expect(toggle.props.accessibilityRole).toBe('button')
      expect(toggle.props.accessibilityLabel).toBe(label)

      // The control used to wrap the whole collapsed card, which took its body
      // copy out of the reading order and announced it as one button.
      const inside = toggle
        .findAllByType(Text)
        .map((node) => textValue(node.props.children))
        .join(' ')

      expect(inside).not.toContain(guidance.mood.body)
      expect(inside).not.toContain(guidance.transitSummary.body)
      expect(inside).not.toContain('Moon in')
    }
  })

  it('preserves expanded guidance content and its order', async () => {
    const guidance = makeDailyGuidance()
    const screen = await renderScreen()

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Today’s Energy details'
      ).props.onPress()
    })

    const visible = screenText(screen)
    const at = (needle: string) =>
      visible.findIndex((text) => text.includes(needle))

    expect(at(guidance.mood.title)).toBeGreaterThanOrEqual(0)
    expect(at(guidance.warning.title)).toBeGreaterThan(at(guidance.mood.title))
    expect(at(guidance.opportunity.title)).toBeGreaterThan(
      at(guidance.warning.title)
    )
    expect(at(guidance.transitSummary.title)).toBeGreaterThan(
      at(guidance.opportunity.title)
    )
    expect(at('Reflection')).toBeGreaterThan(at(guidance.transitSummary.title))
    expect(at('Grounding practice')).toBeGreaterThan(at('Reflection'))

    // Every body still present, byte for byte.
    for (const section of [
      guidance.mood,
      guidance.warning,
      guidance.opportunity,
      guidance.transitSummary,
    ]) {
      expectText(screen, section.body)
    }
    expectText(screen, guidance.reflectionPrompt.prompt)
    expectText(screen, guidance.suggestedPractice.summary)
    for (const step of guidance.suggestedPractice.steps) {
      expectText(screen, step)
    }
  })

  it('does not clamp guidance text that has to survive text scaling', async () => {
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Weekly Forecast details'
      ).props.onPress()
    })

    // Fixed-width weekday columns clip "Wed" as soon as the scale grows.
    const rhythmRows = screen.root.findAll(
      (node) =>
        typeof node.props?.testID === 'string' &&
        node.props.testID.startsWith('weekly-rhythm-2')
    )
    expect(rhythmRows.length).toBeGreaterThan(0)

    const flattened = JSON.stringify(
      rhythmRows.map((row) => row.props.style)
    )
    expect(flattened).not.toContain('"width":38')

    // And nothing inside the row is clamped to a single line.
    for (const row of rhythmRows) {
      for (const text of row.findAllByType(Text)) {
        expect(text.props.numberOfLines).toBeUndefined()
      }
    }
  })

  it('keeps the collapsed summary clamped, which is the compact state', async () => {
    const screen = await renderScreen()
    const clamped = screen.root
      .findAllByType(Text)
      .filter((node) => node.props.numberOfLines === 2)

    expect(clamped.length).toBeGreaterThan(0)
  })

it('opens on Today with This Week neither shown nor reachable', async () => {
    const screen = await renderScreen()

    expect(
      findPressableByTestId(screen, 'dashboard-tab-today').props
        .accessibilityState
    ).toEqual({ selected: true })
    expect(
      findPressableByTestId(screen, 'dashboard-tab-week').props
        .accessibilityState
    ).toEqual({ selected: false })

    expectText(screen, 'Today’s Energy')

    // Not hidden -- absent. Nothing occupies layout and TalkBack has nothing
    // to reach, because the inactive card is not rendered.
    expectNoText(screen, 'Weekly Forecast')
    expect(
      screen.root.findAll(
        (node) => node.props?.testID === 'weekly-forecast-toggle'
      )
    ).toHaveLength(0)
  })

  it('shows one guidance surface at a time, either way round', async () => {
    const screen = await renderScreen()

    await selectTab(screen, 'week')
    expectText(screen, 'Weekly Forecast')
    expectNoText(screen, 'Today’s Energy')
    expect(
      screen.root.findAll(
        (node) => node.props?.testID === 'today-energy-toggle'
      )
    ).toHaveLength(0)

    await selectTab(screen, 'today')
    expectText(screen, 'Today’s Energy')
    expectNoText(screen, 'Weekly Forecast')
    expect(
      screen.root.findAll(
        (node) => node.props?.testID === 'weekly-forecast-toggle'
      )
    ).toHaveLength(0)
  })

  it('marks the selected tab with more than colour, at a real target size', async () => {
    const screen = await renderScreen()

    for (const testID of ['dashboard-tab-today', 'dashboard-tab-week']) {
      const tab = findPressableByTestId(screen, testID)

      expect(tab.props.accessibilityRole).toBe('tab')
      expect(flattenStyle(tab.props.style).minHeight).toBe(
        theme.touchTarget.min
      )
    }

    // The indicator is a rule under the label, not a colour swap on it: a
    // reader who cannot separate the two inks still sees which tab is live.
    const indicators = (selected: string) =>
      findPressableByTestId(screen, selected)
        .findAllByType(View)
        .map((node) => flattenStyle(node.props.style).backgroundColor)

    expect(indicators('dashboard-tab-today')).toContain(theme.accent.base)
    expect(indicators('dashboard-tab-week')).not.toContain(theme.accent.base)
  })

  it('keeps each card expanded independently across tab switches', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findPressableByTestId(screen, 'today-energy-toggle').props.onPress()
    })
    expectExpanded(screen, 'today-energy-toggle', true)

    // Away and back: the card is remounted, but the flag lives on the screen.
    await selectTab(screen, 'week')
    expectExpanded(screen, 'weekly-forecast-toggle', false)

    await selectTab(screen, 'today')
    expectExpanded(screen, 'today-energy-toggle', true)

    // And the two do not share one flag.
    await selectTab(screen, 'week')
    await act(async () => {
      findPressableByTestId(screen, 'weekly-forecast-toggle').props.onPress()
    })
    expectExpanded(screen, 'weekly-forecast-toggle', true)

    await selectTab(screen, 'today')
    expectExpanded(screen, 'today-energy-toggle', true)
    await selectTab(screen, 'week')
    expectExpanded(screen, 'weekly-forecast-toggle', true)
  })

  it('recomputes nothing when the tab changes', async () => {
    const screen = await renderScreen()

    const dailyCalls = mockedBuildDailyGuidance().mock.calls.length
    const weeklyCalls = mockedBuildWeeklyForecast().mock.calls.length
    const authCalls = mockedSupabase().auth.getUser.mock.calls.length
    const fromCalls = mockedSupabase().from.mock.calls.length

    await selectTab(screen, 'week')
    await selectTab(screen, 'today')
    await selectTab(screen, 'week')

    // A presentation selector. No guidance rebuild, no chart work, no I/O.
    expect(mockedBuildDailyGuidance().mock.calls).toHaveLength(dailyCalls)
    expect(mockedBuildWeeklyForecast().mock.calls).toHaveLength(weeklyCalls)
    expect(mockedSupabase().auth.getUser.mock.calls).toHaveLength(authCalls)
    expect(mockedSupabase().from.mock.calls).toHaveLength(fromCalls)
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
  })

  it('keeps tab and destination labels unclamped for wrapping', async () => {
    const screen = await renderScreen()

    for (const testID of [
      'dashboard-tab-today',
      'dashboard-tab-week',
      'dashboard-utility-guest-chart',
      'dashboard-utility-my-charts',
      'dashboard-utility-journal',
      'dashboard-utility-profile',
    ]) {
      for (const text of findPressableByTestId(screen, testID).findAllByType(
        Text
      )) {
        expect(text.props.numberOfLines).toBeUndefined()
      }
    }
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

  it('routes an invalid stored timezone to profile correction without using UTC', async () => {
    const invalidZoneUser = {
      ...completeUser,
      time_zone: 'Mars/Olympus',
    }
    const query = mockDashboardQueries({
      userRow: invalidZoneUser,
      chartRow: null,
    })

    await renderScreen()

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CompleteProfile')
    expect(query.chartsMaybeSingle).not.toHaveBeenCalled()
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedBuildDailyGuidance()).not.toHaveBeenCalled()
    expect(mockedBuildWeeklyForecast()).not.toHaveBeenCalled()
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

    // The repaired row reaches the view. Shown as human context now rather
    // than as a "Location:" record row, and never as the raw geocoder string.
    expectText(screen, 'London')
    expectNoText(screen, 'Location: London, UK')
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

    // Rendered on the unboxed identity line now, not in a "Your Signs" card.
    expectNoText(screen, 'Your Signs')
    expectText(screen, '☉ Aries')
    expectText(screen, '☽ Taurus')
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedBuildDailyGuidance()).toHaveBeenCalledWith({
      natalPlanets: savedChart.planets,
      natalHouses: savedChart.houses,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expect(mockedBuildWeeklyForecast()).toHaveBeenCalledWith({
      natalPlanets: savedChart.planets,
      natalHouses: savedChart.houses,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expect(
      mockedBuildWeeklyForecast().mock.calls[0][0].evaluatedAt
    ).toBe(mockedBuildDailyGuidance().mock.calls[0][0].evaluatedAt)
  })

  it('hydrates legacy saved houses before the shared guidance path', async () => {
    const legacyChart = {
      ...makeChartData({ sunLon: 15, moonLon: 45 }),
      houses: null,
      planet_houses: null,
    }
    mockedBuildDailyGuidance().mockImplementation((input) =>
      makeDailyGuidance({
        transitHouse:
          input.natalHouses?.length === 12
            ? { house: 10, guidance: HOUSE_GUIDANCE[10] }
            : null,
      })
    )
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: { chart_data: legacyChart },
    })

    const screen = await renderScreen()
    const dailyInput = mockedBuildDailyGuidance().mock.calls[0][0]
    const weeklyInput = mockedBuildWeeklyForecast().mock.calls[0][0]

    expect(dailyInput.natalPlanets).toBe(legacyChart.planets)
    expect(dailyInput.natalHouses).toHaveLength(12)
    expect(weeklyInput.natalHouses).toBe(dailyInput.natalHouses)
    expect(weeklyInput.evaluatedAt).toBe(dailyInput.evaluatedAt)
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Today’s Energy details'
      ).props.onPress()
    })
    expectText(screen, 'Life area')
    expectText(screen, 'House 10')
  })

  it('passes equivalent normalized chart inputs for saved and fresh sources', async () => {
    const equivalentChart = makeChartData({ sunLon: 15, moonLon: 45 })
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: { chart_data: equivalentChart },
    })

    await renderScreen()
    const savedDailyInput = mockedBuildDailyGuidance().mock.calls[0][0]
    const savedWeeklyInput = mockedBuildWeeklyForecast().mock.calls[0][0]

    await act(async () => {
      renderer?.unmount()
    })
    renderer = null
    mockedSupabase().auth.getUser.mockReset()
    mockedSupabase().from.mockReset()
    mockedBuildChartData().mockClear()
    mockedGetChartCalculationPreferences().mockClear()
    mockedSaveChart().mockClear()
    mockedBuildDailyGuidance().mockClear()
    mockedBuildWeeklyForecast().mockClear()
    mockSignedInUser()
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: null,
    })
    mockedBuildChartData().mockReturnValue(equivalentChart)

    await renderScreen()
    const freshDailyInput = mockedBuildDailyGuidance().mock.calls[0][0]
    const freshWeeklyInput = mockedBuildWeeklyForecast().mock.calls[0][0]

    expect(freshDailyInput).toMatchObject({
      natalPlanets: savedDailyInput.natalPlanets,
      natalHouses: savedDailyInput.natalHouses,
      timeZone: savedDailyInput.timeZone,
    })
    expect(freshWeeklyInput).toMatchObject({
      natalPlanets: savedWeeklyInput.natalPlanets,
      natalHouses: savedWeeklyInput.natalHouses,
      timeZone: savedWeeklyInput.timeZone,
    })
    expect(savedWeeklyInput.evaluatedAt).toBe(savedDailyInput.evaluatedAt)
    expect(freshWeeklyInput.evaluatedAt).toBe(freshDailyInput.evaluatedAt)
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

    // Retry stays the single primary action. Sign out is kept as the recovery
    // path out of a broken session -- it is not ordinary navigation, and it is
    // not a second gold call to action sitting beside Retry.
    const errorState = screen.root.findAll(
      (node) => node.props?.testID === 'dashboard-error'
    )
    expect(errorState.length).toBeGreaterThan(0)

    const errorButtons = screen.root.findAllByType(Button)
    const retry = errorButtons.find((b) => b.props.title === 'Retry')
    const signOutButton = errorButtons.find((b) => b.props.title === 'Sign out')

    expect(retry?.props.variant).toBeUndefined()
    expect(signOutButton?.props.variant).toBe('tertiary')

    // The handler is wrapped, so a rejected sign-out cannot surface as an
    // unhandled promise the reader is never told about.
    ;(signOut as jest.Mock).mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      signOutButton?.props.onPress()
      await settleAsyncWork()
    })
    expect(signOut).toHaveBeenCalled()

    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedBuildDailyGuidance()).not.toHaveBeenCalled()
    expect(mockedBuildWeeklyForecast()).not.toHaveBeenCalled()
  })

  it('does not interpret, rebuild, or overwrite unsupported saved chart data', async () => {
    mockDashboardQueries({
      userRow: completeUser,
      chartRow: {
        chart_data: {
          ...makeChartData(),
          schema_version: CURRENT_CHART_SCHEMA_VERSION,
          calculation_version: CURRENT_CHART_CALCULATION_VERSION + 1,
        },
      },
    })

    const screen = await renderScreen()

    expectText(screen, UNSUPPORTED_CHART_DATA_MESSAGE)
    expect(mockedGetChartCalculationPreferences()).not.toHaveBeenCalled()
    expect(mockedBuildChartData()).not.toHaveBeenCalled()
    expect(mockedSaveChart()).not.toHaveBeenCalled()
    expect(mockedBuildDailyGuidance()).not.toHaveBeenCalled()
    expect(mockedBuildWeeklyForecast()).not.toHaveBeenCalled()
  })

  it('renders a collapsed Today’s Energy summary by default', async () => {
    const screen = await renderScreen()

    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Moon in Virgo | Sun in Taurus')
    expectText(screen, 'Mood')
    expectText(screen, 'A practical mood supports thoughtful adjustment.')
    expectText(screen, 'Transit summary')
    expectText(screen, 'Moon squares natal Mars within 0.75°.')
    expectExpanded(screen, 'today-energy-toggle', false)
    expectNoText(screen, 'Watch for')
    expectNoText(screen, 'Opportunity')
    expectNoText(screen, 'Reflection')
    expectNoText(screen, 'Journal this reflection')
  })

  it('expands and collapses Today’s Energy details', async () => {
    const screen = await renderScreen()
    const showTodayDetails = findPressableByAccessibilityLabel(
      screen,
      'Expand Today’s Energy details'
    )
    expect(showTodayDetails.props.accessibilityState).toEqual({
      expanded: false,
    })

    await act(async () => {
      showTodayDetails.props.onPress()
    })

    expectText(screen, 'Watch for')
    expectText(screen, 'Opportunity')
    expectText(screen, 'Reflection')
    expectText(screen, 'Use the friction')
    expectText(screen, 'Deeper layer')
    expectText(screen, 'Use this as reflection, not a diagnosis.')
    expectText(screen, 'Grounding practice')
    expectText(screen, 'Single-task reset')
    expectText(screen, 'Journal this reflection')
    expectNoText(screen, 'Life area')
    expect(pressHandlersByText(screen, 'Journal this reflection')).toHaveLength(1)
    expect(pressHandlersByText(screen, 'Journal this')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal shadow reflection')).toHaveLength(0)
    expectNoText(screen, 'Shadow reflection')
    expectNoText(screen, 'Journal shadow reflection')
    expectExpanded(screen, 'today-energy-toggle', true)

    const hideTodayDetails = findPressableByAccessibilityLabel(
      screen,
      'Collapse Today’s Energy details'
    )
    expect(hideTodayDetails.props.accessibilityState).toEqual({
      expanded: true,
    })

    await act(async () => {
      hideTodayDetails.props.onPress()
    })

    expectExpanded(screen, 'today-energy-toggle', false)
    expectNoText(screen, 'Watch for')
    expectNoText(screen, 'Reflection')
    expectNoText(screen, 'Journal this reflection')
  })

  it('renders the primary transit life area only in expanded Today’s Energy', async () => {
    mockedBuildDailyGuidance().mockReturnValue(
      makeDailyGuidance({
        transitHouse: {
          house: 10,
          guidance: HOUSE_GUIDANCE[10],
        },
      })
    )
    const screen = await renderScreen()

    expectNoText(screen, 'Life area')
    expectNoText(screen, 'House 10')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Today’s Energy details'
      ).props.onPress()
    })

    expectText(screen, 'Life area')
    expectText(screen, 'House 10')
    expectText(screen, HOUSE_GUIDANCE[10].focus)
  })

  it('collapses Today’s Energy from the bottom control', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Today’s Energy details'
      ).props.onPress()
    })

    const bottomCollapse = findPressableByTestId(
      screen,
      'today-energy-bottom-collapse'
    )
    expect(bottomCollapse.props.accessibilityRole).toBe('button')
    expect(bottomCollapse.props.accessibilityState).toEqual({
      expanded: true,
    })
    expect(bottomCollapse.props.accessibilityLabel).toBe(
      'Collapse Today’s Energy details'
    )
    expect(
      bottomCollapse
        .findAllByType(Text)
        .some(
          (node) =>
            textValue(node.props.children) === 'Collapse'
        )
    ).toBe(true)

    await act(async () => {
      bottomCollapse.props.onPress()
    })

    findPressableByAccessibilityLabel(
      screen,
      'Expand Today’s Energy details'
    )
    expectNoText(screen, 'Watch for')
    expectNoText(screen, 'Reflection')
    expectNoText(screen, 'Journal this reflection')
    expectExpanded(screen, 'today-energy-toggle', false)
  })

  it('opens a prefilled journal entry from Today’s Energy reflection', async () => {
    const screen = await renderScreen()
    const showTodayDetails = findPressableByAccessibilityLabel(
      screen,
      'Expand Today’s Energy details'
    )

    await act(async () => {
      showTodayDetails.props.onPress()
    })

    const handlers = pressHandlersByText(screen, 'Journal this reflection')
    const openTodayPrompt = handlers[0]

    expect(handlers).toHaveLength(1)
    if (!openTodayPrompt) throw new Error('Missing Today’s Energy journal CTA')

    await act(async () => {
      openTodayPrompt()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {
      id: undefined,
      initialTitle: 'Reflection — Today’s Energy',
      initialContent: '',
      promptTemplateId: 'guidance.prompt.friction-adjustment',
      promptSource: 'Today’s Energy',
      promptText: 'What recurring friction is asking for an adjustment?',
      practiceSummary: 'Reduce noise by completing one bounded task.',
      practiceSteps: ['Choose one task.', 'Work only on that task.'],
    })
    expectExpanded(screen, 'today-energy-toggle', true)
    expect(
      findPressableByAccessibilityLabel(
        screen,
        'Collapse Today’s Energy details'
      ).props.accessibilityState
    ).toEqual({ expanded: true })
  })

  it('does not render a separate Today’s Energy shadow action', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Today’s Energy details'
      ).props.onPress()
    })

    expectText(screen, 'Reflection')
    expectText(screen, 'Use this as reflection, not a diagnosis.')
    expectText(screen, 'Journal this reflection')
    expectNoText(screen, 'Shadow reflection')
    expectNoText(screen, 'Journal shadow reflection')
    expect(pressHandlersByText(screen, 'Journal this')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal shadow reflection')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal this reflection')).toHaveLength(1)
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
    expectText(
      screen,
      'No tight personal transit aspect is emphasized right now.'
    )
    expectExpanded(screen, 'today-energy-toggle', false)
    expectNoText(screen, 'Watch for')
    expectNoText(screen, 'Reflection')
  })

  it('renders a collapsed weekly forecast summary by default', async () => {
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    expectText(screen, 'Weekly Forecast')
    expectText(screen, 'May 11, 2026 - May 17, 2026')
    expectText(screen, 'Weekly pattern')
    expectText(screen, 'Adjustments to make')
    expectText(screen, 'Strongest transit')
    expectText(screen, 'Moon square natal Mars')
    expectExpanded(screen, 'weekly-forecast-toggle', false)
    expectNoText(screen, 'Daily rhythm')
    expectNoText(screen, 'Underlying transits')
    expectNoText(screen, 'Weekly reflection')
    expectNoText(screen, 'Journal weekly reflection')
  })

  it('expands and collapses Weekly Forecast details', async () => {
    const screen = await renderScreen()
    await selectTab(screen, 'week')
    const rhythmDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const rhythmThemes = [
      'Moon square natal Mars',
      'Mercury sextile natal Sun',
      'Venus trine natal Moon',
      'Mars square natal Mercury',
      'Sun conjunct natal Venus',
      'Moon trine natal Jupiter',
      'Mercury conjunct natal Saturn',
    ]
    const rhythmSummaries = rhythmThemes.map(
      (_, index) => `Day ${index + 1} rhythm summary.`
    )
    const showWeeklyDetails = findPressableByAccessibilityLabel(
      screen,
      'Expand Weekly Forecast details'
    )
    expect(showWeeklyDetails.props.accessibilityState).toEqual({
      expanded: false,
    })

    await act(async () => {
      showWeeklyDetails.props.onPress()
    })

    expectText(screen, 'Weekly pattern')
    expectText(screen, 'Daily rhythm')
    rhythmDays.forEach((day) => expectText(screen, day))
    rhythmThemes.forEach((theme) => expectText(screen, theme))
    rhythmSummaries.forEach((summary) => expectText(screen, summary))
    const rhythmRowIds = new Set(
      screen.root
        .findAll(
          (node) =>
            typeof node.props.testID === 'string' &&
            node.props.testID.startsWith('weekly-rhythm-')
        )
        .map((node) => node.props.testID)
    )
    expect([...rhythmRowIds]).toEqual([
      'weekly-rhythm-2026-05-11',
      'weekly-rhythm-2026-05-12',
      'weekly-rhythm-2026-05-13',
      'weekly-rhythm-2026-05-14',
      'weekly-rhythm-2026-05-15',
      'weekly-rhythm-2026-05-16',
      'weekly-rhythm-2026-05-17',
    ])
    expectText(screen, 'Underlying transits')
    expectText(screen, 'Weekly reflection')
    expectText(screen, 'Use the friction')
    expectText(screen, 'Deeper layer')
    expectText(screen, 'Use this as reflection, not a diagnosis.')
    expectText(screen, 'Grounding practice')
    expectText(screen, 'Single-task reset')
    expectText(screen, 'Journal weekly reflection')
    expect(pressHandlersByText(screen, 'Journal weekly reflection')).toHaveLength(1)
    expect(pressHandlersByText(screen, 'Journal this')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal shadow reflection')).toHaveLength(0)
    expectNoText(screen, 'Shadow reflection for the week')
    expectNoText(screen, 'Journal shadow reflection')
    expectExpanded(screen, 'weekly-forecast-toggle', true)

    const hideWeeklyDetails = findPressableByAccessibilityLabel(
      screen,
      'Collapse Weekly Forecast details'
    )
    expect(hideWeeklyDetails.props.accessibilityState).toEqual({
      expanded: true,
    })

    await act(async () => {
      hideWeeklyDetails.props.onPress()
    })

    expectText(screen, 'Weekly pattern')
    expectExpanded(screen, 'weekly-forecast-toggle', false)
    expectNoText(screen, 'Weekly reflection')
    expectNoText(screen, 'Journal weekly reflection')
  })

  it('collapses Weekly Forecast from the bottom control', async () => {
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Weekly Forecast details'
      ).props.onPress()
    })

    const bottomCollapse = findPressableByTestId(
      screen,
      'weekly-forecast-bottom-collapse'
    )
    expect(bottomCollapse.props.accessibilityRole).toBe('button')
    expect(bottomCollapse.props.accessibilityState).toEqual({
      expanded: true,
    })
    expect(bottomCollapse.props.accessibilityLabel).toBe(
      'Collapse Weekly Forecast details'
    )
    expect(
      bottomCollapse
        .findAllByType(Text)
        .some(
          (node) =>
            textValue(node.props.children) === 'Collapse'
        )
    ).toBe(true)

    await act(async () => {
      bottomCollapse.props.onPress()
    })

    findPressableByAccessibilityLabel(
      screen,
      'Expand Weekly Forecast details'
    )
    expectText(screen, 'Weekly pattern')
    expectNoText(screen, 'Weekly reflection')
    expectNoText(screen, 'Journal weekly reflection')
    expectExpanded(screen, 'weekly-forecast-toggle', false)
  })

  it('uses representative fields for the Weekly Forecast journal handoff', async () => {
    const representative = makeDailyGuidance()
    const aggregatePrompt = {
      ...representative.reflectionPrompt,
      id: 'guidance.prompt.aggregate-only',
      title: 'Aggregated daily prompt',
      prompt: 'Which daily detail stands out?',
    }
    const aggregatePractice = {
      ...representative.suggestedPractice,
      id: 'guidance.practice.aggregate-only',
      title: 'Aggregated daily practice',
      summary: 'Use the first daily practice instead.',
    }
    mockedBuildWeeklyForecast().mockReturnValue(
      makeWeeklyForecast({
        journalPrompts: [aggregatePrompt],
        suggestions: [aggregatePractice],
        representativePrompt: representative.reflectionPrompt,
        representativePractice: representative.suggestedPractice,
      })
    )
    const screen = await renderScreen()
    await selectTab(screen, 'week')
    const showWeeklyDetails = findPressableByAccessibilityLabel(
      screen,
      'Expand Weekly Forecast details'
    )

    await act(async () => {
      showWeeklyDetails.props.onPress()
    })

    const handlers = pressHandlersByText(screen, 'Journal weekly reflection')
    const openWeeklyPrompt = handlers[0]

    expect(handlers).toHaveLength(1)
    if (!openWeeklyPrompt) throw new Error('Missing Weekly Forecast journal CTA')

    expectText(screen, representative.reflectionPrompt.title)
    expectText(screen, representative.suggestedPractice.title)
    expectNoText(screen, aggregatePrompt.title)
    expectNoText(screen, aggregatePractice.title)

    await act(async () => {
      openWeeklyPrompt()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {
      id: undefined,
      initialTitle: 'Reflection — Weekly Forecast',
      initialContent: '',
      promptTemplateId: 'guidance.prompt.friction-adjustment',
      promptSource: 'Weekly Forecast',
      promptText: 'What recurring friction is asking for an adjustment?',
      practiceSummary: 'Reduce noise by completing one bounded task.',
      practiceSteps: ['Choose one task.', 'Work only on that task.'],
    })
    expectExpanded(screen, 'weekly-forecast-toggle', true)
    expectNoText(screen, 'Top theme')
    expect(
      findPressableByAccessibilityLabel(
        screen,
        'Collapse Weekly Forecast details'
      ).props.accessibilityState
    ).toEqual({ expanded: true })
  })

  it('renders concise day-specific house context in Weekly Daily rhythm', async () => {
    const forecast = makeWeeklyForecast()
    mockedBuildWeeklyForecast().mockReturnValue(
      makeWeeklyForecast({
        dailyThemes: forecast.dailyThemes.map((day, index) => ({
          ...day,
          transitHouse:
            index === 0
              ? { house: 10, guidance: HOUSE_GUIDANCE[10] }
              : null,
        })),
      })
    )
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    expectNoText(screen, 'House 10')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Weekly Forecast details'
      ).props.onPress()
    })

    expectText(screen, `House 10 · ${HOUSE_GUIDANCE[10].focus}`)
    expectText(screen, 'Mon')
    expectText(screen, forecast.dailyThemes[0].title)
    expectText(screen, forecast.dailyThemes[0].summary)
    const houseContext = screen.root.find(
      (node) =>
        node.props.testID === 'weekly-rhythm-house-2026-05-11'
    )

    // Day-specific house context wraps rather than clipping. A two-line clamp
    // loses the end of the sentence as soon as the font scale grows.
    expect(houseContext.props.numberOfLines).toBeUndefined()
  })

  it('labels multi-day weekly transit persistence as sampled days', async () => {
    const daily = makeDailyGuidance()
    mockedBuildWeeklyForecast().mockReturnValue(
      makeWeeklyForecast({
        strongestTransits: [
          {
            ...daily.primaryTransit!,
            date: '2026-05-11',
            activeDays: 6,
            significanceScore: 62,
          },
        ],
      })
    )
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Weekly Forecast details'
      ).props.onPress()
    })

    expectText(screen, 'Active on 6 of 7 sampled days')
    expectNoText(screen, '6 snapshots')
  })

  it('does not render a separate weekly shadow action', async () => {
    const screen = await renderScreen()
    await selectTab(screen, 'week')

    await act(async () => {
      findPressableByAccessibilityLabel(
        screen,
        'Expand Weekly Forecast details'
      ).props.onPress()
    })

    expectText(screen, 'Weekly reflection')
    expectText(screen, 'Use this as reflection, not a diagnosis.')
    expectText(screen, 'Journal weekly reflection')
    expectNoText(screen, 'Shadow reflection for the week')
    expectNoText(screen, 'Journal shadow reflection')
    expect(pressHandlersByText(screen, 'Journal this')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal shadow reflection')).toHaveLength(0)
    expect(pressHandlersByText(screen, 'Journal weekly reflection')).toHaveLength(1)
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
    await selectTab(screen, 'week')

    expectText(screen, 'Weekly Forecast')
    expectText(screen, 'Background rhythm')
    expectText(
      screen,
      'guided more by the changing Sun and Moon background tone'
    )
    expectText(screen, 'No tight personal transit highlights this week.')
    expectExpanded(screen, 'weekly-forecast-toggle', false)
    expectNoText(screen, 'Weekly reflection')
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
    expect(mockedBuildDailyGuidance()).toHaveBeenCalledWith({
      natalPlanets: fallbackChart.planets,
      natalHouses: fallbackChart.houses,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expect(mockedBuildWeeklyForecast()).toHaveBeenCalledWith({
      natalPlanets: fallbackChart.planets,
      natalHouses: fallbackChart.houses,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
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
    expect(mockedBuildDailyGuidance()).toHaveBeenCalledWith({
      natalPlanets: builtChart.planets,
      natalHouses: null,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expect(mockedBuildWeeklyForecast()).toHaveBeenCalledWith({
      natalPlanets: builtChart.planets,
      natalHouses: null,
      evaluatedAt: expect.any(Date),
      timeZone: completeUser.time_zone,
    })
    expectText(screen, 'Pisces')
    expectText(screen, 'Aries')
  })
})
