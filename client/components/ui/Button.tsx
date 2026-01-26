// components/ui/Button.tsx
import React from 'react'
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import { theme } from './theme'

interface ButtonProps {
  title: string
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function Button({ title, variant = 'primary', disabled = false, onPress, style }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`], disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: {
    backgroundColor: theme.colors.text,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryText: {
    color: theme.colors.cardBg,
  },
  ghostText: {
    color: theme.colors.text,
  },
  disabledText: {
    opacity: 0.7,
  },
})