// App.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import {
  NavigationContainer,
  DefaultTheme,
  useIsFocused,
  type LinkingOptions,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAppFonts } from './components/ui/useAppFonts'
import { Background, type BackgroundVariant } from './components/ui/Background'
import { ReducedMotionProvider } from './components/ui/useReducedMotion'
import { theme } from './components/ui/theme'
import { LoadingState } from './components/ui/LoadingState'
import { ErrorState } from './components/ui/ErrorState'

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
import {
  AuthSessionProvider,
  useAuthSessionController,
} from './lib/authSession'

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
    const isFocused = useIsFocused()

    return (
      <Background variant={variant} motionEnabled={isFocused}>
        <Screen {...props} />
      </Background>
    )
  }

  BackgroundScreen.displayName = `withBackground(${
    Screen.displayName || Screen.name || 'Screen'
  })`

  return BackgroundScreen
}

// All routes share the atmospheric sky; the chart adds its hero glow below.
const CheckEmailRoute = withBackground(CheckEmailScreen, 'atmospheric')
const ForgotPasswordRoute = withBackground(ForgotPasswordScreen, 'atmospheric')
const ResetPasswordRoute = withBackground(ResetPasswordScreen, 'atmospheric')
const AuthCallbackRoute = withBackground(AuthCallbackScreen, 'atmospheric')
const CompleteProfileRoute = withBackground(CompleteProfileScreen, 'atmospheric')
const LoginRoute = withBackground(LoginScreen, 'atmospheric')
const SignupRoute = withBackground(SignupScreen, 'atmospheric')
const CreateGuestChartRoute = withBackground(CreateGuestChartScreen, 'atmospheric')
const JournalListRoute = withBackground(JournalListScreen, 'atmospheric')
const JournalEditorRoute = withBackground(JournalEditorScreen, 'atmospheric')
const DashboardRoute = withBackground(DashboardScreen, 'atmospheric')
const MyChartsRoute = withBackground(MyChartsScreen, 'atmospheric')
const ProfileRoute = withBackground(ProfileScreen, 'atmospheric')

// hero: the flagship chart surface.
const ChartRoute = withBackground(ChartScreen, 'hero')

const Stack = createNativeStackNavigator<RootStackParamList>()

export function createAppLinkingOptions(): LinkingOptions<RootStackParamList> {
  let initialUrlConsumed = false

  return {
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
      if (initialUrlConsumed) return null

      // A keyed NavigationContainer remounts when auth identity changes. Mark
      // this read consumed before awaiting so a cold-start link can initialize
      // only the first container and cannot be replayed into the next user.
      initialUrlConsumed = true
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
}

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
    text: theme.text.primary,
    primary: theme.accent.base,
    notification: theme.state.info,
  },
}

export default function App() {
  const authSession = useAuthSessionController()
  const { status, user, postAuthRoute, retryBootstrap } = authSession
  const linking = React.useMemo(createAppLinkingOptions, [])

  // Font failure and timeout both resolve, so font loading cannot strand boot.
  useAppFonts()

  if (status === 'initializing') {
    return (
      <View style={styles.bootRoot}>
        <StatusBar style="light" />
        <LoadingState label="Preparing Naksha" size="large" />
      </View>
    )
  }

  if (status === 'bootstrap-error') {
    return (
      <View style={styles.bootRoot}>
        <StatusBar style="light" />
        <ErrorState
          testID="auth-bootstrap-error"
          title="Could not restore your session"
          description="Check your connection and try again."
          action={{ label: 'Retry', onPress: retryBootstrap }}
        />
      </View>
    )
  }

  return (
    // Exactly one gesture root for the whole app, outermost so every gesture
    // detector below it is inside the same handler tree.
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
    <ReducedMotionProvider>
    <SpaceProvider>
      <View style={styles.appRoot}>
        <StatusBar style="light" />
        {/* <SpaceBackground /> */}

        <AuthSessionProvider value={authSession}>
          <NavigationContainer
            key={user?.id ?? 'signed-out'}
            linking={linking}
            theme={TransparentTheme}
          >
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
                  {postAuthRoute === 'ResetPassword' ? (
                    <Stack.Screen name="ResetPassword" component={ResetPasswordRoute} />
                  ) : null}
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
                </>
              )}

              <Stack.Screen name="CheckEmail" component={CheckEmailRoute} />
              {!user || postAuthRoute !== 'ResetPassword' ? (
                <Stack.Screen name="ResetPassword" component={ResetPasswordRoute} />
              ) : null}
              <Stack.Screen name="AuthCallback" component={AuthCallbackRoute} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthSessionProvider>
      </View>
    </SpaceProvider>
    </ReducedMotionProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
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
