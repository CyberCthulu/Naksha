import React from 'react'
import { Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import LoginScreen from '../LoginScreen'
import { Button } from '../../components/ui/Button'
import { signInWithEmail } from '../../lib/auth'

const mockNavigation = { navigate: jest.fn() }

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../lib/auth', () => ({
  signInWithEmail: jest.fn(),
}))

const { act, create } = TestRenderer
let renderer: ReturnType<typeof create> | null = null

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

function mockedSignIn() {
  return signInWithEmail as jest.MockedFunction<typeof signInWithEmail>
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  return value == null ? '' : String(value)
}

function expectText(screen: TestRenderer.ReactTestRenderer, value: string) {
  expect(
    screen.root
      .findAllByType(Text)
      .some((node) => textValue(node.props.children).includes(value))
  ).toBe(true)
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<LoginScreen navigation={mockNavigation} />)
    await settleAsyncWork()
  })
  return renderer!
}

async function submit(screen: TestRenderer.ReactTestRenderer) {
  const inputs = screen.root.findAllByType(TextInput)
  await act(async () => {
    inputs.find((node) => node.props.placeholder === 'you@example.com')!.props.onChangeText(
      'ada@example.com'
    )
    inputs.find((node) => node.props.placeholder === '••••••••')!.props.onChangeText(
      'secret-password'
    )
    await settleAsyncWork()
  })

  const button = screen.root
    .findAllByType(Button)
    .find((node) => node.props.title === 'Login')!
  await act(async () => {
    await button.props.onPress()
    await settleAsyncWork()
  })
}

describe('LoginScreen exceptional paths', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockedSignIn().mockResolvedValue({ data: null, error: null } as any)
  })

  afterEach(() => {
    if (renderer) act(() => renderer?.unmount())
  })

  it('recovers from an unexpected rejected login and permits retry', async () => {
    mockedSignIn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ data: null, error: null } as any)
    const screen = await renderScreen()

    await submit(screen)

    expectText(screen, 'Could not log in. Check your connection and try again.')
    expect(
      screen.root.findAllByType(Button).some((node) => node.props.title === 'Login')
    ).toBe(true)

    await submit(screen)
    expect(mockedSignIn()).toHaveBeenCalledTimes(2)
  })
})
