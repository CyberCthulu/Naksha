import React from 'react'
import { Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import LocationAutocompleteField from '../LocationAutocompleteField'
import { geocodePlace, type GeocodeResult } from '../../../lib/geocode'

jest.mock('../../../lib/geocode', () => ({
  geocodePlace: jest.fn(),
}))

const { act, create } = TestRenderer
let screen: ReturnType<typeof create> | null = null

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function textContent(root: TestRenderer.ReactTestRenderer) {
  return root.root
    .findAllByType(Text)
    .map((node) => String(node.props.children))
    .join(' ')
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

describe('LocationAutocompleteField request lifecycle', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (screen) {
      act(() => screen?.unmount())
    }
    screen = null
    jest.useRealTimers()
  })

  async function renderField() {
    await act(async () => {
      screen = create(
        <LocationAutocompleteField value="" onChange={jest.fn()} />
      )
      await flush()
    })
    if (!screen) throw new Error('field did not render')
    return screen
  }

  async function typeAndStart(value: string) {
    if (!screen) throw new Error('field did not render')
    await act(async () => {
      screen!.root.findByType(TextInput).props.onChangeText(value)
      await flush()
    })
    await act(async () => {
      jest.advanceTimersByTime(400)
      await flush()
    })
  }

  it('aborts superseded searches and ignores a stale late response', async () => {
    const first = deferred<GeocodeResult[]>()
    const second = deferred<GeocodeResult[]>()
    ;(geocodePlace as jest.MockedFunction<typeof geocodePlace>)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const root = await renderField()
    await typeAndStart('Old place')
    const firstSignal = (geocodePlace as jest.Mock).mock.calls[0][1].signal

    await act(async () => {
      root.root.findByType(TextInput).props.onChangeText('New place')
      await flush()
    })
    expect(firstSignal.aborted).toBe(true)

    await act(async () => {
      jest.advanceTimersByTime(400)
      await flush()
    })
    second.resolve([
      { name: 'New result', lat: 10, lon: 20, timeZone: 'Etc/UTC' },
    ])
    await act(flush)

    first.resolve([
      { name: 'Old stale result', lat: 30, lon: 40, timeZone: 'Etc/UTC' },
    ])
    await act(flush)

    expect(textContent(root)).toContain('New result')
    expect(textContent(root)).not.toContain('Old stale result')
  })

  it('aborts an in-flight request when unmounted', async () => {
    const pending = deferred<GeocodeResult[]>()
    ;(geocodePlace as jest.MockedFunction<typeof geocodePlace>).mockReturnValue(
      pending.promise
    )

    await renderField()
    await typeAndStart('Unmounted place')
    const signal = (geocodePlace as jest.Mock).mock.calls[0][1].signal

    act(() => screen?.unmount())
    screen = null

    expect(signal.aborted).toBe(true)
  })

  it('shows a retryable message for a genuine request failure', async () => {
    ;(geocodePlace as jest.MockedFunction<typeof geocodePlace>).mockRejectedValue(
      new Error('network down')
    )

    const root = await renderField()
    await typeAndStart('Offline place')
    await act(flush)

    expect(textContent(root)).toContain(
      'Could not load location suggestions. Please try again.'
    )
  })
})
