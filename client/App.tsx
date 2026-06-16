// App.tsx
import React, { useEffect, useState, createContext } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import supabase from './lib/supabase'
import { SpaceProvider } from './components/space/SpaceProvider'
// import SpaceBackground from './components/space/SpaceBackground'

import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import CheckEmailScreen from './screens/CheckEmailScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import DashboardScreen from './screens/DashboardScreen'
import AuthCallbackScreen from './screens/AuthCallbackScreen'
import CompleteProfileScreen from './screens/CompleteProfileScreen'
import CreateGuestChartScreen from './screens/CreateGuestChartScreen'
import ChartScreen from './screens/ChartScreen'
import MyChartsScreen from './screens/MyCharts'
import JournalEditorScreen from './screens/JournalEditorScreen'
import JournalListScreen from './screens/JournalListScreen'
import ProfileScreen from './screens/ProfileScreen'

export const AuthContext = createContext<{ user: any | null }>({ user: null })
const Stack = createNativeStackNavigator()

const linking = {
  prefixes: [Linking.createURL('/'), 'naksha://'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      CheckEmail: 'verify-email',
      Dashboard: 'dashboard',
      CompleteProfile: 'complete-profile',
      CreateGuestChart: 'guest-chart/new',
      Chart: 'chart',
      MyCharts: 'my-charts',
      AuthCallback: 'auth/callback',
      JournalEditor: 'journal/edit/:id?',
      JournalList: 'journal/list',
      Profile: 'profile',
    },
  },
}

function logDeepLinkFlags(url?: string | null) {
  const value = typeof url === 'string' ? url : ''

  console.warn('[DeepLink] appears auth callback:', value.includes('auth/callback'))
  console.warn('[DeepLink] contains query marker:', value.includes('?'))
  console.warn('[DeepLink] contains fragment marker:', value.includes('#'))
}

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
    text: '#fff',
    primary: '#fff',
    notification: '#fff',
  },
}

export default function App() {
  const [user, setUser] = useState<any | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let mounted = true

    Linking.getInitialURL()
      .then((url) => {
        if (!mounted) return

        console.warn('[DeepLink] initial URL present:', Boolean(url))
        logDeepLinkFlags(url)
      })
      .catch(() => {
        if (!mounted) return

        console.warn('[DeepLink] initial URL present:', false)
        logDeepLinkFlags(null)
      })

    const sub = Linking.addEventListener('url', ({ url }) => {
      console.warn('[DeepLink] foreground URL event received:', Boolean(url))
      logDeepLinkFlags(url)
    })

    return () => {
      mounted = false
      sub.remove()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.warn('Error getting session:', error.message)
      }

      if (!mounted) return

      setUser(data.session?.user ?? null)
      setAuthReady(true)
    }

    initAuth()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
    <SpaceProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* <SpaceBackground /> */}

        <AuthContext.Provider value={{ user }}>
          <NavigationContainer linking={linking} theme={TransparentTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
              }}
            >
              {user ? (
                <>
                  <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  <Stack.Screen
                    name="CompleteProfile"
                    component={CompleteProfileScreen}
                    options={{
                      headerShown: true,
                      title: 'Complete Profile',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="CreateGuestChart"
                    component={CreateGuestChartScreen}
                    options={{
                      headerShown: true,
                      title: 'Create Guest Chart',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="Chart"
                    component={ChartScreen}
                    options={{
                      headerShown: true,
                      title: 'Birth Chart',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="MyCharts"
                    component={MyChartsScreen}
                    options={{
                      headerShown: true,
                      title: 'My Saved Charts',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="JournalList"
                    component={JournalListScreen}
                    options={{
                      headerShown: true,
                      title: 'My Journal',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="JournalEditor"
                    component={JournalEditorScreen}
                    options={{
                      headerShown: true,
                      title: 'Journal Entry',
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                      headerShown: true,
                      title: 'My Profile',
                      headerTransparent: true,
                    }}
                  />
                </>
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Signup" component={SignupScreen} />
                  <Stack.Screen
                    name="ForgotPassword"
                    component={ForgotPasswordScreen}
                  />
                  <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
                </>
              )}

              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </View>
    </SpaceProvider>
    </SafeAreaProvider>
  )
}
