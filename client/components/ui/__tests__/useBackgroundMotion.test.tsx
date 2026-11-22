import React from 'react'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { useBackgroundMotion } from '../useBackgroundMotion'

let mockReducedMotion: boolean | null = false

jest.mock('../useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

const { act, create } = TestRenderer

function Probe({ enabled = true }: { enabled?: boolean }) {
  const opacity = useBackgroundMotion(enabled)
  return <Animated.View testID="motion-layer" style={{ opacity }} />
}

describe('useBackgroundMotion', () => {
  let renderer: ReturnType<typeof create> | null
  let listener: (state: AppStateStatus) => void
  let removeListener: jest.Mock
  let addListener: jest.SpyInstance
  let timing: jest.SpyInstance
  let loop: jest.SpyInstance
  let loops: { start: jest.Mock; stop: jest.Mock }[]
  let originalAppState: AppStateStatus

  function render(enabled = true) {
    act(() => {
      renderer = create(<Probe enabled={enabled} />)
    })
  }

  function update(enabled = true) {
    act(() => {
      renderer!.update(<Probe enabled={enabled} />)
    })
  }

  function opacity(): Animated.Value & { __getValue(): number } {
    return renderer!.root.findByProps({ testID: 'motion-layer' }).props.style
      .opacity
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    originalAppState = AppState.currentState
    AppState.currentState = 'active'
    renderer = null
    mockReducedMotion = false
    loops = []
    removeListener = jest.fn()
    addListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listener = handler as (state: AppStateStatus) => void
        return { remove: removeListener }
      })
    addListener.mockClear()
    timing = jest.spyOn(Animated, 'timing')
    loop = jest.spyOn(Animated, 'loop').mockImplementation(() => {
      const animation = {
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      }
      loops.push(animation)
      return animation
    })
  })

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount())
    AppState.currentState = originalAppState
    jest.restoreAllMocks()
  })

  it('uses a slow native opacity loop that does not hold an interaction open', () => {
    render()

    expect(opacity()).toBeInstanceOf(Animated.Value)
    expect(opacity().__getValue()).toBe(0)
    expect(loops).toHaveLength(1)
    expect(loops[0].start).toHaveBeenCalledTimes(1)
    expect(timing).toHaveBeenCalledTimes(2)
    expect(timing.mock.calls.map(([value, options]) => [value, options.toValue]))
      .toEqual([[opacity(), 1], [opacity(), 0]])
    for (const [, options] of timing.mock.calls) {
      expect(options).toMatchObject({
        duration: 6000,
        useNativeDriver: true,
        isInteraction: false,
      })
      expect(options.easing(0)).toBe(0)
      expect(options.easing(0.5)).toBe(0.5)
      expect(options.easing(1)).toBe(1)
    }
  })

  it.each([null, true])('stays static with reduced motion %s', (preference) => {
    mockReducedMotion = preference
    render()

    expect(opacity().__getValue()).toBe(0)
    expect(loop).not.toHaveBeenCalled()
    expect(addListener).not.toHaveBeenCalled()

    mockReducedMotion = false
    update()
    expect(loops[0].start).toHaveBeenCalledTimes(1)
  })

  it.each([null, 'inactive', 'background'] as const)(
    'waits for the foreground when initial AppState is %s',
    (state) => {
      // The native platform may initially report null despite RN's type.
      Object.assign(AppState, { currentState: state })
      render()
      expect(opacity().__getValue()).toBe(0)
      expect(loop).not.toHaveBeenCalled()

      act(() => listener('active'))
      expect(loops[0].start).toHaveBeenCalledTimes(1)
    }
  )

  it('stops and resets on both inactive and background, then resumes only once', () => {
    render()
    const value = opacity()
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

  it('does no work while disabled and cancels a previously enabled screen', () => {
    render(false)
    expect(loop).not.toHaveBeenCalled()
    expect(addListener).not.toHaveBeenCalled()

    update(true)
    const value = opacity()
    act(() => value.setValue(0.5))
    update(false)

    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(value.__getValue()).toBe(0)
    act(() => listener('active'))
    expect(loops).toHaveLength(1)

    update(true)
    expect(opacity()).toBe(value)
    expect(loops).toHaveLength(2)
    expect(loops[1].start).toHaveBeenCalledTimes(1)
  })

  it.each([true, null])(
    'cancels active motion immediately when preference becomes %s',
    (preference) => {
      render()
      const value = opacity()
      act(() => value.setValue(0.8))

      mockReducedMotion = preference
      update()

      expect(loops[0].stop).toHaveBeenCalledTimes(1)
      expect(removeListener).toHaveBeenCalledTimes(1)
      expect(value.__getValue()).toBe(0)
      act(() => listener('active'))
      expect(loops).toHaveLength(1)
    }
  )

  it('cancels and removes the listener on unmount, ignoring queued events', () => {
    render()
    const value = opacity()
    act(() => {
      value.setValue(0.5)
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
