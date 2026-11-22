import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'

/** Quiet landmarks within one scrolling form; every field stays in reading order. */
export function AuthFormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="eyebrow" accessibilityRole="header" style={styles.label}>
          {title}
        </AppText>
        <View style={styles.rule} />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.space.lg,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginBottom: theme.space.lg,
  },
  label: {
    color: theme.text.secondary,
    flexShrink: 1,
  },
  rule: {
    flex: 1,
    minWidth: theme.space.xxl,
    height: 1,
    backgroundColor: theme.border.base,
  },
})
