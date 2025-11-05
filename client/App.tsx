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
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import ChartScreen from './screens/ChartScreen';
import MyChartsScreen from './screens/MyCharts';
import JournalEditorScreen from './screens/JournalEditorScreen';
import JournalListScreen from './screens/JournalListScreen';


export const AuthContext = createContext<{ user: any | null }>({ user: null });
const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'naksha://'],
  config: {
    screens: {
      Login: 'login',
      Signup: 'signup',
      CheckEmail: 'verify-email',
      Dashboard: 'dashboard',
      CompleteProfile: 'complete-profile',
      Chart: 'chart',
      MyCharts: 'my-charts',
      AuthCallback: 'auth/callback',
      JournalEditor: 'journal/edit/:id?',
      JournalList: 'journal/list',
    },
  },
};

export default function App() {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.warn('Error getting session:', error.message);
      setUser(session?.user ?? null);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen
                name="CompleteProfile"
                component={CompleteProfileScreen}
                options={{ headerShown: true, title: 'Complete Profile' }}
              />
              <Stack.Screen name="Chart" component={ChartScreen} options={{ headerShown: true, title: 'Birth Chart' }} />
              <Stack.Screen name="MyCharts" component={MyChartsScreen} options={{ headerShown: true, title: 'My Saved Charts' }} />
              <Stack.Screen name="JournalList" component={JournalListScreen} options={{ headerShown: true, title: 'My Journal' }} />
              <Stack.Screen name="JournalEditor" component={JournalEditorScreen} options={{ headerShown: true, title: 'Journal Entry' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
            </>
          )}

          {/* Keep AuthCallback available in both states so deep links always work */}
          <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
