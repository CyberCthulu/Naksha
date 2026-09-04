// components/ui/ScreenHeader.tsx
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { AppText } from './AppText'
import { Icon } from './Icon'
import { theme } from './theme'

export type ScreenHeaderAction = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  /** Defaults to `label`. */
  accessibilityLabel?: string
}

type Props = {
  title: string
  /** Omit to render no back control (the slot still reserves its width). */
  onBack?: () => void
  /** Defaults to "Go back". Screens that leave the stack say so explicitly. */
  backAccessibilityLabel?: string
  rightAction?: ScreenHeaderAction
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * The single in-screen header. Navigator headers stay hidden everywhere, so
 * this is the only header system in the app.
 *
 * It deliberately applies no safe-area inset of its own: every screen already
 * pads its own top, and adding a second source would double the inset. The
 * containing screen owns that decision.
 *
 * The row is flex, never absolutely positioned, so a long title wraps to a
 * second line instead of sliding underneath the controls.
 */
export function ScreenHeader({
  title,
  onBack,
  backAccessibilityLabel = 'Go back',
  rightAction,
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.row, style]}>
      <View style={styles.slot}>
        {onBack ? (
          <Pressable
            testID="screen-header-back"
            accessibilityRole="button"
            accessibilityLabel={backAccessibilityLabel}
            onPress={onBack}
            style={({ pressed }) => [
              styles.control,
              pressed && styles.pressed,
            ]}
          >
            <Icon name="back" size="lg" />
          </Pressable>
        ) : null}
      </View>

      <AppText
        variant="heading"
        numberOfLines={2}
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </AppText>

      <View style={[styles.slot, styles.rightSlot]}>
        {rightAction ? (
          <Pressable
            testID="screen-header-action"
            accessibilityRole="button"
            accessibilityLabel={
              rightAction.accessibilityLabel ?? rightAction.label
            }
            accessibilityState={{
              disabled: !!rightAction.disabled || !!rightAction.loading,
              busy: !!rightAction.loading,
            }}
            disabled={rightAction.disabled || rightAction.loading}
            onPress={rightAction.onPress}
            style={({ pressed }) => [
              styles.control,
              styles.actionControl,
              pressed && styles.pressed,
              (rightAction.disabled || rightAction.loading) && styles.disabled,
            ]}
          >
            {rightAction.loading ? (
              <ActivityIndicator
                testID="screen-header-action-spinner"
                size="small"
                color={theme.accent.base}
              />
            ) : (
              <AppText variant="button" style={styles.actionLabel}>
                {rightAction.label}
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.space.sm,
  },
  slot: {
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  control: {
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionControl: {
    paddingHorizontal: theme.space.sm,
  },
  actionLabel: {
    color: theme.accent.base,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    flex: 1,
    minHeight: theme.touchTarget.min,
    color: theme.text.primary,
    paddingHorizontal: theme.space.xs,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
})
