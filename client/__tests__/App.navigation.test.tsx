import React from 'react'
import TestRenderer from 'react-test-renderer'

import App from '../App'
import supabase from '../lib/supabase'

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
  useReducedMotion: () => false,
}))

jest.mock('../components/space/SpaceProvider', () => ({
  SpaceProvider: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
    children,
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Keep the real NavigationContainer and StackRouter state ownership. The
// native-stack view itself is replaced because react-test-renderer cannot mount
// Android's native ScreenStack host view.
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react')
  const { View } = require('react-native')
  const {
    createNavigatorFactory,
    StackRouter,
    useNavigationBuilder,
  } = require('@react-navigation/native')

  function TestStackNavigator({
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  }: any) {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      StackRouter,
      {
        id,
        initialRouteName,
        children,
        screenListeners,
        screenOptions,
      }
    )
    const route = state.routes[state.index]

    return React.createElement(
      NavigationContent,
      null,
      React.createElement(View, null, descriptors[route.key].render())
    )
  }

  return {
    createNativeStackNavigator: createNavigatorFactory(TestStackNavigator),
  }
})

jest.mock('expo-linking', () => ({
  createURL: () => 'exp://127.0.0.1:8081/--/',
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}))

jest.mock('../screens/DashboardScreen', () => {
  const React = require('react')
  const { Pressable, Text, View } = require('react-native')
  const { useNavigation, useNavigationState } = require('@react-navigation/native')
  const { useAuthSession } = require('../lib/authSession')

  return {
    __esModule: true,
    default: function MockDashboard() {
      const navigation = useNavigation()
      const routes = useNavigationState((state: any) =>
        state.routes.map((route: any) => ({
          name: route.name,
          params: route.params,
        }))
      )
      const { user } = useAuthSession()

      return React.createElement(
        Pressable,
        {
          accessibilityLabel: 'Open user A private chart',
          onPress: () =>
            navigation.navigate('Chart', {
              privateOwner: 'user-a',
              privateProfile: { firstName: 'Alice', chartId: 41 },
            }),
        },
        React.createElement(
          View,
          null,
          React.createElement(Text, null, 'Dashboard screen'),
          React.createElement(Text, null, `User:${user?.id ?? 'none'}`),
          React.createElement(Text, null, `Routes:${JSON.stringify(routes)}`)
        )
      )
    },
  }
})

jest.mock('../screens/ChartScreen', () => {
  const React = require('react')
  const { Text, View } = require('react-native')
  const {
    useNavigationState,
    useRoute,
  } = require('@react-navigation/native')
  const { useAuthSession } = require('../lib/authSession')

  return {
    __esModule: true,
    default: function MockChart() {
      const route = useRoute()
      const routes = useNavigationState((state: any) =>
        state.routes.map((item: any) => ({
          name: item.name,
          params: item.params,
        }))
      )
      const { user } = useAuthSession()

      return React.createElement(
        View,
        null,
        React.createElement(Text, null, 'Chart screen'),
        React.createElement(Text, null, `User:${user?.id ?? 'none'}`),
        React.createElement(Text, null, `Routes:${JSON.stringify(routes)}`),
        React.createElement(
          Text,
          null,
          `ChartParams:${JSON.stringify(route.params)}`
        )
      )
    },
  }
})

jest.mock('../screens/ResetPasswordScreen', () => {
  const React = require('react')
  const { Text, View } = require('react-native')
  const { useNavigationState } = require('@react-navigation/native')
  const { useAuthSession } = require('../lib/authSession')

  return {
    __esModule: true,
    default: function MockResetPassword() {
      const routes = useNavigationState((state: any) =>
        state.routes.map((route: any) => ({
          name: route.name,
          params: route.params,
        }))
      )
      const { user } = useAuthSession()

      return React.createElement(
        View,
        null,
        React.createElement(Text, null, 'ResetPassword screen'),
        React.createElement(Text, null, `User:${user?.id ?? 'none'}`),
        React.createElement(Text, null, `Routes:${JSON.stringify(routes)}`)
      )
    },
  }
})

jest.mock('../screens/LoginScreen', () => {
  const React = require('react')
  const { Text } = require('react-native')

  return {
    __esModule: true,
    default: () => React.createElement(Text, null, 'Login screen'),
  }
})

jest.mock('../screens/SignupScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CheckEmailScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/ForgotPasswordScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/AuthCallbackScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CompleteProfileScreen', () => ({ __esModule: true, default: () => null }))
jest.mock('../screens/CreateGuestChartScreen', () => ({ __esModule: true, default: () => null }))
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
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
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

async function renderAsUserA() {
  mockedAuth().getSession.mockResolvedValueOnce({
    data: { session: { user: { id: 'user-a' } } },
    error: null,
  })

  await act(async () => {
    renderer = create(<App />)
    await settleAsyncWork()
  })
}

async function openPrivateChart() {
  const buttons = renderer!.root.findAll(
    (node) => node.props.accessibilityLabel === 'Open user A private chart'
  )
  if (!buttons[0]) {
    throw new Error(`Private chart control missing. Rendered: ${textContent()}`)
  }
  const button = buttons[0]

  await act(async () => {
    button.props.onPress()
    await settleAsyncWork()
  })
}

describe('App real navigation identity isolation', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    renderer = null
    authListener = null
    mockedAuth().onAuthStateChange.mockImplementation(
      (listener: typeof authListener) => {
        authListener = listener
        return { data: { subscription: { unsubscribe } } }
      }
    )
  })

  afterEach(() => {
    if (renderer) act(() => renderer?.unmount())
    renderer = null
  })

  it('discards user A private route history and params on a direct A to B switch', async () => {
    await renderAsUserA()
    await openPrivateChart()

    expect(textContent()).toContain('Chart screen')
    expect(textContent()).toContain('privateOwner')
    expect(textContent()).toContain('user-a')
    expect(textContent()).toContain('Alice')

    await act(async () => {
      authListener?.('SIGNED_IN', { user: { id: 'user-b' } })
      await settleAsyncWork()
    })

    expect(textContent()).toContain('Dashboard screen')
    expect(textContent()).toContain('User:user-b')
    expect(textContent()).toContain('Routes:[{"name":"Dashboard"}]')
    expect(textContent()).not.toContain('Chart screen')
    expect(textContent()).not.toContain('privateOwner')
    expect(textContent()).not.toContain('Alice')
    expect(require('expo-linking').getInitialURL).toHaveBeenCalledTimes(1)
  })

  it('preserves recovery intent while discarding A state on cross-account recovery', async () => {
    await renderAsUserA()
    await openPrivateChart()

    await act(async () => {
      authListener?.('PASSWORD_RECOVERY', { user: { id: 'user-b' } })
      await settleAsyncWork()
    })

    expect(textContent()).toContain('ResetPassword screen')
    expect(textContent()).toContain('User:user-b')
    expect(textContent()).toContain('Routes:[{"name":"ResetPassword"}]')
    expect(textContent()).not.toContain('Chart screen')
    expect(textContent()).not.toContain('privateOwner')
    expect(textContent()).not.toContain('Alice')
  })
})
