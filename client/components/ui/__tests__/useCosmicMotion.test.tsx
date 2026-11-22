import React from 'react'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { useCosmicMotion } from '../useCosmicMotion'

let mockReducedMotion: boolean | null = false
jest.mock('../useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

const { act, create } = TestRenderer

function Probe({ enabled = true, halfCycleMs = 24000 }) {
  const phase = useCosmicMotion(enabled, halfCycleMs)
  return <Animated.View testID="cosmic-motion" style={{ opacity: phase }} />
}

describe('useCosmicMotion', () => {
  let renderer: ReturnType<typeof create> | null
  let listener: (state: AppStateStatus) => void
  let removeListener: jest.Mock
  let addListener: jest.SpyInstance
  let timing: jest.SpyInstance
  let loops: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[]
  let originalAppState: AppStateStatus

  function render(enabled = true, halfCycleMs = 24000) {
    act(() => {
      renderer = create(<Probe enabled={enabled} halfCycleMs={halfCycleMs} />)
    })
  }

  function update(enabled = true, halfCycleMs = 24000) {
    act(() => {
      renderer!.update(<Probe enabled={enabled} halfCycleMs={halfCycleMs} />)
    })
  }

  function phase(): Animated.Value & { __getValue(): number } {
    return renderer!.root.findByProps({ testID: 'cosmic-motion' }).props.style.opacity
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    originalAppState = AppState.currentState
    AppState.currentState = 'active'
    renderer = null
    mockReducedMotion = false
    loops = []
    removeListener = jest.fn()
    addListener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      listener = handler as (state: AppStateStatus) => void
      return { remove: removeListener }
    })
    addListener.mockClear()
    timing = jest.spyOn(Animated, 'timing')
    jest.spyOn(Animated, 'loop').mockImplementation(() => {
      const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() }
      loops.push(animation)
      return animation
    })
  })

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount())
    AppState.currentState = originalAppState
    jest.restoreAllMocks()
  })

  it('runs a 48-second native cycle without holding an interaction open', () => {
    render()
    expect(phase().__getValue()).toBe(0)
    expect(loops).toHaveLength(1)
    expect(loops[0].start).toHaveBeenCalledTimes(1)
    expect(timing.mock.calls.map(([value, options]) => [value, options.toValue]))
      .toEqual([[phase(), 1], [phase(), 0]])
    for (const [, options] of timing.mock.calls) {
      expect(options).toMatchObject({
        duration: 24000,
        useNativeDriver: true,
        isInteraction: false,
      })
      expect(options.easing(0)).toBeCloseTo(0)
      expect(options.easing(0.5)).toBeCloseTo(0.5)
      expect(options.easing(1)).toBeCloseTo(1)
    }
  })

  it.each([null, true])('stays still while reduced motion is %s', (preference) => {
    mockReducedMotion = preference
    render()
    expect(phase().__getValue()).toBe(0)
    expect(loops).toHaveLength(0)
    expect(addListener).not.toHaveBeenCalled()
    mockReducedMotion = false
    update()
    expect(loops[0].start).toHaveBeenCalledTimes(1)
  })

  it.each([null, 'background', 'inactive'] as const)(
    'waits for an active app when initial AppState is %s', (state) => {
      Object.assign(AppState, { currentState: state })
      render()
      expect(loops).toHaveLength(0)
      act(() => listener('active'))
      expect(loops[0].start).toHaveBeenCalledTimes(1)
    }
  )

  it('cancels on inactive/background and resumes only one cycle', () => {
    render()
    const value = phase()
    const stopAnimation = jest.spyOn(value, 'stopAnimation')
    for (const state of ['inactive', 'background'] as const) {
      const previous = loops[loops.length - 1]
      act(() => {
        value.setValue(0.7)
        listener(state)
      })
      expect(previous.stop).toHaveBeenCalledTimes(1)
      expect(stopAnimation).toHaveBeenCalled()
      expect(value.__getValue()).toBe(0)
      const count = loops.length
      act(() => {
        listener('active')
        listener('active')
      })
      expect(loops).toHaveLength(count + 1)
      expect(loops[loops.length - 1].start).toHaveBeenCalledTimes(1)
    }
  })

  it('starts when enabled, then stops and ignores queued events when disabled', () => {
    render(false)
    expect(loops).toHaveLength(0)
    expect(addListener).not.toHaveBeenCalled()
    update()
    const value = phase()
    act(() => value.setValue(0.5))
    update(false)
    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(value.__getValue()).toBe(0)
    act(() => listener('active'))
    expect(loops).toHaveLength(1)
    update()
    expect(phase()).toBe(value)
    expect(loops).toHaveLength(2)
  })

  it.each([true, null])('cancels if reduced motion changes to %s', (preference) => {
    render()
    const value = phase()
    act(() => value.setValue(0.8))
    mockReducedMotion = preference
    update()
    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(value.__getValue()).toBe(0)
    expect(removeListener).toHaveBeenCalledTimes(1)
    act(() => listener('active'))
    expect(loops).toHaveLength(1)
  })

  it('replaces the cycle when the configured duration changes', () => {
    render()
    update(true, 30000)
    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(loops).toHaveLength(2)
    expect(timing.mock.calls.slice(-2).map(([, options]) => options.duration))
      .toEqual([30000, 30000])
  })

  it('cleans up on unmount and ignores queued lifecycle events', () => {
    render()
    const value = phase()
    act(() => {
      value.setValue(0.4)
      renderer!.unmount()
    })
    renderer = null
    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(value.__getValue()).toBe(0)
    act(() => listener('active'))
    expect(loops).toHaveLength(1)
  })
})
