import React from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'
import { useCurrentSky, SKY_REFRESH_MS } from '../useCurrentSky'
import { buildCurrentSky } from '../../lib/currentSky'

jest.mock('../../lib/currentSky', () => ({ buildCurrentSky: jest.fn() }))
const build = jest.mocked(buildCurrentSky)
const { act, create } = TestRenderer
let result: ReturnType<typeof useCurrentSky>
let renderer: ReturnType<typeof create>
let change: (state: AppStateStatus) => void
let remove: jest.Mock
const originalState = AppState.currentState

function Probe({ enabled = true }: { enabled?: boolean }) {
  result = useCurrentSky(enabled)
  return null
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-12T23:59:00Z'))
  AppState.currentState = 'active'
  build
    .mockReset()
    .mockImplementation((evaluatedAt) => ({
      evaluatedAt,
      planets: [],
      aspects: [],
    }))
  remove = jest.fn()
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      change = listener
      return { remove }
    })
})

afterEach(() => {
  act(() => renderer?.unmount())
  jest.restoreAllMocks()
  jest.useRealTimers()
  AppState.currentState = originalState
})

it('refreshes each minute across midnight and on manual refresh', () => {
  act(() => {
    renderer = create(<Probe />)
  })
  expect(result.sky?.evaluatedAt.toISOString()).toBe('2026-09-12T23:59:00.000Z')
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS)
  })
  expect(result.sky?.evaluatedAt.toISOString()).toBe('2026-09-13T00:00:00.000Z')
  act(() => result.refresh())
  expect(build).toHaveBeenCalledTimes(3)
})

it('pauses when backgrounded, resumes immediately, and removes its timer on unmount', () => {
  act(() => {
    renderer = create(<Probe />)
  })
  act(() => change('background'))
  expect(result.active).toBe(false)
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS * 10)
    result.refresh()
  })
  expect(build).toHaveBeenCalledTimes(1)
  act(() => change('active'))
  expect(result.sky?.evaluatedAt.toISOString()).toBe('2026-09-13T00:09:00.000Z')
  act(() => change('active'))
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS)
  })
  expect(build).toHaveBeenCalledTimes(3)
  act(() => renderer.unmount())
  expect(remove).toHaveBeenCalledTimes(1)
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS * 2)
  })
  expect(build).toHaveBeenCalledTimes(3)
})

it('does no calculations off-screen and refreshes on returning to the route', () => {
  act(() => {
    renderer = create(<Probe enabled={false} />)
  })
  expect(build).not.toHaveBeenCalled()
  act(() => renderer.update(<Probe />))
  expect(build).toHaveBeenCalledTimes(1)
  act(() => renderer.update(<Probe enabled={false} />))
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS * 5)
    result.refresh()
  })
  expect(build).toHaveBeenCalledTimes(1)
  act(() => renderer.update(<Probe />))
  expect(build).toHaveBeenCalledTimes(2)
})

it('retains the last successful timestamp on error and recovers on retry', () => {
  act(() => {
    renderer = create(<Probe />)
  })
  const snapshot = result.sky
  build.mockImplementationOnce(() => {
    throw new Error('calculation failed')
  })
  act(() => {
    jest.advanceTimersByTime(SKY_REFRESH_MS)
  })
  expect(result.error).toBe(true)
  expect(result.sky).toBe(snapshot)
  act(() => result.refresh())
  expect(result.error).toBe(false)
  expect(result.sky).not.toBe(snapshot)
})
