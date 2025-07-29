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

// AuthContext to share user state
export const AuthContext = createContext<{ user: any | null }>({ user: null });

const Stack = createNativeStackNavigator();

// Build your deep-link prefix from expo-linking
const prefix = Linking.createURL('/'); // → naksha:///

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      CheckEmail: 'verify-email',
      Dashboard: 'dashboard',
      AuthCallback: 'auth/callback', // if/when you implement a dedicated callback screen
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
            // User is signed in
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
            // Auth flow
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
