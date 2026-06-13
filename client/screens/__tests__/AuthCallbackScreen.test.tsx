import React from 'react'
import { Alert } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import TestRenderer from 'react-test-renderer'

import AuthCallbackScreen from '../AuthCallbackScreen'
import supabase from '../../lib/supabase'

jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  parse: jest.fn(),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      getSession: jest.fn(),
      setSession: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null
let capturedUrlHandler: ((event: { url: string }) => void) | null = null

const mockNavigation = {
  reset: jest.fn(),
}

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<AuthCallbackScreen navigation={mockNavigation} />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('AuthCallbackScreen did not render')
  return renderer
}

function mockedLinking() {
  return ExpoLinking as unknown as {
    addEventListener: jest.Mock
    getInitialURL: jest.Mock
    parse: jest.Mock
  }
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      exchangeCodeForSession: jest.Mock
      getSession: jest.Mock
      setSession: jest.Mock
      verifyOtp: jest.Mock
    }
  }
}

function mockSession(user: unknown = { id: 'user-1' }) {
  mockedSupabase().auth.getSession.mockResolvedValue({
    data: {
      session: user ? { user } : null,
    },
    error: null,
  })
}

function mockParsedUrl(
  url: string,
  parsed: {
    queryParams?: Record<string, string>
    fragment?: string
  }
) {
  mockedLinking().parse.mockImplementation((incomingUrl: string) => {
    if (incomingUrl !== url) {
      return { queryParams: {} }
    }

    return parsed
  })
}

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    jest.spyOn(console, 'warn').mockImplementation(jest.fn())

    renderer = null
    capturedUrlHandler = null

    mockedLinking().addEventListener.mockImplementation(
      (_eventName: string, handler: (event: { url: string }) => void) => {
        capturedUrlHandler = handler
        return { remove: jest.fn() }
      }
    )
    mockedLinking().getInitialURL.mockResolvedValue(null)
    mockedLinking().parse.mockReturnValue({ queryParams: {} })

    mockedSupabase().auth.exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: null,
    })
    mockedSupabase().auth.setSession.mockResolvedValue({
      data: null,
      error: null,
    })
    mockedSupabase().auth.verifyOtp.mockResolvedValue({
      data: null,
      error: null,
    })
    mockSession()
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
    capturedUrlHandler = null
    jest.restoreAllMocks()
  })

  it('uses verifyOtp for token_hash/type callback URLs', async () => {
    const url = 'naksha://auth/callback?token_hash=hash-1&type=email'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {
        token_hash: 'hash-1',
        type: 'email',
      },
    })

    await renderScreen()

    expect(mockedSupabase().auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'hash-1',
      type: 'email',
    })
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('routes recovery token callbacks to ResetPassword', async () => {
    const url = 'naksha://auth/callback?token_hash=hash-1&type=recovery'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {
        token_hash: 'hash-1',
        type: 'recovery',
      },
    })

    await renderScreen()

    expect(mockedSupabase().auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'hash-1',
      type: 'recovery',
    })
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'ResetPassword' }],
    })
  })

  it('uses exchangeCodeForSession for code callback URLs', async () => {
    const url = 'naksha://auth/callback?code=auth-code-1'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {
        code: 'auth-code-1',
      },
    })

    await renderScreen()

    expect(mockedSupabase().auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'auth-code-1'
    )
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('uses setSession for access_token/refresh_token fragments', async () => {
    const url = 'naksha://auth/callback#access_token=access-1&refresh_token=refresh-1'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {},
      fragment: 'access_token=access-1&refresh_token=refresh-1',
    })

    await renderScreen()

    expect(mockedSupabase().auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
    })
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('routes recovery fragment callbacks to ResetPassword', async () => {
    const url =
      'naksha://auth/callback#access_token=access-1&refresh_token=refresh-1&type=recovery'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {},
      fragment: 'access_token=access-1&refresh_token=refresh-1&type=recovery',
    })

    await renderScreen()

    expect(mockedSupabase().auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
    })
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'ResetPassword' }],
    })
  })

  it('processes a delayed URL event after a null initial URL', async () => {
    const url = 'naksha://auth/callback?token_hash=late-hash&type=email'
    mockedLinking().getInitialURL.mockResolvedValue(null)
    mockParsedUrl(url, {
      queryParams: {
        token_hash: 'late-hash',
        type: 'email',
      },
    })

    await renderScreen()

    expect(mockedSupabase().auth.verifyOtp).not.toHaveBeenCalled()
    expect(capturedUrlHandler).toBeTruthy()

    mockNavigation.reset.mockClear()
    mockedSupabase().auth.getSession.mockClear()

    await act(async () => {
      capturedUrlHandler?.({ url })
      await settleAsyncWork()
    })

    expect(mockedSupabase().auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'late-hash',
      type: 'email',
    })
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })

  it('shows auth errors and still finishes routing', async () => {
    const url = 'naksha://auth/callback?token_hash=bad-hash&type=email'
    mockedLinking().getInitialURL.mockResolvedValue(url)
    mockParsedUrl(url, {
      queryParams: {
        token_hash: 'bad-hash',
        type: 'email',
      },
    })
    mockedSupabase().auth.verifyOtp.mockResolvedValueOnce({
      data: null,
      error: { message: 'expired token' },
    })

    await renderScreen()

    expect(Alert.alert).toHaveBeenCalledWith(
      'Verification failed',
      'We could not verify this sign-in link. Please try again or request a new email.'
    )
    expect(console.warn).toHaveBeenCalledWith(
      'Auth callback failed:',
      'expired token'
    )
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    })
  })
})
