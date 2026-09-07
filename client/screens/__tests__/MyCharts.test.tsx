import React from 'react'
import { Alert, StyleSheet } from 'react-native'
import TestRenderer from 'react-test-renderer'

import MyChartsScreen from '../MyCharts'
import ChartWheel from '../../components/charts/ChartWheel'
import { Button } from '../../components/ui/Button'
import { deleteChart, listCharts } from '../../lib/charts'
import { validateChartData } from '../../lib/chartDataValidation'
import supabase from '../../lib/supabase'

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
}

let focusCallback: (() => void) | null = null

jest.mock('@react-navigation/native', () => {
  const React = require('react')

  return {
    useNavigation: () => mockNavigation,
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        focusCallback = callback
        return callback()
      }, [callback])
    },
  }
})

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

/**
 * Controls are matched by what they announce, not by which component renders
 * them. The open control's label now carries the row's summary after the
 * name, so the match is on the leading identity rather than the whole string.
 */
function findByAccessibilityLabel(
  screen: ReturnType<typeof create>,
  label: string
) {
  const matches = screen.root.findAll(
    (node) =>
      typeof node.type !== 'string' &&
      typeof node.props?.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith(label) &&
      typeof node.props?.onPress === 'function'
  )

  if (matches.length === 0) {
    throw new Error(`no control announcing "${label}"`)
  }

  return matches[0]
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

    // Legacy (unversioned), current and no-coordinate rows all render their
    // birth moment. The date is built from the stored 'YYYY-MM-DD' fields, so
    // it reads as the 15th on every device rather than shifting westward.
    expect(
      texts.filter((t) => t.startsWith('15 Sep 1997 · '))
    ).toHaveLength(3)

    // The row used to print the whole database record. None of it survives:
    // the zone and the coordinates are still stored and still drive every
    // calculation, they are simply not what tells two saved charts apart.
    expect(texts.some((t) => t.includes('(37.49, -122.23)'))).toBe(false)
    expect(texts.some((t) => t.includes('America/Los_Angeles'))).toBe(false)
    expect(texts.some((t) => t.includes('13:55:00'))).toBe(false)
    expect(texts.some((t) => t.includes('1997-09-15'))).toBe(false)

    // Unreadable rows still say so, and still say which kind of unreadable.
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
    expect(texts).toContain('Go back')

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

describe('MyCharts thumbnails', () => {
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

  it('draws a wheel only for rows whose data is readable', async () => {
    mockedListCharts.mockResolvedValue([
      chartRow(1, 'Current', CURRENT_DATA),
      chartRow(3, 'Future', FUTURE_DATA),
      chartRow(4, 'Broken', MALFORMED_DATA),
    ])

    const screen = await renderScreen()
    const wheels = screen.root.findAllByType(ChartWheel)

    // One readable row, one wheel. Unsupported and malformed rows get the
    // placeholder instead -- drawing them would mean trusting data the
    // validator just rejected.
    expect(wheels).toHaveLength(1)
  })

  it('renders the thumbnail from the already-validated data', async () => {
    const screen = await renderScreen()
    const wheel = screen.root.findByType(ChartWheel)

    expect(wheel.props.planets).toBe(CHART_ROW.chart_data.planets)
    expect(wheel.props.aspects).toBe(CHART_ROW.chart_data.aspects)
    expect(wheel.props.houses).toBe(CHART_ROW.chart_data.houses)
  })

  it('leaves the thumbnail completely inert', async () => {
    const screen = await renderScreen()
    const wheel = screen.root.findByType(ChartWheel)

    // Omitting these is what makes it inert: ChartWheel returns the bare SVG
    // and mounts no touch target, and with nothing selected it starts no
    // animation. Passing any of them would put an interactive, animating
    // chart inside every row of a scrolling list.
    expect(wheel.props.onSelectPlanet).toBeUndefined()
    expect(wheel.props.onSelectAspect).toBeUndefined()
    expect(wheel.props.selection).toBeUndefined()
    expect(wheel.props.focusedPlanet).toBeUndefined()

    // No planet control reached the list.
    expect(
      screen.root.findAll(
        (node) =>
          typeof node.props?.testID === 'string' &&
          node.props.testID.startsWith('wheel-planet-')
      )
    ).toHaveLength(0)
  })

  it('hides the thumbnail from assistive technology', async () => {
    const screen = await renderScreen()
    const wheel = screen.root.findByType(ChartWheel)
    const wrapper = wheel.parent

    expect(wrapper?.props.accessible).toBe(false)
    expect(wrapper?.props.accessibilityElementsHidden).toBe(true)
    expect(wrapper?.props.importantForAccessibility).toBe(
      'no-hide-descendants'
    )
  })

  it('validates once per load however many rows are drawn', async () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      chartRow(i + 1, `Chart ${i + 1}`, CURRENT_DATA)
    )
    mockedListCharts.mockResolvedValue(rows)

    const screen = await renderScreen()

    // Twelve rows, twelve validations -- the thumbnails read the memoised
    // result and never parse again, however often the list re-renders.
    expect(mockedValidate).toHaveBeenCalledTimes(rows.length)
    expect(screen.root.findAllByType(ChartWheel).length).toBeGreaterThan(0)

    const after = mockedValidate.mock.calls.length
    act(() => {
      screen.update(<MyChartsScreen />)
    })
    expect(mockedValidate).toHaveBeenCalledTimes(after)
  })
})

describe('MyCharts creation action', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    renderer = null
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

  function creationControls(screen: ReturnType<typeof create>) {
    return screen.root.findAll(
      (node) =>
        typeof node.type !== 'string' &&
        typeof node.props?.onPress === 'function' &&
        (node.props?.accessibilityLabel === 'Create a new chart' ||
          node.props?.title === 'Create a chart')
    )
  }

  it('offers the header action when the list has entries, and only that', async () => {
    const screen = await renderScreen()

    expect(hostTexts(screen)).toContain('New')
    expect(hostTexts(screen)).not.toContain('Create a chart')
    expect(creationControls(screen)).toHaveLength(1)
  })

  it('offers the empty-state action when the list is empty, and only that', async () => {
    mockedListCharts.mockResolvedValue([])
    const screen = await renderScreen()

    expect(hostTexts(screen)).toContain('Create a chart')
    expect(hostTexts(screen)).not.toContain('New')
    expect(creationControls(screen)).toHaveLength(1)
  })

  it('sends both to the same place', async () => {
    const populated = await renderScreen()
    await act(async () => {
      creationControls(populated)[0].props.onPress()
      await settleAsyncWork()
    })
    const fromHeader = [...mockNavigation.navigate.mock.calls]

    act(() => populated.unmount())
    renderer = null
    mockNavigation.navigate.mockClear()

    mockedListCharts.mockResolvedValue([])
    const empty = await renderScreen()
    await act(async () => {
      creationControls(empty)[0].props.onPress()
      await settleAsyncWork()
    })

    expect(fromHeader).toEqual([['CreateGuestChart']])
    expect(mockNavigation.navigate.mock.calls).toEqual(fromHeader)
  })

  it('fetches once on arrival, not twice', async () => {
    await renderScreen()

    // Focus fires on mount as well as on return, so pairing it with a mount
    // effect would load the list twice on the way in.
    expect(mockedListCharts).toHaveBeenCalledTimes(1)
  })

  it('reloads when the screen is focused again', async () => {
    await renderScreen()
    expect(mockedListCharts).toHaveBeenCalledTimes(1)

    await act(async () => {
      focusCallback?.()
      await settleAsyncWork()
    })

    expect(mockedListCharts).toHaveBeenCalledTimes(2)
  })
})

describe('MyCharts deletion routes', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    renderer = null
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

  /*
   * Three ways in, one confirmation.
   *
   * The trailing icon, the long press and the assistive action all reach the
   * same function, so no route into deleting a saved chart can skip the
   * prompt -- the arrangement the Journal list uses.
   */
  it('confirms through the trailing icon', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Delete Vinal Natal Chart'
      ).props.onPress()
      await settleAsyncWork()
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete chart?',
      'Vinal Natal Chart',
      expect.any(Array)
    )
    expect(mockedDeleteChart).not.toHaveBeenCalled()
  })

  it('confirms through a long press on the row', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Open Vinal Natal Chart'
      ).props.onLongPress()
      await settleAsyncWork()
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete chart?',
      'Vinal Natal Chart',
      expect.any(Array)
    )
    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })

  it('confirms through the assistive delete action', async () => {
    const screen = await renderScreen()
    const row = findByAccessibilityLabel(screen, 'Open Vinal Natal Chart')

    expect(row.props.accessibilityActions).toEqual([
      { name: 'delete', label: 'Delete chart' },
    ])

    await act(async () => {
      row.props.onAccessibilityAction({
        nativeEvent: { actionName: 'delete' },
      })
      await settleAsyncWork()
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete chart?',
      'Vinal Natal Chart',
      expect.any(Array)
    )
  })

  it('ignores assistive actions it does not own', async () => {
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Open Vinal Natal Chart'
      ).props.onAccessibilityAction({
        nativeEvent: { actionName: 'activate' },
      })
      await settleAsyncWork()
    })

    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('keeps the row when the delete itself fails', async () => {
    mockedDeleteChart.mockRejectedValueOnce(new Error('Network unreachable'))
    const screen = await renderScreen()

    await act(async () => {
      findByAccessibilityLabel(
        screen,
        'Delete Vinal Natal Chart'
      ).props.onPress()
      await settleAsyncWork()
    })

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0]
    const confirm = buttons.find((b: any) => b.style === 'destructive')

    await act(async () => {
      await confirm.onPress()
      await settleAsyncWork()
    })

    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Delete failed',
      'Network unreachable'
    )
    // Still listed: a failed delete must not look like a successful one.
    expect(
      findByAccessibilityLabel(screen, 'Open Vinal Natal Chart')
    ).toBeTruthy()
  })

  it('gives the delete control a real touch target', async () => {
    const screen = await renderScreen()
    const del = findByAccessibilityLabel(screen, 'Delete Vinal Natal Chart')
    const style = StyleSheet.flatten(
      typeof del.props.style === 'function'
        ? del.props.style({ pressed: false })
        : del.props.style
    ) as Record<string, number>

    expect(style.minHeight).toBeGreaterThanOrEqual(48)
    expect(style.minWidth).toBeGreaterThanOrEqual(48)
  })
})

describe('MyCharts list cost', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    renderer = null
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

  /*
   * Every row draws a whole chart, so the number of mounted wheels must not
   * follow the number of saved charts. Windowing is the entire mitigation:
   * measured across 1, 10, 50 and 100 rows the mounted count stays at six and
   * render time stays flat -- 100 rows cost no more than 10.
   *
   * Asserted structurally rather than by timing, which would be flaky, and by
   * the count rather than the props, which would pass even if FlatList
   * stopped honouring them.
   */
  it('keeps mounted wheels bounded however many charts are saved', async () => {
    for (const count of [10, 50, 100]) {
      mockedListCharts.mockResolvedValue(
        Array.from({ length: count }, (_, i) =>
          chartRow(i + 1, `Chart ${i + 1}`, CURRENT_DATA)
        )
      )

      const screen = await renderScreen()
      const wheels = screen.root.findAllByType(ChartWheel).length

      expect(wheels).toBeLessThanOrEqual(10)
      expect(wheels).toBeGreaterThan(0)

      act(() => {
        screen.unmount()
      })
      renderer = null
    }
  })
})
