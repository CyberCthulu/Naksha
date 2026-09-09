import React from 'react'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { useCelestialLoadingMotion } from '../useCelestialLoadingMotion'

let mockReducedMotion: boolean | null = false

jest.mock('../useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

const { act, create } = TestRenderer

function Probe({ enabled = true }: { enabled?: boolean }) {
  const phase = useCelestialLoadingMotion(enabled)
  return <Animated.View testID="celestial-phase" style={{ opacity: phase }} />
}

describe('useCelestialLoadingMotion', () => {
  let renderer: ReturnType<typeof create> | null
  let listener: (state: AppStateStatus) => void
  let removeListener: jest.Mock
  let addListener: jest.SpyInstance
  let timing: jest.SpyInstance
  let loop: jest.SpyInstance
  let loops: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[]
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

  function phase(): Animated.Value & { __getValue(): number } {
    return renderer!.root.findByProps({ testID: 'celestial-phase' }).props.style.opacity
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
    mockReducedMotion = false
    originalAppState = AppState.currentState
    AppState.currentState = 'active'
    loops = []
    removeListener = jest.fn()
    addListener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      listener = handler as (state: AppStateStatus) => void
      return { remove: removeListener }
    })
    addListener.mockClear()
    timing = jest.spyOn(Animated, 'timing')
    loop = jest.spyOn(Animated, 'loop').mockImplementation(() => {
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

  it('starts one 12-second native linear loop immediately without holding an interaction open', () => {
    render()

    expect(phase().__getValue()).toBe(0)
    expect(loops).toHaveLength(1)
    expect(loops[0].start).toHaveBeenCalledTimes(1)
    expect(timing).toHaveBeenCalledTimes(1)
    expect(loop.mock.calls[0][0]).toBe(timing.mock.results[0].value)
    const [value, options] = timing.mock.calls[0]
    expect(value).toBe(phase())
    expect(options).toMatchObject({
      toValue: 1,
      duration: 12000,
      useNativeDriver: true,
      isInteraction: false,
    })
    for (const progress of [0, 0.2, 0.6, 1]) {
      expect(options.easing(progress)).toBe(progress)
    }
  })

  it('preserves its phase and running loop across ordinary renders and repeated active events', () => {
    render()
    const value = phase()
    act(() => value.setValue(0.3))
    update()
    act(() => {
      listener('active')
      listener('active')
    })

    expect(phase()).toBe(value)
    expect(phase().__getValue()).toBe(0.3)
    expect(loops).toHaveLength(1)
    expect(loops[0].start).toHaveBeenCalledTimes(1)
    expect(addListener).toHaveBeenCalledTimes(1)
  })

  it.each([null, true])('stays in its static solar phase with reduced motion %s', (preference) => {
    mockReducedMotion = preference
    render()
    expect(phase().__getValue()).toBe(0)
    expect(loops).toHaveLength(0)
    expect(addListener).not.toHaveBeenCalled()

    mockReducedMotion = false
    update()
    expect(loops[0].start).toHaveBeenCalledTimes(1)
  })

  it.each([null, 'inactive', 'background'] as const)(
    'waits for an active app when its initial state is %s', (state) => {
      Object.assign(AppState, { currentState: state })
      render()
      expect(phase().__getValue()).toBe(0)
      expect(loops).toHaveLength(0)

      act(() => listener('active'))
      expect(loops[0].start).toHaveBeenCalledTimes(1)
    }
  )

  it('stops and resets on inactive/background, then starts only one replacement loop', () => {
    render()
    const value = phase()
    const stopAnimation = jest.spyOn(value, 'stopAnimation')

    for (const state of ['inactive', 'background'] as const) {
      const previous = loops[loops.length - 1]
      act(() => {
        value.setValue(0.75)
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

  it('does no work while disabled and cleans up a previously enabled loader', () => {
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
    expect(loops[1].start).toHaveBeenCalledTimes(1)
  })

  it.each([true, null])('immediately returns to the static solar phase when reduced motion becomes %s', (preference) => {
    render()
    const value = phase()
    act(() => value.setValue(0.8))
    mockReducedMotion = preference
    update()

    expect(loops[0].stop).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(value.__getValue()).toBe(0)
    act(() => listener('active'))
    expect(loops).toHaveLength(1)
  })

  it('cancels immediately on unmount and ignores queued app state events', () => {
    render()
    const value = phase()
    act(() => {
      value.setValue(0.2)
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
