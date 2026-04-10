// components/auth/AuthContainer.tsx
import { ReactNode } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { uiStyles } from '../ui/uiStyles'

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
        contentContainerStyle={[
          uiStyles.screen,
          {
            flexGrow: 1,
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            justifyContent: centered ? 'center' : 'flex-start',
          },
        ]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        <View style={{ gap: 10 }}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}