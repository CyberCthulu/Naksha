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
import { FormAppearanceContext, type FormAppearance } from '../ui/FormAppearance'

type Props = {
  children: ReactNode
  centered?: boolean
  formAppearance?: FormAppearance
}

export default function AuthContainer({
  children,
  centered = false,
  formAppearance = 'default',
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
          paddingHorizontal: theme.space.xl,
          paddingTop: insets.top + theme.space.xs,
          paddingBottom: insets.bottom + 24,
          justifyContent: centered ? 'center' : 'flex-start',
        }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
      >
        <FormAppearanceContext.Provider value={formAppearance}>
          <View
            style={formAppearance === 'soft'
              ? { width: '100%', maxWidth: 480, alignSelf: 'center' }
              : undefined}
          >
            {children}
          </View>
        </FormAppearanceContext.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}