import React from 'react'
import { AccessibilityInfo, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'
import { Circle, Rect } from 'react-native-svg'

import { Background, type BackgroundVariant } from '../Background'
import { theme } from '../theme'

let mockInsets = { top: 24, right: 0, bottom: 48, left: 0 }

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}))

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
    mockInsets = { top: 24, right: 0, bottom: 48, left: 0 }
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

describe('Background status-bar protection', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    mockInsets = { top: 24, right: 0, bottom: 48, left: 0 }
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

  function protection(screen: ReturnType<typeof create>) {
    return screen.root.findAll(
      (node) =>
        typeof node.type === 'string' &&
        node.props?.testID === 'background-status-bar-protection'
    )
  }

  function protectionStyle(screen: ReturnType<typeof create>) {
    const style = protection(screen)[0].props.style
    return Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style
  }

  it('sizes itself from the real top safe-area inset', async () => {
    mockInsets = { top: 37, right: 0, bottom: 48, left: 0 }
    const screen = await renderBackground('quiet')

    expect(protectionStyle(screen).height).toBe(37)
  })

  it('renders nothing when there is no top inset', async () => {
    mockInsets = { top: 0, right: 0, bottom: 0, left: 0 }
    const screen = await renderBackground('quiet')

    expect(protection(screen)).toHaveLength(0)
  })

  it('is non-interactive and hidden from assistive technology', async () => {
    const screen = await renderBackground('atmospheric')
    const layer = protection(screen)[0]

    expect(layer.props.pointerEvents).toBe('none')
    expect(layer.props.accessible).toBe(false)
    expect(layer.props.accessibilityElementsHidden).toBe(true)
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants')
  })

  it('contributes no layout, so no second inset is introduced', async () => {
    const screen = await renderBackground('quiet')
    const style = protectionStyle(screen)

    // Absolute positioning is what lets it occlude scrolled content without
    // pushing anything down a second time.
    expect(style.position).toBe('absolute')
    expect(style.top).toBe(0)
    expect(style.paddingTop).toBeUndefined()
    expect(style.marginTop).toBeUndefined()

    const root = screen.root.find(
      (node) => String(node.type) === 'View' && !!node.props.onLayout
    )
    const rootStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style
    expect(rootStyle.paddingTop).toBeUndefined()
  })

  it('paints over scrolling content rather than under it', async () => {
    const screen = await renderBackground('quiet')
    const rendered = screen.toJSON() as any
    const children = Array.isArray(rendered.children) ? rendered.children : []

    const ids = children.map((c: any) => c?.props?.testID)
    const statusIndex = ids.indexOf('background-status-bar-protection')
    const navIndex = ids.indexOf('background-navigation-bar-protection')
    const contentIndex = ids.lastIndexOf(undefined)

    // Both protection layers must be painted after any content sibling.
    expect(statusIndex).toBeGreaterThan(contentIndex)
    expect(navIndex).toBeGreaterThan(contentIndex)
  })

  it('is mounted once per Background, not once per child', async () => {
    await act(async () => {
      renderer = create(
        <Background variant="atmospheric">
          <Text>one</Text>
          <Text>two</Text>
          <Text>three</Text>
        </Background>
      )
    })

    expect(protection(renderer!)).toHaveLength(1)
  })

  it('matches the gradient upper stop on decorated variants', async () => {
    for (const variant of ['quiet', 'atmospheric', 'hero'] as const) {
      const screen = await renderBackground(variant)
      expect(protectionStyle(screen).backgroundColor).toBe(
        theme.background.raised
      )
      act(() => screen.unmount())
      renderer = null
    }
  })

  it('falls back to the flat environment colour when decoration is off', async () => {
    mockReducedMotion(true)
    const screen = await renderBackground('hero')

    expect(protectionStyle(screen).backgroundColor).toBe(theme.background.base)
  })
})

describe('Background navigation-bar protection', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    mockInsets = { top: 24, right: 0, bottom: 48, left: 0 }
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

  function navProtection(screen: ReturnType<typeof create>) {
    return screen.root.findAll(
      (node) =>
        typeof node.type === 'string' &&
        node.props?.testID === 'background-navigation-bar-protection'
    )
  }

  function navStyle(screen: ReturnType<typeof create>) {
    const style = navProtection(screen)[0].props.style
    return Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style
  }

  it('sizes itself from the real bottom safe-area inset', async () => {
    mockInsets = { top: 24, right: 0, bottom: 61, left: 0 }
    const screen = await renderBackground('atmospheric')

    expect(navStyle(screen).height).toBe(61)
  })

  it('renders nothing on a device with no bottom inset', async () => {
    mockInsets = { top: 24, right: 0, bottom: 0, left: 0 }
    const screen = await renderBackground('quiet')

    expect(navProtection(screen)).toHaveLength(0)
  })

  it('is anchored to the bottom and contributes no layout', async () => {
    const screen = await renderBackground('quiet')
    const style = navStyle(screen)

    expect(style.position).toBe('absolute')
    expect(style.bottom).toBe(0)
    expect(style.paddingBottom).toBeUndefined()
    expect(style.marginBottom).toBeUndefined()
  })

  it('is non-interactive and hidden from assistive technology', async () => {
    const layer = navProtection(await renderBackground('hero'))[0]

    expect(layer.props.pointerEvents).toBe('none')
    expect(layer.props.accessible).toBe(false)
    expect(layer.props.accessibilityElementsHidden).toBe(true)
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants')
  })

  it('uses the flat environment colour, where the gradient has faded out', async () => {
    for (const variant of ['quiet', 'atmospheric', 'hero'] as const) {
      const screen = await renderBackground(variant)
      expect(navStyle(screen).backgroundColor).toBe(theme.background.base)
      act(() => screen.unmount())
      renderer = null
    }
  })

  it('is mounted once per Background', async () => {
    await act(async () => {
      renderer = create(
        <Background variant="quiet">
          <Text>a</Text>
          <Text>b</Text>
        </Background>
      )
    })

    expect(navProtection(renderer!)).toHaveLength(1)
  })
})
