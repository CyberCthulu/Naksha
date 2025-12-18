// components/auth/AuthContainer.tsx
import { ReactNode } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'

// ✅ shared styles
import { uiStyles } from '../ui/uiStyles'

export default function AuthContainer({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          uiStyles.screen,
          { justifyContent: 'center' },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 10 }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
