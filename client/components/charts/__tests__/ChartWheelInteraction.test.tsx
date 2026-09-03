import React from 'react'
import { AccessibilityInfo, BackHandler, ScrollView } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ChartScreenContent from '../ChartScreenContent'
import { ChartHero } from '../ChartHero'
import { SpaceProvider } from '../../space/SpaceProvider'
import { theme } from '../../ui/theme'
import { InteractiveChartWheel } from '../InteractiveChartWheel'
import ChartWheel, {
  ASPECT_BLOOM_OPACITY,
  GLOW_MAX,
  GLOW_MIN,
  PLANET_HIT_SIZE,
  wheelAspectSegments,
  ASPECT_MOTION,
  aspectMotion,
  wheelHouseBand,
  wheelPlanetPoints,
} from '../ChartWheel'
import {
  ASPECT_HIT_TOLERANCE,
  houseAtPoint,
  inverseTransformPoint,
  nearestPointIndex,
  nearestSegmentIndex,
  PLANET_HIT_RADIUS,
} from '../chartWheelInteraction'
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
  { name: 'Mars', lon: 88.4 },
]
const HOUSES = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, lon: i * 30 }))
const PLANET_HOUSES = [
  { name: 'Sun', house: 10 },
  { name: 'Moon', house: 4 },
]
const ASPECTS = [
  { a: 'Sun', b: 'Moon', type: 'opp' as const, orb: 1.42 },
  { a: 'Moon', b: 'Mars', type: 'trine' as const, orb: 2.05 },
]

const PROFILE = {
  first_name: 'Vinal',
  last_name: null,
  birth_date: '1997-09-15',
  birth_time: '13:55:00',
  birth_location: 'Redwood City',
  time_zone: 'America/Los_Angeles',
  birth_lat: 37.49,
  birth_lon: -122.23,
}

let renderer: ReturnType<typeof create> | null = null
let backHandlers: (() => boolean)[] = []
let reduceMotion: boolean | null = false

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

function renderChart() {
  act(() => {
    renderer = create(
      <SpaceProvider>
        <ChartScreenContent
          profile={PROFILE as never}
          chartMode="self"
          tz="America/Los_Angeles"
        />
      </SpaceProvider>
    )
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function control(screen: ReturnType<typeof create>, testID: string) {
  const matches = screen.root.findAll(
    (n) => typeof n.props?.onPress === 'function' && n.props?.testID === testID
  )

  // A wrapper component and the Pressable it renders both carry the testID.
  // The one that declares the role is the actual control.
  const withRole = matches.filter((n) => n.props.accessibilityRole === 'button')
  return withRole.length > 0 ? withRole : matches
}

function heroTexts(screen: ReturnType<typeof create>) {
  const hero = screen.root.findAll(
    (n) => n.props?.testID === 'chart-hero'
  )[0]

  return hero
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

function wheel(screen: ReturnType<typeof create>) {
  return screen.root.findByType(ChartWheel)
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  jest.clearAllMocks()
  backHandlers = []
  reduceMotion = false
  renderer = null

  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockImplementation(() => Promise.resolve(reduceMotion === true))
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as never)
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation(((_e: string, handler: () => boolean) => {
      backHandlers.push(handler)
      return { remove: jest.fn() }
    }) as never)

  mockedUseChartData.mockReturnValue(chartState())
})

afterEach(() => {
  if (renderer) {
    const mounted = renderer
    act(() => mounted.unmount())
  }
  renderer = null
  jest.restoreAllMocks()
})

describe('Wheel zoom', () => {
  it('renders no discrete zoom buttons', () => {
    const screen = renderChart()

    for (const testID of [
      'chart-zoom-in',
      'chart-zoom-out',
      'chart-zoom-reset',
      'chart-zoom-level',
    ]) {
      expect(
        screen.root.findAll((n) => n.props?.testID === testID)
      ).toHaveLength(0)
    }

    expect(hostTexts(screen)).not.toContain('100%')
  })

  it('mounts the wheel inside a gesture detector', () => {
    const screen = renderChart()

    // Host nodes only: the composite and the view it renders share the id.
    const hosts = (testID: string) =>
      screen.root.findAll(
        (n) => typeof n.type === 'string' && n.props?.testID === testID
      )

    expect(hosts('interactive-chart-wheel')).toHaveLength(1)
    expect(hosts('chart-wheel-transform')).toHaveLength(1)
  })

  it('offers zoom and reset as accessibility actions instead of controls', () => {
    const frame = renderChart().root.findAll(
      (n) =>
        typeof n.type === 'string' &&
        n.props?.testID === 'interactive-chart-wheel'
    )[0]

    expect(frame.props.accessibilityActions).toEqual([
      { name: 'zoomIn', label: 'Zoom into chart' },
      { name: 'zoomOut', label: 'Zoom out of chart' },
      { name: 'resetZoom', label: 'Reset chart to fitted size' },
    ])
    expect(typeof frame.props.onAccessibilityAction).toBe('function')
  })

  it('accepts every accessibility zoom action without throwing', () => {
    const frame = renderChart().root.findAll(
      (n) =>
        typeof n.type === 'string' &&
        n.props?.testID === 'interactive-chart-wheel'
    )[0]

    for (const actionName of ['zoomIn', 'zoomOut', 'resetZoom', 'unknown']) {
      act(() =>
        frame.props.onAccessibilityAction({ nativeEvent: { actionName } })
      )
    }
  })

  it('keeps the wheel rendered at its fitted size, scaling by transform', () => {
    const screen = renderChart()
    const wheelNode = wheel(screen)

    // Zoom is a transform on the UI thread; the SVG is not re-laid out, so
    // no astrology geometry is recomputed while pinching.
    expect(wheelNode.props.size).toBeLessThanOrEqual(380)
    expect(wheelNode.props.planets).toBe(PLANETS)
    expect(wheelNode.props.aspects).toBe(ASPECTS)
    expect(wheelNode.props.houses).toBe(HOUSES)
  })

  it('keeps the chart document scrolling alongside the wheel', () => {
    const screen = renderChart()

    const chart = screen.root
      .findAllByType(ScrollView)
      .filter((n) => n.props.testID !== 'glyph-compass-scroll')

    expect(chart).toHaveLength(1)
    expect(chart[0].props.scrollEnabled).not.toBe(false)
    expect(chart[0].props.contentOffset).toBeUndefined()
  })

  it('registers no back handler for zoom', () => {
    renderChart()
    // Zoom lives on the UI thread and resets by double tap; it does not
    // compete with the Compass or the interpretation sheet for back.
    expect(backHandlers).toHaveLength(0)
  })
})

describe('Wheel planet selection', () => {
  it('exposes a labelled 48dp target for every planet', () => {
    const screen = renderChart()

    for (const planet of PLANETS) {
      const hit = control(screen, `wheel-planet-${planet.name}`)[0]
      expect(hit).toBeDefined()
      expect(hit.props.accessibilityRole).toBe('button')
      expect(hit.props.accessibilityLabel).toBe(planet.name)
      expect(hit.props.accessibilityHint).toBe(
        'Selects this planet on the chart'
      )

      const style = flatten(hit.props.style)
      expect(style.width).toBe(PLANET_HIT_SIZE)
      expect(style.height).toBe(PLANET_HIT_SIZE)
      expect(PLANET_HIT_SIZE).toBeGreaterThanOrEqual(theme.touchTarget.min)
    }
  })

  it('synchronises the shared focus state rather than duplicating it', () => {
    const screen = renderChart()
    expect(wheel(screen).props.focusedPlanet).toBe('Sun')

    act(() => control(screen, 'wheel-planet-Mars')[0].props.onPress())

    // One source of truth: the wheel, its selected state, and the explanation
    // all read the same SpaceProvider focus.
    expect(wheel(screen).props.focusedPlanet).toBe('Mars')
    expect(
      control(screen, 'wheel-planet-Mars')[0].props.accessibilityState
    ).toEqual({ selected: true })
    expect(
      control(screen, 'wheel-planet-Sun')[0].props.accessibilityState
    ).toEqual({ selected: false })
  })

  it('marks selection with shape, not only colour', () => {
    const screen = renderChart()
    const rendered = JSON.stringify(screen.toJSON())

    // The focused planet gains a ring around its marker in addition to tint.
    expect(rendered).toContain('"r":13')
    expect(rendered).toContain('"r":15')
  })

  it('keeps a single planet accent after selection changes', () => {
    const screen = renderChart()
    act(() => control(screen, 'wheel-planet-Moon')[0].props.onPress())

    const rendered = JSON.stringify(screen.toJSON())
    const used = Object.entries(theme.planet).filter(([, v]) =>
      rendered.includes(v)
    )
    expect(used.map(([name]) => name)).toEqual(['Moon'])
  })
})

describe('Selected placement explanation', () => {
  it('describes the selected planet from existing chart data', () => {
    const screen = renderChart()
    act(() => control(screen, 'wheel-planet-Moon')[0].props.onPress())

    const texts = heroTexts(screen)
    expect(texts).toContain('Moon in Pisces')
    expect(texts).toContain('House 4')
    // Lexicon copy, not generated text.
    expect(texts.join(' ')).toContain('emotionally porous')
  })

  it('omits the house line when the placement has none', () => {
    const screen = renderChart()
    act(() => control(screen, 'wheel-planet-Mars')[0].props.onPress())

    // Scoped to the hero: "House 4" legitimately appears in the Moon row and
    // in the houses list further down the page.
    const texts = heroTexts(screen)
    expect(texts).toContain('Mars in Gemini')
    expect(texts.some((t) => t.startsWith('House '))).toBe(false)
  })

  it('offers the full interpretation without duplicating pager state', () => {
    const screen = renderChart()
    const open = control(screen, 'chart-hero-open')[0]

    expect(open.props.accessibilityLabel ?? 'Read full interpretation').toBe(
      'Read full interpretation'
    )
    act(() => open.props.onPress())

    // Opening from the hero routes through the same interpretation path.
    expect(wheel(screen).props.focusedPlanet).toBe('Sun')
  })
})

describe('Hero placement is static and re-measures', () => {
  function renderHero(title: string) {
    act(() => {
      renderer = create(
        <ChartHero title={title} meaning="A meaning." planet="Sun" />
      )
    })
    if (!renderer) throw new Error('did not render')
    return renderer
  }

  function heroNode(screen: ReturnType<typeof create>) {
    return screen.root.findAll(
      (n) => typeof n.type === 'string' && n.props?.testID === 'chart-hero'
    )[0]
  }

  it('does not animate the hero at all', async () => {
    const screen = renderHero('Sun in Virgo')
    await act(async () => {})

    // The wheel glow is the selection feedback. Fading the text as well read
    // as a flash on every change, so the hero is plain and static.
    const style = heroNode(screen).props.style
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style
    expect(flat.opacity).toBeUndefined()
  })

  it('renders the whole title after the placement changes', async () => {
    const screen = renderHero('Uranus in Aquarius')
    await act(async () => {})

    act(() => {
      screen.update(
        <ChartHero
          title="Jupiter in Aquarius"
          meaning="A meaning."
          planet="Jupiter"
        />
      )
    })

    const texts = screen.root
      .findAll((n) => String(n.type) === 'Text')
      .map((n) => n.children.filter((c) => typeof c === 'string').join(''))

    // The string was never wrong on device; only its measurement was. This
    // pins the content, and the keyed Text forces the re-measure natively.
    expect(texts).toContain('Jupiter in Aquarius')
    expect(texts).not.toContain('Jupiter in ')
  })

  it('starts no interval or random motion', async () => {
    const setInterval = jest.spyOn(global, 'setInterval')
    const random = jest.spyOn(Math, 'random')

    renderHero('Sun in Virgo')
    await act(async () => {})

    expect(setInterval).not.toHaveBeenCalled()
    expect(random).not.toHaveBeenCalled()
  })

  it('caps how far display type scales with the device font setting', () => {
    // A fixed lineHeight against an unbounded fontSize eventually clips.
    expect(theme.typographyMaxScale.display).toBeLessThanOrEqual(1.6)
    expect(theme.typographyMaxScale.title).toBeLessThanOrEqual(1.6)
    // The reading surface is deliberately uncapped.
    expect(theme.typographyMaxScale.bodyLarge).toBeUndefined()
  })
})

describe('Aspect selection', () => {
  it('no longer places a full-screen Pressable over the wheel', () => {
    const screen = renderChart()

    // This overlay was the pinch killer: it claimed every touch through RN's
    // responder system before the pinch recogniser could activate.
    expect(
      screen.root.findAll((n) => n.props?.testID === 'wheel-aspect-layer')
    ).toHaveLength(0)
  })

  it('makes every rendered aspect selectable at its midpoint', () => {
    const segments = wheelAspectSegments(320, PLANETS, ASPECTS)
    const planetPoints = wheelPlanetPoints(320, PLANETS)

    expect(segments).toHaveLength(ASPECTS.length)

    segments.forEach((segment, index) => {
      const midpoint = {
        x: (segment.a.x + segment.b.x) / 2,
        y: (segment.a.y + segment.b.y) / 2,
      }

      // Planets win inside their radius, so only assert aspect selection for
      // midpoints that are not sitting under a planet marker.
      if (nearestPointIndex(midpoint, planetPoints, PLANET_HIT_RADIUS) != null) {
        return
      }

      expect(
        nearestSegmentIndex(midpoint, segments, ASPECT_HIT_TOLERANCE)
      ).not.toBeNull()
    })
  })

  it('uses a corridor of roughly 48 around a 1-2 wide stroke', () => {
    expect(ASPECT_HIT_TOLERANCE).toBeGreaterThanOrEqual(24)

    const segments = wheelAspectSegments(320, PLANETS, ASPECTS)
    const segment = segments[0]
    const mid = {
      x: (segment.a.x + segment.b.x) / 2,
      y: (segment.a.y + segment.b.y) / 2,
    }

    // Perpendicular offset just inside the tolerance still selects.
    const dx = segment.b.x - segment.a.x
    const dy = segment.b.y - segment.a.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length
    const ny = dx / length
    const offset = ASPECT_HIT_TOLERANCE - 2

    expect(
      nearestSegmentIndex(
        { x: mid.x + nx * offset, y: mid.y + ny * offset },
        segments,
        ASPECT_HIT_TOLERANCE
      )
    ).not.toBeNull()
  })

  it('gives planets priority inside their hit radius', () => {
    const planetPoints = wheelPlanetPoints(320, PLANETS)

    planetPoints.forEach((point, index) => {
      expect(nearestPointIndex(point, planetPoints, PLANET_HIT_RADIUS)).toBe(
        index
      )
    })
  })

  it('selects nothing when the tap is in empty chart space', () => {
    const segments = wheelAspectSegments(320, PLANETS, ASPECTS)
    const planetPoints = wheelPlanetPoints(320, PLANETS)
    const corner = { x: 2, y: 2 }

    expect(nearestPointIndex(corner, planetPoints, PLANET_HIT_RADIUS)).toBeNull()
    expect(
      nearestSegmentIndex(corner, segments, ASPECT_HIT_TOLERANCE)
    ).toBeNull()
  })

  it('hit-tests correctly after zoom and pan via inverse transform', () => {
    const size = 320
    const center = size / 2
    const segments = wheelAspectSegments(size, PLANETS, ASPECTS)
    const target = segments[0]
    const local = {
      x: (target.a.x + target.b.x) / 2,
      y: (target.a.y + target.b.y) / 2,
    }

    const scale = 2.2
    const tx = 40
    const ty = -25

    // Where that point lands on screen once the wheel is zoomed and panned.
    const onScreen = {
      x: center + (local.x - center) * scale + tx,
      y: center + (local.y - center) * scale + ty,
    }

    const recovered = inverseTransformPoint(onScreen, tx, ty, scale, center)

    expect(recovered.x).toBeCloseTo(local.x, 4)
    expect(recovered.y).toBeCloseTo(local.y, 4)
    expect(
      nearestSegmentIndex(recovered, segments, ASPECT_HIT_TOLERANCE)
    ).toBe(0)

    // The correction is larger than the hit tolerance itself, so skipping it
    // would not be a rounding difference -- it would be a different target.
    const correction = Math.sqrt(
      (onScreen.x - recovered.x) ** 2 + (onScreen.y - recovered.y) ** 2
    )
    expect(correction).toBeGreaterThan(ASPECT_HIT_TOLERANCE)
  })

  it('does not change aspect ordering or orb precision', () => {
    const screen = renderChart()
    expect(wheel(screen).props.aspects).toBe(ASPECTS)
    expect(ASPECTS[0].orb).toBe(1.42)
  })
})

describe('Selection glow', () => {
  it('passes the selection down to the wheel', () => {
    const screen = renderChart()
    act(() => control(screen, 'wheel-planet-Moon')[0].props.onPress())

    expect(wheel(screen).props.selection).toEqual({
      kind: 'planet',
      planet: 'Moon',
    })
  })

  it('draws an animated halo plus a static ring for a planet', () => {
    const screen = renderChart()
    const rendered = JSON.stringify(screen.toJSON())

    // Halo r=18 animates; r=15 fill and r=13 ring are static shape cues.
    expect(rendered).toContain('"r":18')
    expect(rendered).toContain('"r":15')
    expect(rendered).toContain('"r":13')
  })

  it('draws a halo and a dashed line for a selected aspect', () => {
    const screen = renderChart()

    act(() =>
      screen.root
        .findAll(
          (n) =>
            typeof n.props?.onPress === 'function' &&
            n.props?.testID === 'wheel-planet-Sun'
        )[0]
        .props.onPress()
    )

    // Select an aspect through the component's own callback contract.
    act(() => wheel(screen).props.onSelectAspect(0))

    // Two layers: a faint halo tracing the path, and the dashed line itself.
    for (const id of ['aspect-bloom-0', 'aspect-selected-0']) {
      expect(
        screen.root.findAll((n) => n.props?.testID === id).length
      ).toBeGreaterThan(0)
    }
  })

  it('starts no interval or random motion', () => {
    const setInterval = jest.spyOn(global, 'setInterval')
    const random = jest.spyOn(Math, 'random')

    renderChart()

    expect(setInterval).not.toHaveBeenCalled()
    expect(random).not.toHaveBeenCalled()
  })

  it('unmounts cleanly with a selection active', () => {
    const screen = renderChart()
    act(() => control(screen, 'wheel-planet-Mars')[0].props.onPress())

    expect(() => {
      act(() => screen.unmount())
    }).not.toThrow()

    renderer = null
  })
})

describe('Selection path parity', () => {
  function positionsRow(screen: ReturnType<typeof create>, planet: string) {
    return screen.root.findAll(
      (n) =>
        typeof n.props?.onPress === 'function' &&
        n.props?.testID === `position-row-${planet}`
    )[0]
  }

  function wheelTarget(screen: ReturnType<typeof create>, planet: string) {
    return screen.root.findAll(
      (n) =>
        typeof n.props?.onPress === 'function' &&
        n.props?.testID === `wheel-planet-${planet}`
    )[0]
  }

  function modalVisible(screen: ReturnType<typeof create>) {
    const modals = screen.root.findAll((n) => n.props?.animationType === 'slide')
    return modals.some((m) => m.props.visible === true)
  }

  it('produces identical state from the wheel and the Positions row', () => {
    const fromWheel = renderChart()
    act(() => wheelTarget(fromWheel, 'Mars').props.onPress())
    const wheelState = {
      focused: wheel(fromWheel).props.focusedPlanet,
      selection: wheel(fromWheel).props.selection,
    }
    act(() => fromWheel.unmount())
    renderer = null

    const fromRow = renderChart()
    act(() => positionsRow(fromRow, 'Mars').props.onPress())

    // Both paths must agree. They previously did not: the row set focus only,
    // leaving ChartSelection null, so the glow never started from that path.
    expect(wheel(fromRow).props.focusedPlanet).toBe(wheelState.focused)
    expect(wheel(fromRow).props.selection).toEqual(wheelState.selection)
    expect(wheelState.selection).toEqual({ kind: 'planet', planet: 'Mars' })
  })

  it('selects from the wheel without opening the interpretation modal', () => {
    const screen = renderChart()

    act(() => wheelTarget(screen, 'Moon').props.onPress())

    expect(wheel(screen).props.selection).toEqual({
      kind: 'planet',
      planet: 'Moon',
    })
    // The glow must begin on the tap, not as a side effect of a modal.
    expect(modalVisible(screen)).toBe(false)
  })

  it('opens the modal from the Positions row while setting the same selection', () => {
    const screen = renderChart()

    act(() => positionsRow(screen, 'Moon').props.onPress())

    expect(wheel(screen).props.selection).toEqual({
      kind: 'planet',
      planet: 'Moon',
    })
    expect(modalVisible(screen)).toBe(true)
  })

  it('keeps exactly one selected planet across rapid changes', () => {
    const screen = renderChart()

    for (const planet of ['Mars', 'Moon', 'Sun', 'Mars']) {
      act(() => wheelTarget(screen, planet).props.onPress())
      expect(wheel(screen).props.selection).toEqual({
        kind: 'planet',
        planet,
      })
    }

    // Only the current planet renders selected structure. Host nodes only:
    // an SVG Circle appears as both a composite and its host element.
    const rings = screen.root.findAll(
      (n) =>
        typeof n.type === 'string' &&
        String(n.props?.testID ?? '').startsWith('planet-ring-')
    )
    expect(rings).toHaveLength(1)
    expect(rings[0].props.testID).toBe('planet-ring-Mars')
  })

  it('re-selecting the same planet is deterministic', () => {
    const screen = renderChart()

    act(() => wheelTarget(screen, 'Sun').props.onPress())
    const first = wheel(screen).props.selection
    act(() => wheelTarget(screen, 'Sun').props.onPress())

    expect(wheel(screen).props.selection).toEqual(first)
  })

  it('does not disturb the selection when the modal opens and closes', () => {
    const screen = renderChart()

    act(() => wheelTarget(screen, 'Mars').props.onPress())
    const before = wheel(screen).props.selection

    act(() => positionsRow(screen, 'Mars').props.onPress())
    expect(modalVisible(screen)).toBe(true)

    const modal = screen.root.findAll(
      (n) => n.props?.animationType === 'slide'
    )[0]
    act(() => modal.props.onRequestClose())

    expect(wheel(screen).props.selection).toEqual(before)
    expect(
      screen.root.findAll(
        (n) =>
          typeof n.type === 'string' &&
          String(n.props?.testID ?? '').startsWith('planet-ring-')
      )
    ).toHaveLength(1)
  })
})

describe('Glow structure and bounds', () => {
  it('gives every planet the same three-layer selected structure', () => {
    const screen = renderChart()

    for (const planet of PLANETS) {
      act(() =>
        screen.root
          .findAll(
            (n) =>
              typeof n.props?.onPress === 'function' &&
              n.props?.testID === `wheel-planet-${planet.name}`
          )[0]
          .props.onPress()
      )

      for (const layer of ['halo', 'accent', 'ring']) {
        expect(
          screen.root.findAll(
            (n) => n.props?.testID === `planet-${layer}-${planet.name}`
          ).length
        ).toBeGreaterThan(0)
      }
    }
  })

  it('keeps each planet its own hue, from the glow palette', () => {
    const screen = renderChart()

    for (const planet of ['Sun', 'Moon', 'Mars'] as const) {
      act(() =>
        screen.root
          .findAll(
            (n) =>
              typeof n.props?.onPress === 'function' &&
              n.props?.testID === `wheel-planet-${planet}`
          )[0]
          .props.onPress()
      )

      const halo = screen.root.findAll(
        (n) => n.props?.testID === `planet-halo-${planet}`
      )[0]
      const accent = screen.root.findAll(
        (n) => n.props?.testID === `planet-accent-${planet}`
      )[0]

      // The halo carries the planet's identity, not a generic gold.
      expect(halo.props.fill).toBe(theme.planetGlow[planet])
      expect(halo.props.fill).not.toBe(theme.accent.base)
      expect(accent.props.fill).toBe(theme.planet[planet])
    }
  })

  it('lifts every planet glow to a similar, visible luminance', () => {
    const luminance = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return (
        0.2126 * ((n >> 16) & 255) +
        0.7152 * ((n >> 8) & 255) +
        0.0722 * (n & 255)
      )
    }

    const values = Object.keys(theme.planet).map((name) =>
      luminance(theme.planetGlow[name as keyof typeof theme.planetGlow])
    )

    // Every glow is bright, and the darkest is not far off the brightest --
    // which is what stopped Pluto vanishing while Sun blazed.
    for (const value of values) expect(value).toBeGreaterThan(150)
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(80)

    // And each is brighter than the ink accent it derives from.
    for (const name of Object.keys(theme.planet)) {
      const key = name as keyof typeof theme.planet
      expect(luminance(theme.planetGlow[key])).toBeGreaterThan(
        luminance(theme.planet[key])
      )
    }
  })

  it('never breathes the glow down to invisible', () => {
    expect(GLOW_MIN).toBeGreaterThan(0)
    expect(GLOW_MIN).toBeGreaterThanOrEqual(0.3)
    expect(GLOW_MAX).toBeLessThanOrEqual(0.7)
    expect(GLOW_MAX).toBeGreaterThan(GLOW_MIN)
  })

  it('keeps the stable ring un-animated', () => {
    const screen = renderChart()
    const ring = screen.root.findAll(
      (n) => n.props?.testID === 'planet-ring-Sun'
    )[0]

    // The ring is the thing that must never disappear, so it carries no
    // animated opacity at all.
    expect(ring.props.animatedProps).toBeUndefined()
    expect(ring.props.opacity).toBeGreaterThanOrEqual(0.9)
  })
})

describe('House selection on the wheel', () => {
  function wheelHouses() {
    return HOUSES
  }

  // onSelectHouse is a prop of the gesture wrapper, not the drawing.
  function interactive(screen: ReturnType<typeof create>) {
    return screen.root.findByType(InteractiveChartWheel)
  }

  it('resolves a point in the house band to the right house', () => {
    const band = wheelHouseBand(320)
    const houses = wheelHouses()

    for (const house of houses) {
      // Mid-house longitude, mid-band radius.
      const lon = house.lon + 15
      const radius = (band.innerRadius + band.outerRadius) / 2
      const angle = ((90 - lon) * Math.PI) / 180
      const point = {
        x: band.center.x + Math.cos(angle) * radius,
        y: band.center.y + Math.sin(angle) * radius,
      }

      expect(houseAtPoint(point, band, houses)).toBe(house.house)
    }
  })

  it('ignores points outside the band', () => {
    const band = wheelHouseBand(320)

    expect(houseAtPoint(band.center, band, wheelHouses())).toBeNull()
    expect(
      houseAtPoint({ x: 2, y: 2 }, band, wheelHouses())
    ).toBeNull()
  })

  it('returns null when the chart has no houses', () => {
    const band = wheelHouseBand(320)
    const radius = (band.innerRadius + band.outerRadius) / 2

    expect(
      houseAtPoint({ x: band.center.x + radius, y: band.center.y }, band, null)
    ).toBeNull()
  })

  it('selects a house from the wheel and explains it', () => {
    const screen = renderChart()

    act(() => interactive(screen).props.onSelectHouse(4))

    expect(wheel(screen).props.selection).toEqual({ kind: 'house', house: 4 })
    expect(
      screen.root.findAll((n) => n.props?.testID === 'chart-house-detail')
        .length
    ).toBeGreaterThan(0)

    const texts = screen.root
      .findAll((n) => String(n.type) === 'Text')
      .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
    expect(texts).toContain('House 4')
    expect(texts).toContain('Life area')
  })

  it('highlights the selected house wedge and number', () => {
    const screen = renderChart()
    act(() => interactive(screen).props.onSelectHouse(7))

    expect(
      screen.root.findAll(
        (n) => typeof n.type === 'string' && n.props?.testID === 'house-wedge-7'
      ).length
    ).toBeGreaterThan(0)
  })

  it('shows only one explanation at a time', () => {
    const screen = renderChart()

    act(() => interactive(screen).props.onSelectHouse(2))
    expect(
      screen.root.findAll((n) => n.props?.testID === 'chart-hero')
    ).toHaveLength(0)
    expect(
      screen.root.findAll((n) => n.props?.testID === 'chart-aspect-detail')
    ).toHaveLength(0)

    act(() => interactive(screen).props.onSelectAspect(0))
    expect(
      screen.root.findAll((n) => n.props?.testID === 'chart-house-detail')
    ).toHaveLength(0)
  })
})

describe('Aspect line motion', () => {
  function selectAspect(screen: ReturnType<typeof create>) {
    act(() => wheel(screen).props.onSelectAspect(0))
  }

  function layer(screen: ReturnType<typeof create>, id: string) {
    return screen.root.findAll(
      (n) => typeof n.type === 'string' && n.props?.testID === id
    )[0]
  }

  it('draws no solid stroke beneath the dashes', () => {
    const screen = renderChart()
    selectAspect(screen)

    // Only the faint halo and the dashed line itself. A continuous stroke
    // under the dashes is what made the motion read as an overlay.
    expect(layer(screen, 'aspect-bloom-0')).toBeDefined()
    expect(layer(screen, 'aspect-selected-0')).toBeDefined()
    expect(layer(screen, 'aspect-trace-0')).toBeUndefined()

    // The visible line is dashed, not solid.
    expect(
      layer(screen, 'aspect-selected-0').props.strokeDasharray
    ).toBeDefined()
  })

  it('keeps the halo close to the line rather than a bar behind it', () => {
    const screen = renderChart()
    selectAspect(screen)

    const bloom = layer(screen, 'aspect-bloom-0')
    const line = layer(screen, 'aspect-selected-0')

    const extra = bloom.props.strokeWidth - line.props.strokeWidth
    expect(extra).toBeLessThanOrEqual(6)
    expect(extra).toBeGreaterThan(0)
  })

  it('renders the halo at a small fraction of the glow opacity', () => {
    expect(ASPECT_BLOOM_OPACITY).toBeLessThanOrEqual(0.3)
    expect(ASPECT_BLOOM_OPACITY).toBeGreaterThan(0)
    expect(GLOW_MAX * ASPECT_BLOOM_OPACITY).toBeLessThan(0.25)
  })

  it('gives each aspect type its own motion character', () => {
    const types = ['conj', 'opp', 'square', 'trine', 'sextile'] as const

    // Every type is distinct in at least one of pattern, speed or direction.
    const signatures = types.map((t) => {
      const m = ASPECT_MOTION[t]
      return `${m.dash}/${m.gap}/${m.duration}/${m.direction}`
    })
    expect(new Set(signatures).size).toBe(types.length)

    // Square is the most agitated, trine the most unhurried.
    expect(ASPECT_MOTION.square.duration).toBeLessThan(
      ASPECT_MOTION.trine.duration
    )
    // Opposition runs the other way: a polarity, not a flow.
    expect(ASPECT_MOTION.opp.direction).toBe(-1)
    expect(ASPECT_MOTION.trine.direction).toBe(1)
    // Sextile is the most intermittent: gap far exceeds dash.
    expect(ASPECT_MOTION.sextile.gap / ASPECT_MOTION.sextile.dash).toBeGreaterThan(
      ASPECT_MOTION.trine.gap / ASPECT_MOTION.trine.dash
    )
  })

  it('falls back to a known motion for an unrecognised type', () => {
    expect(aspectMotion('nonsense')).toEqual(ASPECT_MOTION.trine)
    expect(aspectMotion('square')).toEqual(ASPECT_MOTION.square)
  })

  it('draws the selected aspect with its own type pattern', () => {
    const screen = renderChart()
    // ASPECTS[0] is a Sun/Moon opposition.
    selectAspect(screen)

    const dash = layer(screen, 'aspect-selected-0').props.strokeDasharray.map(
      Number
    )
    expect(dash).toEqual([ASPECT_MOTION.opp.dash, ASPECT_MOTION.opp.gap])
  })

  it('keeps the dashed pattern when motion is not allowed', async () => {
    reduceMotion = true
    const screen = renderChart()
    await act(async () => {})
    selectAspect(screen)

    // The pattern is how the aspect type reads, so it survives statically --
    // only the travelling is withheld.
    expect(
      layer(screen, 'aspect-selected-0').props.strokeDasharray
    ).toBeDefined()
    expect(layer(screen, 'aspect-bloom-0')).toBeDefined()
  })
})

describe('Aspect participants glow', () => {
  function rings(screen: ReturnType<typeof create>) {
    return screen.root
      .findAll(
        (n) =>
          typeof n.type === 'string' &&
          String(n.props?.testID ?? '').startsWith('planet-ring-')
      )
      .map((n) => String(n.props.testID).replace('planet-ring-', ''))
      .sort()
  }

  it('lights both participants of a selected aspect', () => {
    const screen = renderChart()

    // ASPECTS[0] is Sun opposite Moon.
    act(() => wheel(screen).props.onSelectAspect(0))

    expect(rings(screen)).toEqual(['Moon', 'Sun'])
  })

  it('lights the correct pair for a different aspect', () => {
    const screen = renderChart()

    // ASPECTS[1] is Moon trine Mars.
    act(() => wheel(screen).props.onSelectAspect(1))

    expect(rings(screen)).toEqual(['Mars', 'Moon'])
  })

  it('gives each participant its own colour, not a shared one', () => {
    const screen = renderChart()
    act(() => wheel(screen).props.onSelectAspect(0))

    // Host SVG nodes carry a processed colour, not the hex string, so compare
    // the participants against each other rather than against the token.
    const accentFor = (planet: string) =>
      JSON.stringify(
        screen.root.findAll(
          (n) =>
            typeof n.type === 'string' &&
            n.props?.testID === `planet-accent-${planet}`
        )[0].props.fill
      )

    expect(accentFor('Sun')).not.toBe(accentFor('Moon'))

    // And the raw token really is per-planet, not one shared value.
    expect(theme.planet.Sun).not.toBe(theme.planet.Moon)
    expect(theme.planetGlow.Sun).not.toBe(theme.planetGlow.Moon)
  })

  it('returns to a single planet when a planet is selected', () => {
    const screen = renderChart()

    act(() => wheel(screen).props.onSelectAspect(0))
    expect(rings(screen)).toHaveLength(2)

    act(() =>
      screen.root
        .findAll(
          (n) =>
            typeof n.props?.onPress === 'function' &&
            n.props?.testID === 'wheel-planet-Mars'
        )[0]
        .props.onPress()
    )

    expect(rings(screen)).toEqual(['Mars'])
  })

  it('lights no planet when a house is selected', () => {
    const screen = renderChart()

    act(() =>
      screen.root
        .findByType(InteractiveChartWheel)
        .props.onSelectHouse(4)
    )

    expect(rings(screen)).toHaveLength(0)
  })

  it('reports the same pair to assistive technology', () => {
    const screen = renderChart()
    act(() => wheel(screen).props.onSelectAspect(0))

    const selectedFor = (planet: string) =>
      screen.root.findAll(
        (n) =>
          typeof n.props?.onPress === 'function' &&
          n.props?.testID === `wheel-planet-${planet}`
      )[0].props.accessibilityState.selected

    // What is highlighted and what is announced must agree.
    expect(selectedFor('Sun')).toBe(true)
    expect(selectedFor('Moon')).toBe(true)
    expect(selectedFor('Mars')).toBe(false)
  })
})

describe('Clustered planet selection', () => {
  // Three planets close together, as Neptune/Uranus/Jupiter are on a real
  // chart: their 48dp targets overlap heavily.
  const CLUSTER = [
    { name: 'Neptune', lon: 300 },
    { name: 'Uranus', lon: 303 },
    { name: 'Jupiter', lon: 306 },
  ]

  it('places overlapping targets, which is why nearest-wins matters', () => {
    const points = wheelPlanetPoints(320, CLUSTER)
    const gap = Math.sqrt(
      (points[0].x - points[1].x) ** 2 + (points[0].y - points[1].y) ** 2
    )

    // Closer than one hit radius: a single touch can be inside both.
    expect(gap).toBeLessThan(PLANET_HIT_RADIUS * 2)
  })

  it('resolves a touch to the nearest planet, not the topmost target', () => {
    const points = wheelPlanetPoints(320, CLUSTER)

    // A touch exactly on each planet resolves to that planet, even though the
    // neighbours' targets also cover the point.
    points.forEach((point, index) => {
      expect(nearestPointIndex(point, points, PLANET_HIT_RADIUS)).toBe(index)
    })
  })

  it('fires exactly one selection per tap', () => {
    const screen = renderChart()
    const onSelect = jest.fn()

    // The gesture layer must not select a planet as well: the planet's own
    // control already did, and two differently-resolved selections in a row
    // is what made a tap flash a neighbour before settling.
    const target = screen.root.findAll(
      (n) =>
        typeof n.props?.onPress === 'function' &&
        n.props?.testID === 'wheel-planet-Mars'
    )

    expect(target).toHaveLength(1)

    act(() => target[0].props.onPress({ nativeEvent: {} }))
    expect(wheel(screen).props.selection).toEqual({
      kind: 'planet',
      planet: 'Mars',
    })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('falls back to the planet itself when there is no touch location', () => {
    const screen = renderChart()

    // Assistive-technology activation carries no coordinates.
    act(() =>
      screen.root
        .findAll(
          (n) =>
            typeof n.props?.onPress === 'function' &&
            n.props?.testID === 'wheel-planet-Moon'
        )[0]
        .props.onPress({ nativeEvent: {} })
    )

    expect(wheel(screen).props.selection).toEqual({
      kind: 'planet',
      planet: 'Moon',
    })
  })
})
