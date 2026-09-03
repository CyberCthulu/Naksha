// components/ui/Button.tsx
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { theme } from './theme'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'destructiveSolid'
  /** Backward-compatible alias for `secondary`. */
  | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  style?: ViewStyle
  accessibilityLabel?: string
  testID?: string
}

/** `ghost` predates the V2 variants and means the same thing as `secondary`. */
function resolveVariant(variant: ButtonVariant): Exclude<ButtonVariant, 'ghost'> {
  return variant === 'ghost' ? 'secondary' : variant
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const resolved = resolveVariant(variant)
  const isDisabled = disabled || loading

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      // The touch area is always at least 48dp even when the visual surface is
      // smaller, so a compact button is never a compact target.
      style={({ pressed }) => [
        styles.touchTarget,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.surface,
          sizeStyles[size],
          surfaceStyles[resolved],
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            testID="button-spinner"
            size="small"
            color={labelStyles[resolved].color}
            style={styles.spinner}
          />
        ) : null}
        <Text style={[styles.label, labelSizeStyles[size], labelStyles[resolved]]}>
          {title}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  touchTarget: {
    minHeight: theme.touchTarget.min,
    justifyContent: 'center',
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  spinner: {
    marginRight: theme.space.sm,
  },
  label: {
    ...theme.typography.button,
    textAlign: 'center',
  },
})

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 40,
    paddingHorizontal: theme.space.md,
  },
  md: {
    minHeight: theme.touchTarget.min,
    paddingHorizontal: theme.space.lg,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: theme.space.xl,
  },
})

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: 14 },
  md: {},
  lg: { fontSize: 16 },
})

const surfaceStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.accent.base,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border.strong,
  },
  tertiary: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border.base,
  },
  destructiveSolid: {
    backgroundColor: theme.state.danger,
  },
})

const labelStyles = StyleSheet.create({
  primary: { color: theme.text.onAccent },
  secondary: { color: theme.text.primary },
  tertiary: { color: theme.accent.base },
  destructive: { color: theme.state.danger },
  destructiveSolid: { color: theme.text.onAccent },
})
