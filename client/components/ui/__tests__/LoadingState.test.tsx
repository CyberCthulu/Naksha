import React from 'react'
import { Text, View } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { CelestialLoader } from '../CelestialLoader'
import { LoadingState } from '../LoadingState'

jest.mock('../useCelestialLoadingMotion', () => ({
  useCelestialLoadingMotion: () => {
    const { Animated } = jest.requireActual('react-native')
    return new Animated.Value(0)
  },
}))

const { act, create } = TestRenderer
let renderer: ReturnType<typeof create> | null = null

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  if (renderer) act(() => renderer!.unmount())
  renderer = null
})

it('announces a named busy state while keeping its emblem decorative', () => {
  act(() => {
    renderer = create(<LoadingState label="Loading your chart" />)
  })

  const status = renderer!.root.findAllByType(View).find(
    (node) => node.props.accessibilityRole === 'progressbar'
  )!
  expect(status.props.accessibilityLabel).toBe('Loading your chart')
  expect(status.props.accessibilityState).toEqual({ busy: true })
  expect(status.props.accessibilityLiveRegion).toBe('polite')
  expect(renderer!.root.findByType(CelestialLoader)).toBeDefined()
})

it('lets long loading labels wrap at larger font sizes', () => {
  const label = 'Loading the details of your saved birth chart'
  act(() => {
    renderer = create(<LoadingState label={label} />)
  })

  const text = renderer!.root.findByType(Text)
  expect(text.props.children.join('')).toBe(`${label}…`)
  expect(text.props.numberOfLines).toBeUndefined()
})

it.each([
  ['small', 56],
  ['large', 112],
  [72, 72],
] as const)('supports the existing size option %s', (size, expected) => {
  act(() => {
    renderer = create(<LoadingState label="Loading charts" size={size} />)
  })

  expect(renderer!.root.findByType(CelestialLoader).props.size).toBe(expected)
})
