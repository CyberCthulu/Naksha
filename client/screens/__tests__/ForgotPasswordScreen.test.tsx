import React from 'react'
import { Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ForgotPasswordScreen from '../ForgotPasswordScreen'
import { requestPasswordResetEmail } from '../../lib/auth'

const mockNavigation = {
  replace: jest.fn(),
}

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('../../lib/auth', () => ({
  __esModule: true,
  requestPasswordResetEmail: jest.fn(),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<ForgotPasswordScreen navigation={mockNavigation} />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('ForgotPasswordScreen did not render')
  return renderer
}

function mockedRequestPasswordResetEmail() {
  return requestPasswordResetEmail as jest.MockedFunction<
    typeof requestPasswordResetEmail
  >
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function expectText(root: TestRenderer.ReactTestRenderer, label: string) {
  expect(
    root.root
      .findAllByType(Text)
      .some((node) => textValue(node.props.children).includes(label))
  ).toBe(true)
}

function findPressableByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      node.findAllByType(Text).some((textNode) =>
        textValue(textNode.props.children).includes(label)
      )
  )[0]

  if (!pressable) throw new Error(`Could not find pressable: ${label}`)
  return pressable
}

function emailInput(root: TestRenderer.ReactTestRenderer) {
  const input = root.root
    .findAllByType(TextInput)
    .find((node) => node.props.placeholder === 'you@example.com')

  if (!input) throw new Error('Could not find email input')
  return input
}

async function press(root: TestRenderer.ReactTestRenderer, label: string) {
  const target = findPressableByText(root, label)

  await act(async () => {
    await target.props.onPress()
    await settleAsyncWork()
  })
}

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    mockedRequestPasswordResetEmail().mockResolvedValue({
      data: null,
      error: null,
    } as any)
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
  })

  it('validates missing email before requesting reset', async () => {
    const screen = await renderScreen()

    await press(screen, 'Send Reset Email')

    expectText(screen, 'Email is required.')
    expect(mockedRequestPasswordResetEmail()).not.toHaveBeenCalled()
  })

  it('shows neutral success copy after a successful reset request', async () => {
    const screen = await renderScreen()

    await act(async () => {
      emailInput(screen).props.onChangeText(' ada@example.com ')
      await settleAsyncWork()
    })
    await press(screen, 'Send Reset Email')

    expect(mockedRequestPasswordResetEmail()).toHaveBeenCalledWith(
      'ada@example.com'
    )
    expectText(
      screen,
      'If an account exists for that email, we sent password reset instructions.'
    )
  })

  it('shows request failures', async () => {
    mockedRequestPasswordResetEmail().mockResolvedValueOnce({
      data: null,
      error: { message: 'rate limited' },
    } as any)
    const screen = await renderScreen()

    await act(async () => {
      emailInput(screen).props.onChangeText('ada@example.com')
      await settleAsyncWork()
    })
    await press(screen, 'Send Reset Email')

    expectText(screen, 'rate limited')
  })

  it('navigates back to Login', async () => {
    const screen = await renderScreen()

    await press(screen, 'Back to Login')

    expect(mockNavigation.replace).toHaveBeenCalledWith('Login')
  })
})
