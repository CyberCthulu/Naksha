// App.tsx

import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import supabase from './lib/supabase';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import CheckEmailScreen from './screens/CheckEmailScreen';
import DashboardScreen from './screens/DashboardScreen';
import AuthCallbackScreen from './screens/AuthCallbackScreen';

// AuthContext to share user state
export const AuthContext = createContext<{ user: any | null }>({ user: null });

const Stack = createNativeStackNavigator();

// Deep-link prefixes: Expo dev URL + custom app scheme
const linking = {
  prefixes: [Linking.createURL('/'), 'naksha://'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      CheckEmail: 'verify-email',
      Dashboard: 'dashboard',
      AuthCallback: 'auth/callback',
    },
  },
};

export default function App() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // 1) Fetch initial session
    const initAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.warn('Error getting session:', error.message);
      setUser(session?.user ?? null);
    };
    initAuth();

    // 2) Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      <NavigationContainer linking={linking} fallback={<></>}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
              {/* Added: route that receives the deep link and exchanges the code/tokens */}
              <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
