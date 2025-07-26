//App.tsx

import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import supabase from './lib/supabase';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import CheckEmailScreen from './screens/CheckEmailScreen';


// Create AuthContext to provide user state
export const AuthContext = createContext<{ user: any | null }>({ user: null });

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Check initial auth session
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.warn('Error getting session:', error);
      setUser(session?.user ?? null);
    };
    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          ) : (
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
