import React from 'react'
import { Animated } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { CosmicSky } from '../CosmicSky'
import { useCosmicMotion } from '../useCosmicMotion'

jest.mock('../useCosmicMotion', () => ({ useCosmicMotion: jest.fn() }))

const { act, create } = TestRenderer
const motion = jest.mocked(useCosmicMotion)

describe('CosmicSky', () => {
  let renderer: ReturnType<typeof create> | null
  let phase: Animated.Value

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    phase = new Animated.Value(0)
    motion.mockReset().mockReturnValue(phase)
  })

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount())
  })

  it('keeps both clouds visible with motion disabled and hides decoration from accessibility', () => {
    act(() => {
      renderer = create(<CosmicSky width={390} height={844} enabled={false} />)
    })
    expect(motion).toHaveBeenLastCalledWith(false, 24000)
    const decoration = renderer!.root.findByProps({ testID: 'background-cosmic-sky' })
    expect(decoration.props).toMatchObject({
      pointerEvents: 'none',
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    })
    for (const color of ['plum', 'teal']) {
      const cloud = renderer!.root.findByProps({ testID: `background-cosmic-${color}` })
      expect(cloud.props.style.opacity.__getValue()).toBeGreaterThan(0)
      expect(cloud.props.renderToHardwareTextureAndroid).toBe(false)
    }
  })

  it('crossfades colors and moves the clouds in opposing directions without fading the sky away', () => {
    act(() => {
      renderer = create(<CosmicSky width={390} height={844} enabled />)
    })
    const plum = renderer!.root.findByProps({ testID: 'background-cosmic-plum' }).props.style
    const teal = renderer!.root.findByProps({ testID: 'background-cosmic-teal' }).props.style
    const startPlum = plum.opacity.__getValue()
    const startTeal = teal.opacity.__getValue()
    const startPlumX = plum.transform[0].translateX.__getValue()
    const startTealX = teal.transform[0].translateX.__getValue()
    act(() => phase.setValue(1))
    expect(plum.opacity.__getValue()).toBeGreaterThan(startPlum)
    expect(teal.opacity.__getValue()).toBeLessThan(startTeal)
    expect(teal.opacity.__getValue()).toBeGreaterThan(0)
    expect(plum.transform[0].translateX.__getValue()).toBeGreaterThan(startPlumX)
    expect(teal.transform[0].translateX.__getValue()).toBeLessThan(startTealX)
  })

  it('supports a quieter sky and the shared configurable duration', () => {
    act(() => {
      renderer = create(<CosmicSky width={390} height={844} enabled intensity={0.5} halfCycleMs={30000} />)
    })
    expect(motion).toHaveBeenLastCalledWith(true, 30000)
    for (const color of ['plum', 'teal']) {
      const opacity = renderer!.root.findByProps({ testID: `background-cosmic-${color}` }).props.style.opacity
      expect(opacity.__getValue()).toBeGreaterThan(0)
      expect(opacity.__getValue()).toBeLessThanOrEqual(0.5)
      act(() => phase.setValue(1))
      expect(opacity.__getValue()).toBeGreaterThan(0)
      expect(opacity.__getValue()).toBeLessThanOrEqual(0.5)
    }
  })

  it.each([
    { width: 0, height: 844, intensity: 1 },
    { width: 390, height: 0, intensity: 1 },
    { width: 390, height: 844, intensity: 0 },
  ])('does no animation work for an invisible sky: %j', (props) => {
    act(() => {
      renderer = create(<CosmicSky {...props} enabled />)
    })
    expect(motion).toHaveBeenLastCalledWith(false, 24000)
    expect(renderer!.toJSON()).toBeNull()
  })
})
