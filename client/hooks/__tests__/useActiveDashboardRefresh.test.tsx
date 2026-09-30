import React from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { useActiveDashboardRefresh } from '../useActiveDashboardRefresh'

const { act, create } = TestRenderer
const originalState = AppState.currentState

let change: (state: AppStateStatus) => void
let remove: jest.Mock
let renderer: ReturnType<typeof create> | null = null

function Probe({
  enabled = true,
  timeZone = 'America/Los_Angeles',
  lastSuccessfulEvaluationAt = Date.now(),
  onRefresh,
}: {
  enabled?: boolean
  timeZone?: string
  lastSuccessfulEvaluationAt?: number | null
  onRefresh: (evaluatedAt: Date) => void
}) {
  useActiveDashboardRefresh(
    enabled,
    timeZone,
    lastSuccessfulEvaluationAt,
    onRefresh
  )
  return null
}

beforeEach(() => {
  jest.useFakeTimers()
  AppState.currentState = 'active'
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
  renderer = null
  jest.restoreAllMocks()
  jest.useRealTimers()
  AppState.currentState = originalState
})

it('refreshes at the profile-zone midnight and weekly boundary', () => {
  jest.setSystemTime(new Date('2026-09-14T06:59:59.000Z'))
  const onRefresh = jest.fn()

  act(() => {
    renderer = create(<Probe onRefresh={onRefresh} />)
  })
  expect(onRefresh).toHaveBeenLastCalledWith(
    new Date('2026-09-14T06:59:59.000Z')
  )

  act(() => {
    jest.advanceTimersByTime(1_000)
  })
  expect(onRefresh).toHaveBeenLastCalledWith(
    new Date('2026-09-14T07:00:00.000Z')
  )
  expect(onRefresh).toHaveBeenCalledTimes(2)
})

it('uses an hourly active-screen deadline before the next local day', () => {
  jest.setSystemTime(new Date('2026-09-12T12:00:00.000Z'))
  const onRefresh = jest.fn()

  act(() => {
    renderer = create(<Probe onRefresh={onRefresh} />)
  })
  act(() => {
    jest.advanceTimersByTime(60 * 60 * 1_000)
  })

  expect(onRefresh).toHaveBeenCalledTimes(2)
  expect(onRefresh).toHaveBeenLastCalledWith(
    new Date('2026-09-12T13:00:00.000Z')
  )
})

it('keeps the original hourly deadline after a mid-hour resume', () => {
  const evaluatedAt = new Date('2026-09-12T12:00:00.000Z')
  jest.setSystemTime(evaluatedAt)
  const onRefresh = jest.fn()

  act(() => {
    renderer = create(
      <Probe
        lastSuccessfulEvaluationAt={evaluatedAt.getTime()}
        onRefresh={onRefresh}
      />
    )
  })
  act(() => {
    jest.advanceTimersByTime(10 * 60 * 1_000)
    change('background')
    jest.advanceTimersByTime(49 * 60 * 1_000)
  })
  expect(onRefresh).toHaveBeenCalledTimes(1)

  act(() => change('active'))
  act(() => change('active'))
  expect(onRefresh).toHaveBeenLastCalledWith(
    new Date('2026-09-12T12:59:00.000Z')
  )
  expect(onRefresh).toHaveBeenCalledTimes(2)

  act(() => {
    jest.advanceTimersByTime(59_999)
  })
  expect(onRefresh).toHaveBeenCalledTimes(2)

  act(() => {
    jest.advanceTimersByTime(1)
  })
  expect(onRefresh).toHaveBeenLastCalledWith(
    new Date('2026-09-12T13:00:00.000Z')
  )
  expect(onRefresh).toHaveBeenCalledTimes(3)
})

it('reschedules immediately when the profile timezone changes and stops off-screen', () => {
  jest.setSystemTime(new Date('2026-09-14T18:29:59.000Z'))
  const onRefresh = jest.fn()

  act(() => {
    renderer = create(
      <Probe timeZone="Etc/UTC" onRefresh={onRefresh} />
    )
  })
  act(() => {
    renderer?.update(
      <Probe timeZone="Asia/Kolkata" onRefresh={onRefresh} />
    )
  })
  expect(onRefresh).toHaveBeenCalledTimes(2)

  act(() => {
    jest.advanceTimersByTime(1_000)
  })
  expect(onRefresh).toHaveBeenCalledTimes(3)

  act(() => {
    renderer?.update(
      <Probe enabled={false} timeZone="Asia/Kolkata" onRefresh={onRefresh} />
    )
  })
  act(() => {
    jest.advanceTimersByTime(24 * 60 * 60 * 1_000)
  })
  expect(onRefresh).toHaveBeenCalledTimes(3)
  expect(remove).toHaveBeenCalled()
})
