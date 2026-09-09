import React from 'react'
import { Modal, ScrollView } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ChartScreenContent from '../ChartScreenContent'
import ChartWheel from '../ChartWheel'
import { InteractiveChartWheel } from '../InteractiveChartWheel'
import InterpretationModal from '../InterpretationModal'
import { GLYPH_COMPASS_TRIGGER_CLEARANCE } from '../GlyphCompass'
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

// Screen behavior is independent of motion preferences; animation lifecycle
// and reduced-motion transitions have their own hook tests.
jest.mock('../../ui/useReducedMotion', () => ({
  useReducedMotion: () => true,
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

const NON_CHART_SCROLLS = ['glyph-compass-scroll']

function chartScroll(screen: ReturnType<typeof create>) {
  // The chart shares the tree with the wheel pan strip and, once open, the
  // legend panel. Only the outer vertical scroll is the chart document.
  const scrolls = screen.root
    .findAllByType(ScrollView)
    .filter((n) => !NON_CHART_SCROLLS.includes(n.props.testID))

  expect(scrolls).toHaveLength(1)
  return scrolls[0]
}

function byTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll((n) => n.props?.testID === testID)
}

type ChartTab = 'planets' | 'houses' | 'aspects'

function press(screen: ReturnType<typeof create>, testID: string) {
  const control = byTestID(screen, testID).find(
    (node) => typeof node.props.onPress === 'function'
  )
  if (!control) throw new Error(`Missing control: ${testID}`)
  act(() => control.props.onPress())
}

function expectActiveTab(screen: ReturnType<typeof create>, activeTab: ChartTab) {
  for (const tab of ['planets', 'houses', 'aspects'] as const) {
    const control = byTestID(screen, `chart-tab-${tab}`)[0]
    expect(control.props.accessibilityRole).toBe('tab')
    expect(control.props.accessibilityState.selected).toBe(tab === activeTab)

    const section = tab === 'planets' ? 'positions' : tab
    expect(byTestID(screen, `chart-section-${section}`).length > 0).toBe(
      tab === activeTab
    )
  }
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

  it('opens on Planets with all three tabs available and only its panel mounted', () => {
    const screen = renderChart()

    expectActiveTab(screen, 'planets')
    expect(hostTexts(screen)).toEqual(
      expect.arrayContaining(['Planets', 'Houses', 'Aspects'])
    )
    expect(byTestID(screen, 'house-row-1')).toHaveLength(0)
    expect(byTestID(screen, 'aspect-row-Sun-Moon')).toHaveLength(0)
  })

  it('switches between panels while keeping the wheel and selected placement', () => {
    const screen = renderChart()
    const wheel = () => screen.root.findByType(InteractiveChartWheel)

    act(() => wheel().props.onSelectPlanet('Moon'))

    for (const tab of ['houses', 'aspects', 'planets'] as const) {
      press(screen, `chart-tab-${tab}`)
      expectActiveTab(screen, tab)
      expect(wheel().props.selection).toEqual({ kind: 'planet', planet: 'Moon' })
      expect(wheel().props.focusedPlanet).toBe('Moon')
      expect(hostTexts(screen)).toContain('Moon in Pisces')
    }
  })

  it('shows the matching panel when a planet, house, or aspect is selected on the wheel', () => {
    const screen = renderChart()
    const wheel = () => screen.root.findByType(InteractiveChartWheel)

    act(() => wheel().props.onSelectHouse(4))
    expectActiveTab(screen, 'houses')
    expect(byTestID(screen, 'chart-house-detail').length).toBeGreaterThan(0)

    act(() => wheel().props.onSelectAspect(0))
    expectActiveTab(screen, 'aspects')
    expect(byTestID(screen, 'chart-aspect-detail').length).toBeGreaterThan(0)

    act(() => wheel().props.onSelectPlanet('Mercury'))
    expectActiveTab(screen, 'planets')
    expect(wheel().props.selection).toEqual({ kind: 'planet', planet: 'Mercury' })
    expect(screen.root.findByType(InterpretationModal).props.visible).toBe(false)
  })

  it('clears an empty wheel tap without changing the open tab', () => {
    const screen = renderChart()
    const wheel = () => screen.root.findByType(InteractiveChartWheel)

    act(() => wheel().props.onSelectHouse(4))
    act(() => wheel().props.onSelectAspect(null))

    expectActiveTab(screen, 'houses')
    expect(wheel().props.selection).toBeNull()
    expect(byTestID(screen, 'chart-house-detail')).toHaveLength(0)
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

  it('keeps the legend out of the document flow, as a route utility', () => {
    const screen = renderChart()

    // The inline section used to sit after all twelve houses, several screens
    // below the wheel it describes.
    expect(byTestID(screen, 'chart-section-compass')).toHaveLength(0)
    expect(hostTexts(screen)).not.toContain('Explore chart symbols')

    const trigger = screen.root.findAll(
      (n) =>
        typeof n.props?.onPress === 'function' &&
        n.props?.testID === 'glyph-compass-trigger'
    )
    expect(trigger).toHaveLength(1)
  })

  it('mounts the legend trigger outside the scrolling document', () => {
    const screen = renderChart()
    const scroll = chartScroll(screen)

    const insideScroll = scroll.findAll(
      (n) => n.props?.testID === 'glyph-compass-trigger'
    )
    expect(insideScroll).toHaveLength(0)
  })

  it('keeps the chart scrollable and unmoved while the legend is open', () => {
    const screen = renderChart()
    const contentBefore = chartScroll(screen).props.contentContainerStyle

    const trigger = () =>
      screen.root.findAll(
        (n) =>
          typeof n.props?.onPress === 'function' &&
          n.props?.testID === 'glyph-compass-trigger'
      )[0]

    act(() => trigger().props.onPress())

    const scrollAfter = chartScroll(screen)

    // The chart is neither disabled nor programmatically scrolled: the legend
    // is a sibling overlay with no reference to it.
    expect(scrollAfter.props.scrollEnabled).not.toBe(false)
    expect(scrollAfter.props.contentOffset).toBeUndefined()
    expect(scrollAfter.props.contentContainerStyle).toBe(contentBefore)
    expect(scrollAfter.props.ref).toBeUndefined()
  })

  it('renders the legend outside any React Native Modal', () => {
    const screen = renderChart()

    act(() =>
      screen.root
        .findAll(
          (n) =>
            typeof n.props?.onPress === 'function' &&
            n.props?.testID === 'glyph-compass-trigger'
        )[0]
        .props.onPress()
    )

    const panel = screen.root.findAll(
      (n) => typeof n.type === 'string' && n.props?.testID === 'glyph-compass-panel'
    )
    expect(panel).toHaveLength(1)

    // The only Modal on the chart route is the interpretation sheet.
    const modals = screen.root.findAllByType(Modal)
    for (const modal of modals) {
      expect(
        modal.findAll((n) => n.props?.testID === 'glyph-compass-panel')
      ).toHaveLength(0)
    }
  })

  it('leaves room for the last row to clear the floating trigger', () => {
    const screen = renderChart()
    const content = chartScroll(screen).props.contentContainerStyle
    const flat = Array.isArray(content)
      ? Object.assign({}, ...content.filter(Boolean))
      : content

    expect(flat.paddingBottom).toBeGreaterThanOrEqual(
      48 + GLYPH_COMPASS_TRIGGER_CLEARANCE
    )
  })

  it('renders the hero placement under the wheel', () => {
    const screen = renderChart()

    expect(byTestID(screen, 'chart-hero').length).toBeGreaterThan(0)
    expect(hostTexts(screen).join(' ')).toContain('Sun in')
  })
})

describe('Hero placement title', () => {
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

  it('names the sign for a planet anywhere on the wheel', () => {
    // One planet per sign, so no longitude range can silently produce a
    // half-formed title like "Jupiter in".
    const perSign = Array.from({ length: 12 }, (_, i) => ({
      name: ['Sun','Moon','Mercury','Venus','Mars','Jupiter',
             'Saturn','Uranus','Neptune','Pluto'][i % 10],
      lon: i * 30 + 15,
    }))

    for (const planet of perSign) {
      mockedUseChartData.mockReturnValue(
        chartState({ planets: [planet], aspects: [], planetHouses: null })
      )

      const screen = renderChart()
      const hero = screen.root.findAll(
        (n) => n.props?.testID === 'chart-hero'
      )[0]
      const texts = hero
        .findAll((n) => String(n.type) === 'Text')
        .map((n) => n.children.filter((c) => typeof c === 'string').join(''))

      const title = texts.find((t) => t.includes(' in '))
      expect(title).toBeDefined()
      // Never trailing: the sign must actually be there.
      expect(title!.trim().endsWith(' in')).toBe(false)
      expect(title).toMatch(
        /^\w+ in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)$/
      )

      act(() => screen.unmount())
      renderer = null
    }
  })

  it('names the sign for Jupiter in Aquarius specifically', () => {
    mockedUseChartData.mockReturnValue(
      chartState({
        planets: [{ name: 'Jupiter', lon: 306 }],
        aspects: [],
        planetHouses: [{ name: 'Jupiter', house: 3 }],
      })
    )

    const screen = renderChart()
    const hero = screen.root.findAll(
      (n) => n.props?.testID === 'chart-hero'
    )[0]
    const texts = hero
      .findAll((n) => String(n.type) === 'Text')
      .map((n) => n.children.filter((c) => typeof c === 'string').join(''))

    expect(texts).toContain('Jupiter in Aquarius')
    expect(texts).not.toContain('Jupiter in ')
    expect(texts).not.toContain('Jupiter in')
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
    press(screen, 'chart-tab-houses')

    for (let house = 1; house <= 12; house += 1) {
      expect(byTestID(screen, `house-row-${house}`).length).toBeGreaterThan(0)
    }
  })

  it('keeps planet pair, aspect type and orb for every aspect', () => {
    const screen = renderChart()
    press(screen, 'chart-tab-aspects')
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
    const screen = renderChart()
    press(screen, 'chart-tab-aspects')

    expectActiveTab(screen, 'aspects')
    expect(hostTexts(screen)).toContain('None (within default orbs)')
  })

  it('falls back safely when houses are missing', () => {
    mockedUseChartData.mockReturnValue(
      chartState({ houses: null, planetHouses: null })
    )
    const screen = renderChart()
    press(screen, 'chart-tab-houses')
    const texts = hostTexts(screen).join(' ')

    expectActiveTab(screen, 'houses')
    expect(texts).toContain('Houses require a birth location')
    expect(texts).not.toContain('House 1')
  })

  it('keeps planet and house interpretations reachable after changing tabs', () => {
    const screen = renderChart()
    const modal = () => screen.root.findByType(InterpretationModal)

    press(screen, 'chart-tab-houses')
    press(screen, 'house-row-4')
    expect(modal().props.visible).toBe(true)
    expect(modal().props.headerTitle).toBe('House Interpretation')
    expect(modal().props.pages[modal().props.currentIndex].key).toBe('house-4')
    act(() => modal().props.onClose())

    press(screen, 'chart-tab-planets')
    press(screen, 'position-row-Moon')
    expect(modal().props.visible).toBe(true)
    expect(modal().props.headerTitle).toBe('Planet Interpretation')
    expect(modal().props.pages[modal().props.currentIndex].key).toBe('Moon')
    act(() => modal().props.onClose())

    press(screen, 'chart-tab-aspects')
    press(screen, 'chart-tab-planets')
    expect(screen.root.findByType(ChartWheel).props.focusedPlanet).toBe('Moon')
    expect(modal().props.visible).toBe(false)
    expect(modal().props.pages[modal().props.currentIndex].key).toBe('Moon')
    press(screen, 'position-row-Moon')
    expect(modal().props.visible).toBe(true)
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

  it('labels the aspects section without implying synastry', () => {
    const screen = renderChart()
    press(screen, 'chart-tab-aspects')
    const texts = hostTexts(screen)

    expect(texts).toContain('Planetary dynamics')
    expect(texts).toContain('Aspects')
    expect(texts).not.toContain('Relationships')
  })

  it('gives the wheel only visual props, never geometry', () => {
    const wheel = renderChart().root.findByType(ChartWheel)

    // focusedPlanet is presentation only. Everything the wheel computes from
    // must still arrive by identity.
    expect(Object.keys(wheel.props).sort()).toEqual(
      [
        'aspects',
        'focusedPlanet',
        'houses',
        'onSelectAspect',
        'onSelectPlanet',
        'planets',
        'selection',
        'size',
      ].sort()
    )
    expect(wheel.props.planets).toBe(PLANETS)
    expect(wheel.props.aspects).toBe(ASPECTS)
    expect(wheel.props.houses).toBe(HOUSES)
  })

  it('tints only the focused planet, leaving the rest subordinate', () => {
    const rendered = JSON.stringify(renderChart().toJSON())

    expect(rendered).toContain(theme.planet.Sun)
    for (const [name, value] of Object.entries(theme.planet)) {
      if (name === 'Sun') continue
      expect(rendered).not.toContain(value)
    }
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
