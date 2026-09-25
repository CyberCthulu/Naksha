import React from 'react'
import TestRenderer from 'react-test-renderer'

import App, { createAppLinkingOptions } from '../App'
import supabase from '../lib/supabase'
import * as ExpoLinking from 'expo-linking'

const mockDashboardMount = jest.fn()

jest.mock('../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

jest.mock('../components/ui/useAppFonts', () => ({
  useAppFonts: jest.fn(),
}))

jest.mock('../components/ui/Background', () => ({
  Background: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../components/ui/useReducedMotion', () => ({
  ReducedMotionProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

jest.mock('../components/space/SpaceProvider', () => ({
  SpaceProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../components/ui/LoadingState', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    LoadingState: ({ label }: { label: string }) =>
      React.createElement(Text, null, label),
  }
})

jest.mock('../components/ui/ErrorState', () => {
  const React = require('react')
  const { Pressable, Text, View } = require('react-native')
  return {
    ErrorState: ({ title, description, action }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description),
        action
          ? React.createElement(
              Pressable,
              { accessibilityLabel: action.label, onPress: action.onPress },
              React.createElement(Text, null, action.label)
            )
          : null
      ),
  }
})

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
    children,
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@react-navigation/native', () => ({
  DefaultTheme: { colors: {} },
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
  useIsFocused: () => true,
}))

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, null, children),
      Screen: ({ component: Component }: { component: React.ComponentType<any> }) =>
        React.createElement(Component, { navigation: {} }),
    }),
  }
})

jest.mock('expo-linking', () => ({
  createURL: () => 'exp://127.0.0.1:8081/--/',
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}))

jest.mock('../screens/LoginScreen', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, 'Signed out'),
  }
})

jest.mock('../screens/DashboardScreen', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  return {
    __esModule: true,
    default: function MockDashboard() {
      const { postAuthRoute } = require('../lib/authSession').useAuthSession()
      const [privateDraft, setPrivateDraft] = React.useState('empty')

      React.useEffect(() => {
        mockDashboardMount()
      }, [])

      return React.createElement(
        Pressable,
        {
          accessibilityLabel: 'Set private marker',
          onPress: () => setPrivateDraft('private marker'),
        },
        React.createElement(Text, null, privateDraft),
        React.createElement(Text, null, postAuthRoute ?? 'no pending route')
      )
    },
  }
})

jest.mock('../screens/SignupScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CheckEmailScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/ForgotPasswordScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/ResetPasswordScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/AuthCallbackScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CompleteProfileScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CreateGuestChartScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/ChartScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/MyCharts', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/JournalEditorScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/JournalListScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/ProfileScreen', () => ({ __esModule: true, default: () => null }))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null
let authListener:
  | ((event: string, session: { user: { id: string } } | null) => void)
  | null = null
const unsubscribe = jest.fn()

function mockedAuth() {
  return supabase.auth as unknown as {
    getSession: jest.Mock
    onAuthStateChange: jest.Mock
  }
}

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
}

function renderedText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(renderedText).join(' ')
  if (value && typeof value === 'object' && 'children' in value) {
    return renderedText((value as { children?: unknown }).children)
  }
  return ''
}

function textContent() {
  return renderedText(renderer!.toJSON())
}

async function renderApp() {
  await act(async () => {
    renderer = create(<App />)
    await settleAsyncWork()
  })
}

describe('App auth bootstrap and identity boundary', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    renderer = null
    authListener = null
    mockedAuth().getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockedAuth().onAuthStateChange.mockImplementation(
      (listener: typeof authListener) => {
        authListener = listener
        return { data: { subscription: { unsubscribe } } }
      }
    )
  })

  afterEach(() => {
    if (renderer) act(() => renderer?.unmount())
    jest.restoreAllMocks()
  })

  it('reads a cold-start URL once while preserving runtime URL events', async () => {
    const coldStartUrl = 'naksha://journal/list'
    const runtimeUrl = 'naksha://profile'
    const remove = jest.fn()
    let runtimeListener: ((event: { url: string }) => void) | null = null
    const linkingModule = ExpoLinking as unknown as {
      getInitialURL: jest.Mock
      addEventListener: jest.Mock
    }
    linkingModule.getInitialURL.mockResolvedValueOnce(coldStartUrl)
    linkingModule.addEventListener.mockImplementationOnce(
      (_event: string, listener: (event: { url: string }) => void) => {
        runtimeListener = listener
        return { remove }
      }
    )
    const linking = createAppLinkingOptions()

    await expect(linking.getInitialURL?.()).resolves.toBe(coldStartUrl)
    await expect(linking.getInitialURL?.()).resolves.toBeNull()
    expect(linkingModule.getInitialURL).toHaveBeenCalledTimes(1)

    const onRuntimeUrl = jest.fn()
    const unsubscribe = linking.subscribe?.(onRuntimeUrl)
    expect(runtimeListener).not.toBeNull()
    ;(runtimeListener as unknown as (event: { url: string }) => void)({
      url: runtimeUrl,
    })

    expect(onRuntimeUrl).toHaveBeenCalledWith(runtimeUrl)
    unsubscribe?.()
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('turns a rejected session bootstrap into a retryable signed-out state', async () => {
    mockedAuth().getSession
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ data: { session: null }, error: null })

    await renderApp()

    expect(textContent()).toContain('Could not restore your session')
    expect(textContent()).not.toContain('private marker')

    const retry = renderer!.root.find(
      (node) => node.props.accessibilityLabel === 'Retry'
    )
    await act(async () => {
      retry.props.onPress()
      await settleAsyncWork()
    })

    expect(textContent()).toContain('Signed out')
    expect(mockedAuth().getSession).toHaveBeenCalledTimes(2)
  })

  it('does not let a stale bootstrap result overwrite a newer auth event', async () => {
    let resolveBootstrap!: (value: unknown) => void
    mockedAuth().getSession.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBootstrap = resolve
      })
    )

    await act(async () => {
      renderer = create(<App />)
      await Promise.resolve()
    })

    await act(async () => {
      authListener?.('SIGNED_IN', { user: { id: 'user-b' } })
      resolveBootstrap({ data: { session: null }, error: null })
      await settleAsyncWork()
    })

    expect(textContent()).toContain('empty')
    expect(textContent()).not.toContain('Signed out')
  })

  it('remounts private screen state when the authenticated identity changes', async () => {
    mockedAuth().getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'user-a' } } },
      error: null,
    })
    await renderApp()

    const marker = renderer!.root.find(
      (node) => node.props.accessibilityLabel === 'Set private marker'
    )
    act(() => marker.props.onPress())
    expect(textContent()).toContain('private marker')

    await act(async () => {
      authListener?.('SIGNED_IN', { user: { id: 'user-b' } })
      await settleAsyncWork()
    })

    expect(textContent()).toContain('empty')
    expect(textContent()).not.toContain('private marker')
    expect(mockDashboardMount).toHaveBeenCalledTimes(2)
  })

  it('uses the PASSWORD_RECOVERY event as the authoritative reset destination', async () => {
    mockedAuth().getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'user-a' } } },
      error: null,
    })
    await renderApp()

    await act(async () => {
      authListener?.('PASSWORD_RECOVERY', { user: { id: 'user-a' } })
      await settleAsyncWork()
    })

    expect(textContent()).toContain('ResetPassword')
  })

  it('moves from authenticated to signed out when the listener clears session', async () => {
    mockedAuth().getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'user-a' } } },
      error: null,
    })
    await renderApp()

    await act(async () => {
      authListener?.('SIGNED_OUT', null)
      await settleAsyncWork()
    })

    expect(textContent()).toContain('Signed out')
  })

  it('unsubscribes exactly once on unmount', async () => {
    await renderApp()

    act(() => renderer?.unmount())
    renderer = null

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
