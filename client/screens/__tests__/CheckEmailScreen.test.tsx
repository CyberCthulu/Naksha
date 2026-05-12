import React from 'react'
import { Alert, Text, TextInput, TouchableOpacity } from 'react-native'
import TestRenderer from 'react-test-renderer'

import CheckEmailScreen from '../CheckEmailScreen'
import supabase from '../../lib/supabase'
import { resendSignupEmail, verifySignupOtp } from '../../lib/auth'
import type { UserProfileFields } from '../../lib/domainTypes'

const mockNavigation = {
  setOptions: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
}
let mockRouteParams: Record<string, unknown> = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockRouteParams }),
}))

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('../../lib/auth', () => ({
  __esModule: true,
  resendSignupEmail: jest.fn(),
  verifySignupOtp: jest.fn(),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const completeProfile: UserProfileFields = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1815-12-10',
  birth_time: '12:00:00',
  birth_location: 'London, UK',
  time_zone: 'Europe/London',
  birth_lat: 51.5072,
  birth_lon: -0.1276,
}

const PROFILE_SELECT =
  'first_name,last_name,birth_date,birth_time,birth_location,time_zone'

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen(params: Record<string, unknown> = {}) {
  mockRouteParams = params

  await act(async () => {
    renderer = create(<CheckEmailScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('CheckEmailScreen did not render')
  return renderer
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getSession: jest.Mock
      getUser: jest.Mock
    }
    from: jest.Mock
  }
}

function mockedVerifySignupOtp() {
  return verifySignupOtp as jest.MockedFunction<typeof verifySignupOtp>
}

function mockedResendSignupEmail() {
  return resendSignupEmail as jest.MockedFunction<typeof resendSignupEmail>
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function findButtonByText(root: TestRenderer.ReactTestRenderer, label: string) {
  const button = root.root.findAllByType(TouchableOpacity).find((node) =>
    node.findAllByType(Text).some((textNode) =>
      textValue(textNode.props.children).includes(label)
    )
  )

  if (!button) throw new Error(`Could not find button: ${label}`)
  return button
}

function enterCode(root: TestRenderer.ReactTestRenderer, code: string) {
  const input = root.root.findByType(TextInput)

  act(() => {
    input.props.onChangeText(code)
  })
}

async function pressButton(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const button = findButtonByText(root, label)

  await act(async () => {
    await button.props.onPress()
    await settleAsyncWork()
  })
}

function mockSessionAndUser() {
  mockedSupabase().auth.getSession.mockResolvedValue({
    data: {
      session: {
        user: { id: 'user-1' },
      },
    },
    error: null,
  })
  mockedSupabase().auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'ada@example.com',
      },
    },
    error: null,
  })
}

function mockUsersUpsert(data: unknown, error: unknown = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error })
  const select = jest.fn(() => ({ maybeSingle }))
  const upsert = jest.fn(() => ({ select }))
  mockedSupabase().from.mockReturnValue({ upsert })

  return { upsert, select, maybeSingle }
}

describe('CheckEmailScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())

    renderer = null
    mockRouteParams = {}

    mockedVerifySignupOtp().mockResolvedValue({ data: null, error: null } as any)
    mockedResendSignupEmail().mockResolvedValue({ data: null, error: null } as any)
    mockSessionAndUser()
    mockUsersUpsert(completeProfile)
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('shows missing email validation before verifying', async () => {
    const screen = await renderScreen({})

    await pressButton(screen, 'Verify Code')

    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing email',
      'We could not find the email for this signup flow.'
    )
    expect(mockedVerifySignupOtp()).not.toHaveBeenCalled()
  })

  it('shows missing code validation before verifying', async () => {
    const screen = await renderScreen({ email: 'ada@example.com' })

    await pressButton(screen, 'Verify Code')

    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing code',
      'Enter the confirmation code from your email.'
    )
    expect(mockedVerifySignupOtp()).not.toHaveBeenCalled()
  })

  it('resends the confirmation email and updates the message', async () => {
    const screen = await renderScreen({ email: 'ada@example.com' })

    await pressButton(screen, 'Resend Email')

    expect(mockedResendSignupEmail()).toHaveBeenCalledWith('ada@example.com')
    expect(
      screen.root
        .findAllByType(Text)
        .some(
          (node) =>
            textValue(node.props.children) ===
            'Confirmation code resent. Please check your inbox again.'
        )
    ).toBe(true)
  })

  it('shows resend errors', async () => {
    mockedResendSignupEmail().mockResolvedValueOnce({
      data: null,
      error: { message: 'rate limited' },
    } as any)
    const screen = await renderScreen({ email: 'ada@example.com' })

    await pressButton(screen, 'Resend Email')

    expect(Alert.alert).toHaveBeenCalledWith('Resend Failed', 'rate limited')
  })

  it('resets to Dashboard after OTP verification with a complete profile', async () => {
    const query = mockUsersUpsert(completeProfile)
    const screen = await renderScreen({
      email: 'ada@example.com',
      profile: completeProfile,
    })

    enterCode(screen, '123456')
    await pressButton(screen, 'Verify Code')

    expect(mockedVerifySignupOtp()).toHaveBeenCalledWith(
      'ada@example.com',
      '123456'
    )
    expect(mockedSupabase().auth.getSession).toHaveBeenCalled()
    expect(mockedSupabase().auth.getUser).toHaveBeenCalled()
    expect(mockedSupabase().from).toHaveBeenCalledWith('users')
    expect(query.upsert).toHaveBeenCalledWith(
      {
        id: 'user-1',
        email: 'ada@example.com',
        first_name: completeProfile.first_name,
        last_name: completeProfile.last_name,
        birth_date: completeProfile.birth_date,
        birth_time: completeProfile.birth_time,
        birth_location: completeProfile.birth_location,
        time_zone: completeProfile.time_zone,
        birth_lat: completeProfile.birth_lat,
        birth_lon: completeProfile.birth_lon,
      },
      { onConflict: 'id' }
    )
    expect(query.select).toHaveBeenCalledWith(PROFILE_SELECT)
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('resets to CompleteProfile after OTP verification with an incomplete profile', async () => {
    mockUsersUpsert({
      ...completeProfile,
      birth_location: null,
    })
    const screen = await renderScreen({
      email: 'ada@example.com',
      profile: completeProfile,
    })

    enterCode(screen, '123456')
    await pressButton(screen, 'Verify Code')

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'CompleteProfile' }],
    })
  })
})
