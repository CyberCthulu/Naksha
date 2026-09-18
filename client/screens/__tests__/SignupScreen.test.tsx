import React from 'react'
import { TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import SignupScreen from '../SignupScreen'
import { Button } from '../../components/ui/Button'
import { signUpWithEmail } from '../../lib/auth'

const mockNavigation = {
  replace: jest.fn(),
}

let mockProfileInput = {
  date: { year: 1997, month: 9, day: 15 },
  time: { hour: 13, minute: 55 },
  offset: null as number | null,
  zone: 'America/Los_Angeles',
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('../../components/auth/ProfileFields', () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')

    return React.createElement(
      Pressable,
      {
        accessibilityLabel: 'Fill Birth Profile',
        onPress: () => {
          props.setFirstName('Ada')
          props.setLastName('Lovelace')
          props.setBirthDate(mockProfileInput.date)
          props.setBirthTime(mockProfileInput.time)
          props.setBirthLocation('Los Angeles, CA')
          props.setTimeZone(mockProfileInput.zone)
          props.setBirthLat(34.0522)
          props.setBirthLon(-118.2437)
          props.setBirthUtcOffsetMinutes(mockProfileInput.offset)
        },
      },
      React.createElement(Text, null, 'Fill Birth Profile')
    )
  },
}))

jest.mock('../../lib/auth', () => ({
  signUpWithEmail: jest.fn(),
}))

const { act, create } = TestRenderer

let renderer: TestRenderer.ReactTestRenderer | null = null

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<SignupScreen />)
    await settleAsyncWork()
  })
  return renderer!
}

function inputByPlaceholder(root: TestRenderer.ReactTestRenderer, value: string) {
  return root.root
    .findAllByType(TextInput)
    .find((node) => node.props.placeholder === value)!
}

async function completeAndSubmit(screen: TestRenderer.ReactTestRenderer) {
  await act(async () => {
    inputByPlaceholder(screen, 'you@example.com').props.onChangeText(
      'ada@example.com'
    )
    inputByPlaceholder(screen, '••••••••').props.onChangeText('secret-password')
    screen.root.findAll(
      (node) =>
        node.props.accessibilityLabel === 'Fill Birth Profile' &&
        typeof node.props.onPress === 'function'
    )[0].props.onPress()
    await settleAsyncWork()
  })

  const signup = screen.root
    .findAllByType(Button)
    .find((node) => node.props.title === 'Sign Up')!
  await act(async () => {
    await signup.props.onPress()
    await settleAsyncWork()
  })
}

describe('SignupScreen civil birth contract', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockProfileInput = {
      date: { year: 1997, month: 9, day: 15 },
      time: { hour: 13, minute: 55 },
      offset: null,
      zone: 'America/Los_Angeles',
    }
    ;(signUpWithEmail as jest.Mock).mockResolvedValue({ error: null })
  })

  afterEach(() => {
    if (renderer) act(() => renderer?.unmount())
  })

  it('submits civil date and time without UTC date serialization', async () => {
    const screen = await renderScreen()
    await completeAndSubmit(screen)

    expect(signUpWithEmail).toHaveBeenCalledWith(
      'ada@example.com',
      'secret-password',
      expect.objectContaining({
        birth_date: '1997-09-15',
        birth_time: '13:55:00',
        birth_utc_offset_minutes: undefined,
        time_zone: 'America/Los_Angeles',
      })
    )
  })

  it('persists an explicitly selected fold occurrence through signup metadata', async () => {
    mockProfileInput = {
      date: { year: 2025, month: 11, day: 2 },
      time: { hour: 1, minute: 30 },
      offset: -480,
      zone: 'America/Los_Angeles',
    }
    const screen = await renderScreen()
    await completeAndSubmit(screen)

    expect(signUpWithEmail).toHaveBeenCalledWith(
      'ada@example.com',
      'secret-password',
      expect.objectContaining({
        birth_date: '2025-11-02',
        birth_time: '01:30:00',
        birth_utc_offset_minutes: -480,
      })
    )
    expect(mockNavigation.replace).toHaveBeenCalledWith(
      'CheckEmail',
      expect.objectContaining({
        profile: expect.objectContaining({
          birth_utc_offset_minutes: -480,
        }),
      })
    )
  })
})
