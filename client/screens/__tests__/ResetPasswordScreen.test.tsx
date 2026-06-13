import React from 'react'
import { Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ResetPasswordScreen from '../ResetPasswordScreen'
import supabase from '../../lib/supabase'

const mockNavigation = {
  reset: jest.fn(),
}

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn(),
    },
  },
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
    renderer = create(<ResetPasswordScreen navigation={mockNavigation} />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('ResetPasswordScreen did not render')
  return renderer
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getSession: jest.Mock
      updateUser: jest.Mock
    }
  }
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

function passwordInput(
  root: TestRenderer.ReactTestRenderer,
  placeholder: string
) {
  const input = root.root
    .findAllByType(TextInput)
    .find((node) => node.props.placeholder === placeholder)

  if (!input) throw new Error(`Could not find input: ${placeholder}`)
  return input
}

async function fillPasswords(
  root: TestRenderer.ReactTestRenderer,
  password: string,
  confirmation: string
) {
  await act(async () => {
    passwordInput(root, 'New password').props.onChangeText(password)
    passwordInput(root, 'Confirm password').props.onChangeText(confirmation)
    await settleAsyncWork()
  })
}

async function press(root: TestRenderer.ReactTestRenderer, label: string) {
  const target = findPressableByText(root, label)

  await act(async () => {
    await target.props.onPress()
    await settleAsyncWork()
  })
}

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null

    mockedSupabase().auth.updateUser.mockResolvedValue({
      data: null,
      error: null,
    })
    mockedSupabase().auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1' },
        },
      },
      error: null,
    })
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

  it('validates missing password', async () => {
    const screen = await renderScreen()

    await press(screen, 'Update Password')

    expectText(screen, 'Enter a new password.')
    expect(mockedSupabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it('validates short password', async () => {
    const screen = await renderScreen()

    await fillPasswords(screen, '12345', '12345')
    await press(screen, 'Update Password')

    expectText(screen, 'Password must be at least 6 characters.')
    expect(mockedSupabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it('validates mismatched confirmation', async () => {
    const screen = await renderScreen()

    await fillPasswords(screen, '123456', 'abcdef')
    await press(screen, 'Update Password')

    expectText(screen, 'Passwords do not match.')
    expect(mockedSupabase().auth.updateUser).not.toHaveBeenCalled()
  })

  it('updates the password and routes to Dashboard when a session exists', async () => {
    const screen = await renderScreen()

    await fillPasswords(screen, '123456', '123456')
    await press(screen, 'Update Password')

    expect(mockedSupabase().auth.updateUser).toHaveBeenCalledWith({
      password: '123456',
    })
    expectText(screen, 'Your password has been updated.')
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('routes to Login after success when no session exists', async () => {
    mockedSupabase().auth.getSession.mockResolvedValueOnce({
      data: {
        session: null,
      },
      error: null,
    })
    const screen = await renderScreen()

    await fillPasswords(screen, '123456', '123456')
    await press(screen, 'Update Password')

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  })

  it('shows updateUser failures', async () => {
    mockedSupabase().auth.updateUser.mockResolvedValueOnce({
      data: null,
      error: { message: 'expired recovery session' },
    })
    const screen = await renderScreen()

    await fillPasswords(screen, '123456', '123456')
    await press(screen, 'Update Password')

    expectText(screen, 'expired recovery session')
    expect(mockNavigation.reset).not.toHaveBeenCalled()
  })
})
