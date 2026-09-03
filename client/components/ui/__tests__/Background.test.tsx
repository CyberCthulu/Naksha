import React from 'react'
import { AccessibilityInfo, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'
import { Circle, Rect } from 'react-native-svg'

import { Background, type BackgroundVariant } from '../Background'
import { theme } from '../theme'

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null
let removeListener: jest.Mock

function mockReducedMotion(enabled: boolean, resolve = true) {
  const isEnabled = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockImplementation(() =>
      resolve ? Promise.resolve(enabled) : new Promise<boolean>(() => {})
    )

  removeListener = jest.fn()
  const addListener = jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockReturnValue({ remove: removeListener } as never)

  return { isEnabled, addListener }
}

const LAYOUT = { nativeEvent: { layout: { width: 360, height: 800 } } }

async function renderBackground(
  variant: BackgroundVariant,
  extraProps: Record<string, unknown> = {}
) {
  await act(async () => {
    renderer = create(
      <Background variant={variant} {...extraProps}>
        <Text>content</Text>
      </Background>
    )
  })

  if (!renderer) throw new Error('Background did not render')

  // The decorative layer is sized from the container, so a layout pass is
  // required before any SVG exists.
  await act(async () => {
    renderer!.root
      .find((node) => String(node.type) === 'View' && !!node.props.onLayout)
      .props.onLayout(LAYOUT)
  })

  return renderer
}

function stars(screen: ReturnType<typeof create>) {
  return screen.root
    .findAllByType(Circle)
    .filter((node) => node.props.testID === 'background-star')
}

function decoration(screen: ReturnType<typeof create>) {
  return screen.root.findAll(
    (node) => node.props?.testID === 'background-decoration'
  )
}

describe('Background', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    mockReducedMotion(false)
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

  it('always paints the flat base color so content stays legible', async () => {
    for (const variant of [
      'flat',
      'quiet',
      'atmospheric',
      'hero',
    ] as BackgroundVariant[]) {
      const screen = await renderBackground(variant)
      const root = screen.root.find(
        (node) => String(node.type) === 'View' && !!node.props.onLayout
      )
      const style = Array.isArray(root.props.style)
        ? Object.assign({}, ...root.props.style.filter(Boolean))
        : root.props.style

      expect(style.backgroundColor).toBe(theme.background.base)
      expect(screen.root.findAllByType(Text)).toHaveLength(1)

      act(() => screen.unmount())
      renderer = null
    }
  })

  it('renders no decoration at all for the flat variant', async () => {
    const screen = await renderBackground('flat')

    expect(decoration(screen)).toHaveLength(0)
    expect(screen.root.findAllByType(Circle)).toHaveLength(0)
    expect(screen.root.findAllByType(Rect)).toHaveLength(0)
  })

  it('renders the gradient but no stars for the quiet variant', async () => {
    const screen = await renderBackground('quiet')

    expect(screen.root.findAllByType(Rect)).toHaveLength(1)
    expect(stars(screen)).toHaveLength(0)
  })

  it('renders twelve stars for the atmospheric variant', async () => {
    const screen = await renderBackground('atmospheric')

    expect(screen.root.findAllByType(Rect)).toHaveLength(1)
    expect(stars(screen)).toHaveLength(12)
  })

  it('adds a single restrained planet-tinted glow for the hero variant', async () => {
    const screen = await renderBackground('hero', { planet: 'Mars' })

    expect(stars(screen)).toHaveLength(12)

    const glow = screen.root
      .findAllByType(Circle)
      .filter((node) => node.props.testID === 'background-hero-glow')
    expect(glow).toHaveLength(1)

    const stops = screen.root.findAll(
      (node) => node.props?.stopColor === theme.planet.Mars
    )
    expect(stops.length).toBeGreaterThan(0)
    expect(stops[0].props.stopOpacity).toBe('0.08')
  })

  it('places stars deterministically across renders', async () => {
    const first = await renderBackground('atmospheric')
    const firstPositions = stars(first).map((s) => [s.props.cx, s.props.cy])
    act(() => first.unmount())
    renderer = null

    const second = await renderBackground('atmospheric')
    const secondPositions = stars(second).map((s) => [s.props.cx, s.props.cy])

    expect(secondPositions).toEqual(firstPositions)
    expect(firstPositions).toHaveLength(12)
  })

  it('never calls Math.random while rendering', async () => {
    const random = jest.spyOn(Math, 'random')

    await renderBackground('hero', { planet: 'Sun' })

    expect(random).not.toHaveBeenCalled()
  })

  it('hides decoration from assistive tech and never intercepts touches', async () => {
    const screen = await renderBackground('atmospheric')
    const layer = decoration(screen)[0]

    expect(layer.props.pointerEvents).toBe('none')
    expect(layer.props.accessibilityElementsHidden).toBe(true)
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants')
    expect(layer.props.accessible).toBe(false)
  })
})

describe('Background reduced-motion behavior', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
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

  it('falls back to flat when reduced motion is enabled', async () => {
    mockReducedMotion(true)
    const screen = await renderBackground('hero', { planet: 'Sun' })

    expect(decoration(screen)).toHaveLength(0)
    expect(screen.root.findAllByType(Text)).toHaveLength(1)
  })

  it('holds decoration until the preference resolves', async () => {
    // Unresolved must not flash decoration in and then snatch it away.
    mockReducedMotion(false, false)
    const screen = await renderBackground('atmospheric')

    expect(decoration(screen)).toHaveLength(0)
  })

  it('removes its listener on unmount', async () => {
    mockReducedMotion(false)
    const screen = await renderBackground('quiet')

    expect(removeListener).not.toHaveBeenCalled()

    act(() => {
      screen.unmount()
    })
    renderer = null

    expect(removeListener).toHaveBeenCalledTimes(1)
  })

  it('treats an unavailable platform setting as no preference', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unsupported'))
    removeListener = jest.fn()
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue({ remove: removeListener } as never)

    const screen = await renderBackground('atmospheric')

    expect(stars(screen)).toHaveLength(12)
  })
})
