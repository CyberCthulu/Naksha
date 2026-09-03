// App.tsx
import React, { useEffect, useState, createContext } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import {
  NavigationContainer,
  DefaultTheme,
  type LinkingOptions,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAppFonts } from './components/ui/useAppFonts'
import { Background, type BackgroundVariant } from './components/ui/Background'
import { ReducedMotionProvider } from './components/ui/useReducedMotion'
import { theme } from './components/ui/theme'

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
import { normalizeAuthCallbackUrlForRouting } from './lib/authCallbackUrl'
import type { RootStackParamList } from './navigation/types'

/**
 * One Background per route, wrapped at registration rather than inside each
 * screen. Defined at module scope so the wrapped component identity is stable
 * and screens are not remounted on every App render.
 */
function withBackground<P extends object>(
  Screen: React.ComponentType<P>,
  variant: BackgroundVariant
) {
  function BackgroundScreen(props: P) {
    return (
      <Background variant={variant}>
        <Screen {...props} />
      </Background>
    )
  }

  BackgroundScreen.displayName = `withBackground(${
    Screen.displayName || Screen.name || 'Screen'
  })`

  return BackgroundScreen
}

// quiet: forms, auth, recovery, lists and the journal editor.
const LoginRoute = withBackground(LoginScreen, 'quiet')
const SignupRoute = withBackground(SignupScreen, 'quiet')
const CheckEmailRoute = withBackground(CheckEmailScreen, 'quiet')
const ForgotPasswordRoute = withBackground(ForgotPasswordScreen, 'quiet')
const ResetPasswordRoute = withBackground(ResetPasswordScreen, 'quiet')
const AuthCallbackRoute = withBackground(AuthCallbackScreen, 'quiet')
const CompleteProfileRoute = withBackground(CompleteProfileScreen, 'quiet')
const CreateGuestChartRoute = withBackground(CreateGuestChartScreen, 'quiet')
const JournalListRoute = withBackground(JournalListScreen, 'quiet')
const JournalEditorRoute = withBackground(JournalEditorScreen, 'quiet')

// atmospheric: the browsing and account surfaces.
const DashboardRoute = withBackground(DashboardScreen, 'atmospheric')
const MyChartsRoute = withBackground(MyChartsScreen, 'atmospheric')
const ProfileRoute = withBackground(ProfileScreen, 'atmospheric')

// hero: the flagship chart surface.
const ChartRoute = withBackground(ChartScreen, 'hero')

export const AuthContext = createContext<{ user: any | null }>({ user: null })
const Stack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
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
  async getInitialURL() {
    const url = await Linking.getInitialURL()
    return normalizeAuthCallbackUrlForRouting(url)
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(normalizeAuthCallbackUrlForRouting(url) ?? url)
    })

    return () => subscription.remove()
  },
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

  // Holds the native splash until the four app fonts resolve, then hides it.
  // Failure and timeout both count as resolved, so the app can never be
  // stranded behind the splash by a font. Auth initialization below is
  // untouched and keeps its own loading state.
  useAppFonts()

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
      <View style={styles.bootRoot}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.accent.base} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
    <ReducedMotionProvider>
    <SpaceProvider>
      <View style={styles.appRoot}>
        <StatusBar style="light" />
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
                  <Stack.Screen name="Dashboard" component={DashboardRoute} />
                  <Stack.Screen name="CompleteProfile" component={CompleteProfileRoute} />
                  <Stack.Screen name="CreateGuestChart" component={CreateGuestChartRoute} />
                  <Stack.Screen name="Chart" component={ChartRoute} />
                  <Stack.Screen name="MyCharts" component={MyChartsRoute} />
                  <Stack.Screen name="JournalList" component={JournalListRoute} />
                  <Stack.Screen name="JournalEditor" component={JournalEditorRoute} />
                  <Stack.Screen name="Profile" component={ProfileRoute} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginRoute} />
                  <Stack.Screen name="Signup" component={SignupRoute} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordRoute} />
                  <Stack.Screen name="CheckEmail" component={CheckEmailRoute} />
                </>
              )}

              <Stack.Screen name="ResetPassword" component={ResetPasswordRoute} />
              <Stack.Screen name="AuthCallback" component={AuthCallbackRoute} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </View>
    </SpaceProvider>
    </ReducedMotionProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    // Fallback beneath every route Background, so a screen is never bare white.
    backgroundColor: theme.background.base,
  },
  bootRoot: {
    flex: 1,
    backgroundColor: theme.background.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
