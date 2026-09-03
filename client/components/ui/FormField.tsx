import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { AppText } from './AppText'
import { theme } from './theme'

type Props = {
  label: string
  children: React.ReactNode
  /** Supporting text shown under the control when there is no error. */
  hint?: string
  /** Validation message. Replaces the hint and is announced politely. */
  error?: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export default function FormField({
  label,
  children,
  hint,
  error,
  disabled = false,
  style,
}: Props) {
  return (
    <View style={[styles.section, style]}>
      <AppText
        variant="subheading"
        style={[styles.label, disabled && styles.disabledLabel]}
      >
        {label}
      </AppText>

      {children}

      {/* Errors attach to the field that caused them rather than floating to
          the top of the screen as a page-level message. */}
      {error ? (
        <AppText
          variant="bodySmall"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySmall" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.space.lg,
  },
  label: {
    color: theme.text.primary,
    marginBottom: theme.space.sm,
  },
  disabledLabel: {
    color: theme.text.disabled,
  },
  hint: {
    color: theme.text.tertiary,
    marginTop: theme.space.xs,
  },
  error: {
    color: theme.state.danger,
    marginTop: theme.space.xs,
  },
})
