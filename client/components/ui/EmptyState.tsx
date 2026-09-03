// components/ui/EmptyState.tsx
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
  action?: Action
  secondaryAction?: Action
  style?: StyleProp<ViewStyle>
  testID?: string
}

export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} accessible style={[styles.container, style]}>
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
