// components/auth/AuthContainer.tsx
import { ReactNode } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { theme } from '../ui/theme'

type Props = {
  children: ReactNode
  centered?: boolean
}

export default function AuthContainer({
  children,
  centered = false,
}: Props) {
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.spacing.screen,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          justifyContent: centered ? 'center' : 'flex-start',
        }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        <View>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}