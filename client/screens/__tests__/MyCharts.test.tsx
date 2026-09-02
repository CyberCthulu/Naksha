import React from 'react'
import { Alert, TouchableOpacity } from 'react-native'
import TestRenderer from 'react-test-renderer'

import MyChartsScreen from '../MyCharts'
import { Button } from '../../components/ui/Button'
import { deleteChart, listCharts } from '../../lib/charts'
import { validateChartData } from '../../lib/chartDataValidation'
import supabase from '../../lib/supabase'

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: { auth: { getUser: jest.fn() } },
}))

jest.mock('../../lib/chartDataValidation', () => {
  const actual = jest.requireActual('../../lib/chartDataValidation')
  return {
    __esModule: true,
    ...actual,
    validateChartData: jest.fn(actual.validateChartData),
  }
})

jest.mock('../../lib/charts', () => ({
  __esModule: true,
  listCharts: jest.fn(),
  deleteChart: jest.fn(),
}))

const { act, create } = TestRenderer

const mockedValidate = validateChartData as jest.Mock
const mockedListCharts = listCharts as jest.Mock
const mockedDeleteChart = deleteChart as jest.Mock
const mockedGetUser = (supabase as unknown as {
  auth: { getUser: jest.Mock }
}).auth.getUser

const CHART_ROW = {
  id: 7,
  user_id: 'user-1',
  name: 'Vinal Natal Chart',
  birth_date: '1997-09-15',
  birth_time: '13:55:00',
  time_zone: 'America/Los_Angeles',
  birth_lat: 37.49,
  birth_lon: -122.23,
  chart_data: {
    meta: {
      name: 'Vinal Natal Chart',
      birth_date: '1997-09-15',
      birth_time: '13:55:00',
      time_zone: 'America/Los_Angeles',
      birth_lat: 37.49,
      birth_lon: -122.23,
      computed_at: '2026-01-01T00:00:00.000Z',
      instant_utc: '1997-09-15T20:55:00.000Z',
    },
    planets: [{ name: 'Sun', lon: 172.5 }],
    aspects: [],
    houses: null,
    planet_houses: null,
  },
}

function chartRow(
  id: number,
  name: string,
  chartData: unknown,
  overrides: Record<string, unknown> = {}
) {
  return { ...CHART_ROW, id, name, chart_data: chartData, ...overrides }
}

const LEGACY_DATA = {
  meta: { ...CHART_ROW.chart_data.meta, name: 'Legacy Chart' },
  planets: [{ name: 'Sun', lon: 10 }],
  aspects: [],
  houses: null,
  planet_houses: null,
}

const CURRENT_DATA = { ...LEGACY_DATA, schema_version: 1, calculation_version: 1 }

const FUTURE_DATA = { ...LEGACY_DATA, schema_version: 2, calculation_version: 1 }

const MALFORMED_DATA = { meta: { birth_date: 5 }, planets: 'nope' }

const NO_COORDS_DATA = {
  ...LEGACY_DATA,
  meta: { ...LEGACY_DATA.meta, birth_lat: null, birth_lon: null },
}

let renderer: ReturnType<typeof create> | null = null

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<MyChartsScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('MyCharts did not render')
  return renderer
}

function hostTexts(screen: ReturnType<typeof create>): string[] {
  return screen.root
    .findAll((node) => String(node.type) === 'Text')
    .map((node) => node.children.filter((c) => typeof c === 'string').join(''))
}

function findByAccessibilityLabel(
  screen: ReturnType<typeof create>,
  label: string
) {
  return screen.root.find(
    (node) =>
      node.type === TouchableOpacity && node.props.accessibilityLabel === label
  )
}

describe('MyCharts row interactions', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())

    renderer = null
    mockedValidate.mockClear()
    mockedGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockedListCharts.mockResolvedValue([CHART_ROW])
    mockedDeleteChart.mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => {
        mounted.unmount()
      })
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('opens the chart when the chart region is pressed', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Open Vinal Natal Chart'
      ).props.onPress()
      await settleAsyncWork()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledTimes(1)
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'Chart',
      expect.objectContaining({ fromSaved: true })
    )
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('renders the chart region and delete control as siblings', async () => {
    const screen = await renderScreen()

    const open = findByAccessibilityLabel(screen, 'Open Vinal Natal Chart')
    const del = findByAccessibilityLabel(screen, 'Delete Vinal Natal Chart')
    expect(del).toBeTruthy()

    // D-05 regression guard: delete must not live inside the chart-opening
    // touchable. Nested touchables are unreliable on Android, and the old
    // code leaned on stopPropagation, which is not the RN responder mechanism.
    const nested = open.findAll(
      (node) =>
        node.props?.accessibilityLabel === 'Delete Vinal Natal Chart',
      { deep: true }
    )
    expect(nested).toHaveLength(0)
  })

  it('confirms deletion without ever navigating to the chart', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Delete Vinal Natal Chart'
      ).props.onPress()
      await settleAsyncWork()
    })

    // D-05 regression guard: delete used to be nested inside the row's own
    // touchable and relied on stopPropagation, which is not the React Native
    // responder mechanism. Delete must never open the chart.
    expect(mockNavigation.navigate).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledTimes(1)
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete chart?',
      'Vinal Natal Chart',
      expect.any(Array)
    )
  })

  it('deletes and reloads only after the destructive action is confirmed', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Delete Vinal Natal Chart'
      ).props.onPress()
      await settleAsyncWork()
    })

    expect(mockedDeleteChart).not.toHaveBeenCalled()

    const actions = (Alert.alert as unknown as jest.Mock).mock.calls[0][2]
    const confirm = actions.find(
      (action: { text: string }) => action.text === 'Delete'
    )
    expect(confirm.style).toBe('destructive')

    mockedListCharts.mockClear()

    await act(async () => {
      await confirm.onPress()
      await settleAsyncWork()
    })

    expect(mockedDeleteChart).toHaveBeenCalledWith(7, 'user-1')
    expect(mockedListCharts).toHaveBeenCalled()
    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })

  it('preserves legacy, current, unsupported, malformed and no-coordinate rows', async () => {
    mockedListCharts.mockResolvedValue([
      chartRow(1, 'Legacy', LEGACY_DATA),
      chartRow(2, 'Current', CURRENT_DATA),
      chartRow(3, 'Future', FUTURE_DATA),
      chartRow(4, 'Broken', MALFORMED_DATA),
      chartRow(5, 'NoCoords', NO_COORDS_DATA),
    ])

    const screen = await renderScreen()
    const texts = hostTexts(screen)

    // Legacy (unversioned) and current both render their birth summary.
    expect(
      texts.filter((t) =>
        t.startsWith('1997-09-15 · 13:55:00 · America/Los_Angeles')
      )
    ).toHaveLength(3)
    // Coordinates appear only where both are present.
    expect(
      texts.filter((t) => t.includes('(37.49, -122.23)'))
    ).toHaveLength(2)
    expect(texts).toContain('Update Naksha to view this chart')
    expect(texts).toContain('Chart data unavailable')
  })

  it('refuses to open unsupported and malformed charts', async () => {
    mockedListCharts.mockResolvedValue([
      chartRow(3, 'Future', FUTURE_DATA),
      chartRow(4, 'Broken', MALFORMED_DATA),
    ])
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(screen, 'Open Future').props.onPress()
      await settleAsyncWork()
    })
    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Chart update required',
      expect.stringContaining('does not support')
    )

    await act(async () => {
      findByAccessibilityLabel(screen, 'Open Broken').props.onPress()
      await settleAsyncWork()
    })
    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Chart unavailable',
      'This saved chart data could not be read. Recreate the chart to open it again.'
    )

    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })

  it('validates each row once per load and not again when opening', async () => {
    mockedListCharts.mockResolvedValue([
      chartRow(1, 'Legacy', LEGACY_DATA),
      chartRow(2, 'Current', CURRENT_DATA),
    ])

    const screen = await renderScreen()

    // D-07 regression guard: validation is derived from the rows collection,
    // so two rows cost exactly two validations no matter how many times the
    // screen re-renders.
    expect(mockedValidate).toHaveBeenCalledTimes(2)

    await act(async () => {
      findByAccessibilityLabel(screen, 'Open Legacy').props.onPress()
      await settleAsyncWork()
    })

    // Opening reuses the derived result rather than revalidating.
    expect(mockedValidate).toHaveBeenCalledTimes(2)
    expect(mockNavigation.navigate).toHaveBeenCalledTimes(1)
  })

  it('revalidates after a reload so rows are never stale', async () => {
    mockedListCharts.mockResolvedValue([chartRow(1, 'Legacy', LEGACY_DATA)])
    const screen = await renderScreen()

    expect(mockedValidate).toHaveBeenCalledTimes(1)
    expect(hostTexts(screen)).toContain('Legacy')

    mockedListCharts.mockResolvedValue([chartRow(9, 'Replacement', CURRENT_DATA)])

    await act(async () => {
      findByAccessibilityLabel(screen, 'Delete Legacy').props.onPress()
      await settleAsyncWork()
    })
    const actions = (Alert.alert as unknown as jest.Mock).mock.calls[0][2]
    await act(async () => {
      await actions.find((a: { text: string }) => a.text === 'Delete').onPress()
      await settleAsyncWork()
    })

    const texts = hostTexts(screen)
    expect(texts).toContain('Replacement')
    expect(texts).not.toContain('Legacy')
    expect(mockedValidate).toHaveBeenCalledTimes(2)
  })

  it('offers a retry path from the error state', async () => {
    mockedListCharts.mockRejectedValueOnce(new Error('Network unreachable'))
    const screen = await renderScreen()

    const texts = hostTexts(screen)
    expect(texts).toContain('Network unreachable')

    // D-04 regression guard: the error branch used to render text only, with
    // no retry and no header, leaving system back as the only way out.
    expect(texts).toContain('Retry')
    expect(texts).toContain('Go Back')

    mockedListCharts.mockResolvedValueOnce([CHART_ROW])

    const retry = screen.root
      .findAllByType(Button)
      .find((node) => node.props.title === 'Retry')
    expect(retry).toBeTruthy()

    await act(async () => {
      retry!.props.onPress()
      await settleAsyncWork()
    })

    expect(
      findByAccessibilityLabel(screen, 'Open Vinal Natal Chart')
    ).toBeTruthy()
  })
})
