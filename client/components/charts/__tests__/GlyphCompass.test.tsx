import React from 'react'
import { BackHandler, Dimensions, Modal, ScrollView } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { GlyphCompass, GLYPH_COMPASS_TRIGGER_CLEARANCE } from '../GlyphCompass'
import { theme } from '../../ui/theme'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 48, left: 0 }),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null
let backHandlers: (() => boolean)[] = []

function render(element: React.ReactElement): ReturnType<typeof create> {
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function control(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll(
    (n) => typeof n.props?.onPress === 'function' && n.props?.testID === testID
  )
}

function node(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll(
    (n) => typeof n.type === 'string' && n.props?.testID === testID
  )
}

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

function openPanel() {
  const screen = render(<GlyphCompass />)
  act(() => control(screen, 'glyph-compass-trigger')[0].props.onPress())
  return screen
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  backHandlers = []
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation(((_event: string, handler: () => boolean) => {
      backHandlers.push(handler)
      return { remove: jest.fn() }
    }) as never)
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(((
    cb: FrameRequestCallback
  ) => {
    cb(0)
    return 0
  }) as never)
  renderer = null
})

afterEach(() => {
  if (renderer) {
    const mounted = renderer
    act(() => mounted.unmount())
  }
  renderer = null
  jest.restoreAllMocks()
})

describe('Glyph Compass is non-modal', () => {
  it('never renders through React Native Modal', () => {
    const closed = render(<GlyphCompass />)
    expect(closed.root.findAllByType(Modal)).toHaveLength(0)

    act(() => control(closed, 'glyph-compass-trigger')[0].props.onPress())
    expect(closed.root.findAllByType(Modal)).toHaveLength(0)
  })

  it('lets touches pass through its full-screen wrapper', () => {
    const screen = render(<GlyphCompass />)
    const layer = node(screen, 'glyph-compass-layer')[0]

    expect(layer.props.pointerEvents).toBe('box-none')
    expect(flatten(layer.props.style).position).toBe('absolute')
  })

  it('renders no scrim behind the panel', () => {
    const screen = openPanel()

    expect(node(screen, 'glyph-compass-backdrop')).toHaveLength(0)
    expect(control(screen, 'glyph-compass-backdrop')).toHaveLength(0)
  })

  it('captures touches inside the panel only', () => {
    const screen = openPanel()
    expect(node(screen, 'glyph-compass-panel')[0].props.pointerEvents).toBe(
      'auto'
    )
  })

  it('is not marked accessibility-modal, since the chart stays available', () => {
    const panel = node(openPanel(), 'glyph-compass-panel')[0]

    expect(panel.props.accessibilityViewIsModal).toBeUndefined()
    expect(panel.props.accessibilityLabel).toBe('Glyph Compass')
  })
})

describe('Glyph Compass trigger', () => {
  it('renders exactly one trigger, closed by default', () => {
    const screen = render(<GlyphCompass />)

    expect(control(screen, 'glyph-compass-trigger')).toHaveLength(1)
    expect(node(screen, 'glyph-compass-panel')).toHaveLength(0)
  })

  it('has a real 48dp target anchored above the bottom inset', () => {
    const style = flatten(
      control(render(<GlyphCompass />), 'glyph-compass-trigger')[0].props.style({
        pressed: false,
      })
    )

    expect(style.minHeight).toBe(theme.touchTarget.min)
    expect(style.position).toBe('absolute')
    expect(style.bottom as number).toBeGreaterThan(48)
  })

  it('carries an accessibility label, hint and collapsed state', () => {
    const trigger = control(render(<GlyphCompass />), 'glyph-compass-trigger')[0]

    expect(trigger.props.accessibilityRole).toBe('button')
    expect(trigger.props.accessibilityLabel).toBe('Glyph Compass')
    expect(trigger.props.accessibilityHint).toBe(
      'Opens the chart symbol legend'
    )
    expect(trigger.props.accessibilityState).toEqual({ expanded: false })
  })

  it('is hidden while the interpretation modal is open', () => {
    expect(
      control(render(<GlyphCompass hidden />), 'glyph-compass-trigger')
    ).toHaveLength(0)
  })

  it('hides itself while its own panel is open', () => {
    const screen = openPanel()

    expect(node(screen, 'glyph-compass-panel')).toHaveLength(1)
    expect(control(screen, 'glyph-compass-trigger')).toHaveLength(0)
  })

  it('reserves clearance for the chart to scroll past it', () => {
    expect(GLYPH_COMPASS_TRIGGER_CLEARANCE).toBeGreaterThanOrEqual(
      theme.touchTarget.min
    )
  })
})

describe('Glyph Compass panel', () => {
  it('keeps every existing glyph definition', () => {
    const screen = openPanel()
    const texts = hostTexts(screen)

    expect(node(screen, 'glyph-compass-content')).toHaveLength(1)
    expect(texts).toContain('Planets')
    expect(texts).toContain('Signs')
    expect(texts).toContain('Aspects')

    for (const planet of [
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    ]) {
      expect(texts).toContain(planet)
    }

    for (const sign of [
      'Ar · Aries', 'Ta · Taurus', 'Ge · Gemini', 'Cn · Cancer',
      'Le · Leo', 'Vi · Virgo', 'Li · Libra', 'Sc · Scorpio',
      'Sg · Sagittarius', 'Cp · Capricorn', 'Aq · Aquarius', 'Pi · Pisces',
    ]) {
      expect(texts).toContain(sign)
    }

    for (const aspect of [
      'Conjunction · 0°', 'Opposition · 180°', 'Square · 90°',
      'Trine · 120°', 'Sextile · 60°',
    ]) {
      expect(texts).toContain(aspect)
    }
  })

  it('leaves the upper viewport free for the wheel', () => {
    const panel = flatten(node(openPanel(), 'glyph-compass-panel')[0].props.style)

    // At most 55% of the viewport, so the wheel above stays inspectable.
    const viewport = Dimensions.get('window').height
    expect(typeof panel.maxHeight).toBe('number')
    expect(panel.maxHeight as number).toBeLessThanOrEqual(
      Math.round(viewport * 0.55)
    )
    expect(panel.maxHeight as number).toBeGreaterThan(0)
    expect(panel.bottom).toBe(48)
  })

  it('scrolls internally when the legend does not fit', () => {
    expect(openPanel().root.findByType(ScrollView).props.testID).toBe(
      'glyph-compass-scroll'
    )
  })

  it('closes from its labelled 48dp close control', () => {
    const screen = openPanel()
    const close = control(screen, 'glyph-compass-close')[0]

    expect(close.props.accessibilityLabel).toBe('Close Glyph Compass')
    expect(flatten(close.props.style({ pressed: false })).minHeight).toBe(
      theme.touchTarget.min
    )

    act(() => close.props.onPress())
    expect(node(screen, 'glyph-compass-panel')).toHaveLength(0)
    expect(control(screen, 'glyph-compass-trigger')).toHaveLength(1)
  })

  it('closes on Android back and consumes the event', () => {
    const screen = openPanel()
    expect(backHandlers).toHaveLength(1)

    let handled = false
    act(() => {
      handled = backHandlers[0]()
    })

    // Returning true stops the press bubbling into route navigation.
    expect(handled).toBe(true)
    expect(node(screen, 'glyph-compass-panel')).toHaveLength(0)
  })

  it('registers no back handler while closed', () => {
    render(<GlyphCompass />)
    expect(backHandlers).toHaveLength(0)
  })
})
