import React from 'react'
import { AccessibilityInfo, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import {
  ReducedMotionProvider,
  useReducedMotion,
} from '../useReducedMotion'

const { act, create } = TestRenderer

function Probe() {
  const reduceMotion = useReducedMotion()
  return <Text>{String(reduceMotion)}</Text>
}

function readProbe(renderer: ReturnType<typeof create>) {
  return renderer.root
    .findAll((node) => String(node.type) === 'Text')
    .map((node) => node.children.join(''))[0]
}

describe('useReducedMotion', () => {
  let removeListener: jest.Mock
  let addListener: jest.SpyInstance
  let listener: ((enabled: boolean) => void) | null

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    listener = null
    removeListener = jest.fn()

    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false)
    addListener = jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((_event, handler) => {
        listener = handler as unknown as (enabled: boolean) => void
        return { remove: removeListener } as never
      })

    // spyOn re-wraps a already-spied property across tests in this file, so
    // start every case from a known-zero call count.
    addListener.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('starts unresolved, then reports the platform setting', async () => {
    let renderer: ReturnType<typeof create> | null = null

    act(() => {
      renderer = create(<Probe />)
    })
    expect(readProbe(renderer!)).toBe('null')

    await act(async () => {
      await Promise.resolve()
    })
    expect(readProbe(renderer!)).toBe('false')

    act(() => renderer!.unmount())
  })

  it('reacts to a later preference change', async () => {
    let renderer: ReturnType<typeof create> | null = null

    await act(async () => {
      renderer = create(<Probe />)
      await Promise.resolve()
    })
    expect(readProbe(renderer!)).toBe('false')

    await act(async () => {
      listener?.(true)
    })
    expect(readProbe(renderer!)).toBe('true')

    act(() => renderer!.unmount())
  })

  it('removes its listener on unmount', async () => {
    let renderer: ReturnType<typeof create> | null = null

    await act(async () => {
      renderer = create(<Probe />)
      await Promise.resolve()
    })

    expect(removeListener).not.toHaveBeenCalled()
    act(() => renderer!.unmount())
    expect(removeListener).toHaveBeenCalledTimes(1)
  })

  it('does not update state after unmount', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    let renderer: ReturnType<typeof create> | null = null

    act(() => {
      renderer = create(<Probe />)
    })
    act(() => renderer!.unmount())

    await act(async () => {
      listener?.(true)
      await Promise.resolve()
    })

    expect(warn).not.toHaveBeenCalled()
  })

  it('opens only one listener for the whole tree when a provider is used', async () => {
    let renderer: ReturnType<typeof create> | null = null

    await act(async () => {
      renderer = create(
        <ReducedMotionProvider>
          <Probe />
          <Probe />
          <Probe />
        </ReducedMotionProvider>
      )
      await Promise.resolve()
    })

    expect(addListener).toHaveBeenCalledTimes(1)

    const values = renderer!.root
      .findAll((node) => String(node.type) === 'Text')
      .map((node) => node.children.join(''))
    expect(values).toEqual(['false', 'false', 'false'])

    act(() => renderer!.unmount())
    expect(removeListener).toHaveBeenCalledTimes(1)
  })
})
