import React, { useState } from 'react'
import { StyleSheet, TextInput, type TextInputProps } from 'react-native'
import { theme } from './theme'

export type TextFieldProps = TextInputProps & {
  /** Renders the invalid state. The message itself belongs to FormField. */
  error?: boolean
}

export default function TextField({
  error = false,
  editable = true,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <TextInput
      {...rest}
      editable={editable}
      placeholderTextColor={theme.text.tertiary}
      accessibilityState={{ disabled: !editable }}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      style={[
        styles.input,
        !editable && styles.disabled,
        focused && styles.focused,
        error && styles.error,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    ...theme.typography.body,
    minHeight: theme.touchTarget.min,
    borderWidth: 1,
    borderColor: theme.border.base,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.background.sunken,
    color: theme.text.primary,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
  },
  focused: {
    borderColor: theme.border.accent,
    borderWidth: 1.5,
  },
  error: {
    borderColor: theme.state.danger,
    borderWidth: 1.5,
  },
  disabled: {
    backgroundColor: theme.surface.base,
    color: theme.text.disabled,
  },
})
