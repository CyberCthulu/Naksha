import React from 'react'
import TestRenderer from 'react-test-renderer'

import ChartScreenContent from '../ChartScreenContent'
import ChartWheel from '../ChartWheel'
import { theme } from '../../ui/theme'
import { SpaceProvider } from '../../space/SpaceProvider'
import useChartData from '../../../hooks/useChartData'

jest.mock('../../../hooks/useChartData', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 48, left: 0 }),
}))

const { act, create } = TestRenderer
const mockedUseChartData = useChartData as unknown as jest.Mock

const PLANETS = [
  { name: 'Sun', lon: 172.5 },
  { name: 'Moon', lon: 341.2 },
  { name: 'Mercury', lon: 200.1 },
]

const HOUSES = Array.from({ length: 12 }, (_, i) => ({
  house: i + 1,
  lon: i * 30,
}))

const PLANET_HOUSES = [
  { name: 'Sun', house: 10 },
  { name: 'Moon', house: 4 },
]

const ASPECTS = [
  { a: 'Sun', b: 'Moon', type: 'opp' as const, orb: 1.42 },
  { a: 'Sun', b: 'Mercury', type: 'conj' as const, orb: 0.31 },
]

const PROFILE = {
  first_name: 'Vinal',
  last_name: null,
  birth_date: '1997-09-15',
  birth_time: '13:55:00',
  birth_location: 'Redwood City, California, United States of America',
  time_zone: 'America/Los_Angeles',
  birth_lat: 37.49,
  birth_lon: -122.23,
}

function chartState(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    planets: PLANETS,
    aspects: ASPECTS,
    houses: HOUSES,
    planetHouses: PLANET_HOUSES,
    isSaved: false,
    canSaveChart: true,
    saveWarning: null,
    saveCurrentChart: jest.fn(),
    ...overrides,
  }
}

let renderer: ReturnType<typeof create> | null = null

function renderChart(props: Record<string, unknown> = {}) {
  act(() => {
    renderer = create(
      <SpaceProvider>
        <ChartScreenContent
          profile={PROFILE as never}
          chartMode="self"
          tz="America/Los_Angeles"
          {...props}
        />
      </SpaceProvider>
    )
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function byTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll((n) => n.props?.testID === testID)
}

describe('Chart section hierarchy', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockedUseChartData.mockReturnValue(chartState())
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => mounted.unmount())
    }
    renderer = null
  })

  it('renders the sections in the approved order', () => {
    const screen = renderChart()
    const order = ['positions', 'houses', 'compass', 'aspects']

    const indexes = order.map((name) => {
      const nodes = byTestID(screen, `chart-section-${name}`)
      expect(nodes.length).toBeGreaterThan(0)
      return JSON.stringify(screen.toJSON()).indexOf(`chart-section-${name}`)
    })

    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it('keeps the chart identity data intact', () => {
    const texts = hostTexts(renderChart())

    expect(texts).toContain(
      'Redwood City, California, United States of America'
    )
    expect(texts).toContain('America/Los_Angeles')
  })

  it('shows saved-chart coordinates, as before, only for saved charts', () => {
    const saved = {
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
      planets: PLANETS,
      aspects: ASPECTS,
      houses: HOUSES,
      planet_houses: PLANET_HOUSES,
    }

    const screen = renderChart({ fromSaved: true, saved })
    expect(hostTexts(screen).join(' ')).toContain('37.49, -122.23')
  })

  it('renders the wheel with unchanged behavioural inputs', () => {
    const wheel = renderChart().root.findByType(ChartWheel)

    expect(wheel.props.planets).toBe(PLANETS)
    expect(wheel.props.aspects).toBe(ASPECTS)
    expect(wheel.props.houses).toBe(HOUSES)
    expect(typeof wheel.props.size).toBe('number')
    expect(wheel.props.size).toBeGreaterThan(0)
  })

  it('drives the wheel accent from the focused planet', () => {
    // ChartScreenContent focuses the Sun on mount via SpaceProvider.
    const wheel = renderChart().root.findByType(ChartWheel)
    expect(wheel.props.focusedPlanet).toBe('Sun')
  })

  it('renders the hero placement under the wheel', () => {
    const screen = renderChart()

    expect(byTestID(screen, 'chart-hero').length).toBeGreaterThan(0)
    expect(hostTexts(screen).join(' ')).toContain('Sun in')
  })
})

describe('Chart content coverage', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockedUseChartData.mockReturnValue(chartState())
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => mounted.unmount())
    }
    renderer = null
  })

  it('keeps every planet row present and interactive', () => {
    const screen = renderChart()

    for (const planet of PLANETS) {
      const rows = byTestID(screen, `position-row-${planet.name}`)
      expect(rows.length).toBeGreaterThan(0)
      expect(typeof rows[0].props.onPress).toBe('function')
      expect(rows[0].props.accessibilityRole).toBe('button')
      expect(rows[0].props.accessibilityLabel).toContain(planet.name)
    }
  })

  it('keeps all twelve houses represented', () => {
    const screen = renderChart()

    for (let house = 1; house <= 12; house += 1) {
      expect(byTestID(screen, `house-row-${house}`).length).toBeGreaterThan(0)
    }
  })

  it('keeps planet pair, aspect type and orb for every aspect', () => {
    const screen = renderChart()
    const texts = hostTexts(screen).join(' ')

    expect(byTestID(screen, 'aspect-row-Sun-Moon').length).toBeGreaterThan(0)
    expect(byTestID(screen, 'aspect-row-Sun-Mercury').length).toBeGreaterThan(0)
    expect(texts).toContain('Opposition')
    expect(texts).toContain('Conjunction')
    expect(texts).toContain('1.42° orb')
    expect(texts).toContain('0.31° orb')
  })

  it('falls back safely when there are no aspects', () => {
    mockedUseChartData.mockReturnValue(chartState({ aspects: [] }))
    expect(hostTexts(renderChart())).toContain('None (within default orbs)')
  })

  it('falls back safely when houses are missing', () => {
    mockedUseChartData.mockReturnValue(
      chartState({ houses: null, planetHouses: null })
    )
    const texts = hostTexts(renderChart()).join(' ')

    expect(texts).toContain('Houses require a birth location')
    expect(texts).not.toContain('House 1')
  })
})

describe('Chart save and view-only states', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => mounted.unmount())
    }
    renderer = null
  })

  it('offers a save action for an unsaved self chart', () => {
    mockedUseChartData.mockReturnValue(chartState())
    const screen = renderChart()

    expect(byTestID(screen, 'chart-save-action').length).toBeGreaterThan(0)
    expect(hostTexts(screen)).toContain('Save Chart Data')
    expect(byTestID(screen, 'chart-status-saved')).toHaveLength(0)
  })

  it('uses the guest label for an unsaved guest chart', () => {
    mockedUseChartData.mockReturnValue(chartState())
    const screen = renderChart({ chartMode: 'guest' })

    expect(hostTexts(screen)).toContain('Save Chart')
  })

  it('shows saved state as status rather than a dead disabled button', () => {
    mockedUseChartData.mockReturnValue(chartState({ isSaved: true }))
    const screen = renderChart()

    expect(byTestID(screen, 'chart-status-saved').length).toBeGreaterThan(0)
    expect(hostTexts(screen)).toContain('Saved to My Charts')
    expect(byTestID(screen, 'chart-save-action')).toHaveLength(0)
  })

  it('shows view-only state with its explanation when coordinates are missing', () => {
    mockedUseChartData.mockReturnValue(
      chartState({ canSaveChart: false, houses: null, planetHouses: null })
    )
    const screen = renderChart()

    expect(byTestID(screen, 'chart-status-view-only').length).toBeGreaterThan(0)
    const texts = hostTexts(screen)
    expect(texts).toContain('View Only')
    expect(texts).toContain(
      'Add a birth location to save houses and chart data.'
    )
    expect(byTestID(screen, 'chart-save-action')).toHaveLength(0)
  })

  it('surfaces a self-chart save warning without hiding the chart', () => {
    mockedUseChartData.mockReturnValue(
      chartState({ saveWarning: 'Could not save your chart.' })
    )
    const screen = renderChart()

    expect(hostTexts(screen)).toContain('Could not save your chart.')
    expect(screen.root.findByType(ChartWheel)).toBeTruthy()
  })

  it('renders the loading state without the chart body', () => {
    mockedUseChartData.mockReturnValue(chartState({ loading: true }))
    const screen = renderChart()

    expect(hostTexts(screen).join(' ')).toContain('Loading chart')
    expect(screen.root.findAllByType(ChartWheel)).toHaveLength(0)
  })
})

describe('Chart typography and accent rules', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockedUseChartData.mockReturnValue(chartState())
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => mounted.unmount())
    }
    renderer = null
  })

  it('uses at most one planet accent across the surface', () => {
    const rendered = JSON.stringify(renderChart().toJSON())
    const used = Object.entries(theme.planet).filter(([, value]) =>
      rendered.includes(value)
    )

    expect(used.length).toBeLessThanOrEqual(1)
  })

  it('never truncates interpretation copy to a single line', () => {
    const screen = renderChart()
    const clamped = screen.root
      .findAll((n) => String(n.type) === 'Text')
      .map((n) => n.props.numberOfLines)
      .filter((n) => typeof n === 'number')

    // The only clamp on this screen is the header title, which is explicitly
    // allowed two lines. Position, house and aspect copy must wrap freely.
    expect(clamped).toEqual([2])
  })
})
