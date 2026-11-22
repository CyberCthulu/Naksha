import React from 'react'
import { Animated, StyleSheet } from 'react-native'
import Svg, { Circle, Mask, Path } from 'react-native-svg'
import TestRenderer from 'react-test-renderer'

import { CelestialLoader } from '../CelestialLoader'
import { ScreenActivityProvider } from '../ScreenActivity'
import { theme } from '../theme'
import { useCelestialLoadingMotion } from '../useCelestialLoadingMotion'

jest.mock('../useCelestialLoadingMotion', () => ({
  useCelestialLoadingMotion: jest.fn(),
}))

const { act, create } = TestRenderer
const motion = jest.mocked(useCelestialLoadingMotion)

describe('CelestialLoader', () => {
  let renderer: ReturnType<typeof create> | null
  let phase: Animated.Value

  function render(element: React.ReactElement) {
    act(() => {
      renderer = create(element)
    })
    return renderer!
  }

  function opacity(layer: string): number {
    const node = renderer!.root.findByProps({
      testID: `celestial-loader-${layer}`,
    })
    const value = StyleSheet.flatten(node.props.style).opacity
    return typeof value === 'number' ? value : value.__getValue()
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    phase = new Animated.Value(0)
    motion.mockReset().mockReturnValue(phase)
  })

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount())
  })

  it('shows a complete sun in the static fallback used for reduced motion', () => {
    const screen = render(<CelestialLoader motionEnabled={false} />)

    expect(motion).toHaveBeenLastCalledWith(false)
    expect(opacity('sun')).toBe(1)
    expect(opacity('crescent')).toBe(0)
    expect(opacity('half')).toBe(0)
    expect(opacity('full')).toBe(0)
    const outer = screen.root.findByProps({ testID: 'celestial-loader' })
    expect(StyleSheet.flatten(outer.props.style)).toMatchObject({
      width: 96,
      height: 96,
    })
    const rays = screen.root.findAllByType(Path).find((node) => node.props.stroke)
    expect(rays?.props.stroke).toBe(theme.accent.base)
  })

  it('keeps decoration silent and preserves custom layout and one host testID', () => {
    const screen = render(
      <CelestialLoader size={80} testID="chart-loader" style={{ marginTop: 12 }} />
    )
    const host = screen.root.findAll(
      (node) => typeof node.type === 'string' && node.props.testID === 'chart-loader'
    )

    expect(host).toHaveLength(1)
    expect(host[0].props).toMatchObject({
      pointerEvents: 'none',
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    })
    expect(StyleSheet.flatten(host[0].props.style)).toMatchObject({
      width: 80,
      height: 80,
      marginTop: 12,
    })
  })

  it('gates animation on route visibility and explicit disabling', () => {
    const screen = render(
      <ScreenActivityProvider active={false}>
        <ScreenActivityProvider active>
          <CelestialLoader />
        </ScreenActivityProvider>
      </ScreenActivityProvider>
    )
    expect(motion).toHaveBeenLastCalledWith(false)

    act(() => {
      screen.update(
        <ScreenActivityProvider active>
          <CelestialLoader />
        </ScreenActivityProvider>
      )
    })
    expect(motion).toHaveBeenLastCalledWith(true)

    act(() => screen.update(<CelestialLoader motionEnabled={false} />))
    expect(motion).toHaveBeenLastCalledWith(false)
  })

  it('waits in its solar state before entering lunar phases and loops without disappearing', () => {
    render(<CelestialLoader />)
    act(() => phase.setValue(0.4))
    expect(opacity('sun')).toBe(1)

    for (const [position, visible] of [
      [0.54, 'crescent'],
      [0.7, 'half'],
      [0.86, 'full'],
      [1, 'sun'],
    ] as const) {
      act(() => phase.setValue(position))
      expect(opacity(visible)).toBe(1)
    }

    for (const position of [0, 0.46, 0.62, 0.78, 0.95, 1]) {
      act(() => phase.setValue(position))
      const total = ['sun', 'crescent', 'half', 'full'].reduce(
        (sum, layer) => sum + opacity(layer),
        0
      )
      expect(total).toBeCloseTo(1)
    }
  })

  it.each([20, 24])('keeps a clean sun throughout the cycle at size %i', (size) => {
    const color = theme.text.onAccent
    const screen = render(<CelestialLoader size={size} color={color} />)
    act(() => phase.setValue(0.7))

    expect(opacity('sun')).toBe(1)
    expect(screen.root.findAllByProps({ testID: 'celestial-loader-half' })).toHaveLength(0)
    expect(screen.root.findAllByType(Svg)).toHaveLength(2)
    expect(screen.root.findAllByType(Mask)).toHaveLength(0)
    expect(screen.root.findByType(Path).props.stroke).toBe(color)
    expect(screen.root.findByType(Circle).props.fill).toBe(color)
  })

  it('cuts the crescent out with a local mask so any background can show through', () => {
    const screen = render(<CelestialLoader />)
    const mask = screen.root.findByType(Mask)

    expect(mask.props.maskUnits).toBe('userSpaceOnUse')
    expect(mask.findAllByType(Circle).map((node) => node.props.fill)).toEqual([
      'white',
      'black',
    ])
    expect(screen.root.findAllByType(Circle).some(
      (node) => node.props.fill === theme.background.base
    )).toBe(false)
  })
})
