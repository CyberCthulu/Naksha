import React from 'react'
import { Animated, AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { celestialConfig } from '../celestialConfig'
import { useShootingStar } from '../useShootingStar'

let mockReducedMotion: boolean | null = false

jest.mock('../useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

const { act, create } = TestRenderer
const config = celestialConfig.shootingStar
type Motion = ReturnType<typeof useShootingStar>
let motion: Motion

function Probe({
  enabled = true,
  width = 360,
  height = 800,
}: {
  enabled?: boolean
  width?: number
  height?: number
}) {
  motion = useShootingStar(enabled, width, height)
  return <Animated.View style={{ opacity: motion.opacity }} />
}

function valueOf(value: unknown): number {
  return (value as { __getValue(): number }).__getValue()
}

type Flight = {
  start: jest.Mock
  stop: jest.Mock
  reset: jest.Mock
  complete?: (result: { finished: boolean }) => void
}

describe('useShootingStar', () => {
  let renderer: ReturnType<typeof create> | null
  let listener: (state: AppStateStatus) => void
  let removeListener: jest.Mock
  let addListener: jest.SpyInstance
  let timing: jest.SpyInstance
  let flights: Flight[]
  let originalAppState: AppStateStatus

  function render(props: React.ComponentProps<typeof Probe> = {}) {
    act(() => {
      renderer = create(<Probe {...props} />)
    })
  }

  function update(props: React.ComponentProps<typeof Probe> = {}) {
    act(() => renderer!.update(<Probe {...props} />))
  }

  function advance(ms: number) {
    act(() => jest.advanceTimersByTime(ms))
  }

  function finish(flight: Flight = flights[flights.length - 1]) {
    act(() => {
      motion.progress.setValue(1)
      flight.complete!({ finished: true })
    })
  }

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.useFakeTimers()
    originalAppState = AppState.currentState
    AppState.currentState = 'active'
    renderer = null
    mockReducedMotion = false
    flights = []
    removeListener = jest.fn()
    addListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listener = handler as (state: AppStateStatus) => void
        return { remove: removeListener }
      })
    addListener.mockClear()
    timing = jest.spyOn(Animated, 'timing').mockImplementation(() => {
      const flight: Flight = {
        start: jest.fn((callback) => {
          flight.complete = callback
        }),
        // Native cancellation may immediately call the completion callback.
        stop: jest.fn(() => flight.complete?.({ finished: false })),
        reset: jest.fn(),
      }
      flights.push(flight)
      return flight
    })
  })

  afterEach(() => {
    if (renderer) act(() => renderer!.unmount())
    AppState.currentState = originalAppState
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('waits before one native flight without holding an interaction open', () => {
    render()
    expect(valueOf(motion.opacity)).toBe(0)
    expect(timing).not.toHaveBeenCalled()
    expect(jest.getTimerCount()).toBe(1)

    advance(config.firstDelayMs - 1)
    act(() => listener('active'))
    expect(timing).not.toHaveBeenCalled()
    advance(1)

    expect(flights).toHaveLength(1)
    expect(flights[0].start).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
    const [progress, options] = timing.mock.calls[0]
    expect(progress).toBe(motion.progress)
    expect(options).toMatchObject({
      toValue: 1,
      duration: config.durationMs,
      useNativeDriver: true,
      isInteraction: false,
    })
    expect(options.easing(0.25)).toBe(0.25)

    act(() => motion.progress.setValue(0.4))
    expect(valueOf(motion.opacity)).toBeGreaterThan(0)
    advance(100000)
    act(() => listener('active'))
    expect(flights).toHaveLength(1)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('schedules only after completion and rotates deterministic paths and gaps', () => {
    const random = jest.spyOn(Math, 'random')
    render()
    advance(config.firstDelayMs)
    const origins = [[valueOf(motion.origin.x), valueOf(motion.origin.y)]]

    for (const [index, gap] of config.gapsMs.entries()) {
      finish()
      expect(valueOf(motion.opacity)).toBe(0)
      expect(jest.getTimerCount()).toBe(1)
      // A duplicate completion or foreground event cannot queue another star.
      act(() => {
        flights[index].complete!({ finished: true })
        listener('active')
      })
      expect(jest.getTimerCount()).toBe(1)
      advance(gap - 1)
      expect(flights).toHaveLength(index + 1)
      advance(1)
      expect(flights).toHaveLength(index + 2)
      origins.push([valueOf(motion.origin.x), valueOf(motion.origin.y)])
      const x = valueOf(motion.translateX)
      const y = valueOf(motion.translateY)
      act(() => motion.progress.setValue(0.5))
      expect(valueOf(motion.translateX)).toBeGreaterThan(x)
      expect(valueOf(motion.translateY)).toBeGreaterThan(y)
    }

    expect(origins[0]).not.toEqual(origins[1])
    expect(origins[1]).not.toEqual(origins[2])
    expect(origins[3]).toEqual(origins[0])
    expect(random).not.toHaveBeenCalled()
  })

  it.each([true, null])('does no work with motion preference %s', (preference) => {
    mockReducedMotion = preference
    render()
    expect(jest.getTimerCount()).toBe(0)
    expect(addListener).not.toHaveBeenCalled()
    expect(valueOf(motion.opacity)).toBe(0)

    mockReducedMotion = false
    update()
    advance(config.firstDelayMs)
    expect(flights).toHaveLength(1)
  })

  it.each([
    { enabled: false },
    { width: 0 },
    { height: 0 },
  ])('does no work before enabled and sized: %s', (props) => {
    render(props)
    expect(jest.getTimerCount()).toBe(0)
    expect(addListener).not.toHaveBeenCalled()
    expect(valueOf(motion.opacity)).toBe(0)
    update()
    advance(config.firstDelayMs)
    expect(flights).toHaveLength(1)
  })

  it.each([null, 'inactive', 'background'] as const)(
    'waits for the foreground when initial AppState is %s',
    (state) => {
      Object.assign(AppState, { currentState: state })
      render()
      expect(jest.getTimerCount()).toBe(0)
      expect(flights).toHaveLength(0)
      act(() => listener('active'))
      advance(config.firstDelayMs)
      expect(flights).toHaveLength(1)
    }
  )

  it.each(['inactive', 'background'] as const)(
    'cancels a waiting timer on %s and waits afresh on resume',
    (state) => {
      render()
      advance(config.firstDelayMs - 1)
      act(() => listener(state))
      expect(jest.getTimerCount()).toBe(0)
      advance(100000)
      expect(flights).toHaveLength(0)

      act(() => {
        listener('active')
        listener('active')
      })
      expect(jest.getTimerCount()).toBe(1)
      advance(config.firstDelayMs - 1)
      expect(flights).toHaveLength(0)
      advance(1)
      expect(flights).toHaveLength(1)
    }
  )

  it('stops an active flight and ignores stale completion after resuming', () => {
    render()
    advance(config.firstDelayMs)
    const interrupted = flights[0]
    const stopAnimation = jest.spyOn(motion.progress, 'stopAnimation')
    act(() => {
      motion.progress.setValue(0.5)
      listener('inactive')
    })
    expect(interrupted.stop).toHaveBeenCalledTimes(1)
    expect(stopAnimation).toHaveBeenCalled()
    expect(valueOf(motion.opacity)).toBe(0)
    expect(jest.getTimerCount()).toBe(0)

    act(() => listener('active'))
    advance(config.firstDelayMs)
    act(() => {
      motion.progress.setValue(0.4)
      interrupted.complete!({ finished: true })
    })
    expect(valueOf(motion.progress)).toBe(0.4)
    expect(jest.getTimerCount()).toBe(0)
    expect(flights).toHaveLength(2)
    finish()
    expect(jest.getTimerCount()).toBe(1)
  })

  it.each(['disabled', 'reduced', 'unresolved', 'unmount'] as const)(
    'cancels a waiting timer when %s',
    (reason) => {
      render()
      const previousListener = listener
      if (reason === 'unmount') {
        act(() => renderer!.unmount())
        renderer = null
      } else if (reason === 'disabled') {
        update({ enabled: false })
      } else {
        mockReducedMotion = reason === 'reduced' ? true : null
        update()
      }
      expect(removeListener).toHaveBeenCalledTimes(1)
      act(() => previousListener('active'))
      advance(100000)
      expect(flights).toHaveLength(0)
      expect(jest.getTimerCount()).toBe(0)
    }
  )

  it.each(['disabled', 'reduced', 'unresolved', 'unmount'] as const)(
    'stops and resets active motion when %s',
    (reason) => {
      render()
      advance(config.firstDelayMs)
      const previousListener = listener
      const value = motion.progress
      act(() => value.setValue(0.6))
      if (reason === 'unmount') {
        act(() => renderer!.unmount())
        renderer = null
      } else if (reason === 'disabled') {
        update({ enabled: false })
      } else {
        mockReducedMotion = reason === 'reduced' ? true : null
        update()
      }

      expect(flights[0].stop).toHaveBeenCalledTimes(1)
      expect(valueOf(value)).toBe(0)
      expect(removeListener).toHaveBeenCalledTimes(1)
      act(() => {
        previousListener('active')
        flights[0].complete!({ finished: true })
      })
      advance(100000)
      expect(flights).toHaveLength(1)
      expect(jest.getTimerCount()).toBe(0)
    }
  )

  it('cancels a flight before adopting new layout dimensions', () => {
    render()
    advance(config.firstDelayMs)
    const originalOrigin = [valueOf(motion.origin.x), valueOf(motion.origin.y)]
    update({ width: 720, height: 1600 })
    expect(flights[0].stop).toHaveBeenCalledTimes(1)
    expect(valueOf(motion.opacity)).toBe(0)
    advance(config.firstDelayMs)
    expect(flights).toHaveLength(2)
    expect([valueOf(motion.origin.x), valueOf(motion.origin.y)]).toEqual(
      originalOrigin.map((value) => value * 2)
    )
  })
})
