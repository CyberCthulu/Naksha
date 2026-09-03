// components/ui/ErrorState.tsx
import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { AppText } from './AppText'
import { Button } from './Button'
import { theme } from './theme'

type Action = {
  label: string
  onPress: () => void
}

type Props = {
  title: string
  description?: string
  /** Recovery action. An error state without one is a dead end. */
  action?: Action
  secondaryAction?: Action
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function ErrorState({
  title,
  description,
  action,
  secondaryAction,
  style,
  testID,
}: Props) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, style]}
    >
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>

      {description ? (
        <AppText variant="bodySmall" style={styles.description}>
          {description}
        </AppText>
      ) : null}

      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          style={styles.action}
        />
      ) : null}

      {secondaryAction ? (
        <Button
          title={secondaryAction.label}
          variant="tertiary"
          onPress={secondaryAction.onPress}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xl,
  },
  title: {
    color: theme.state.danger,
    textAlign: 'center',
  },
  description: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: theme.space.lg,
  },
})
