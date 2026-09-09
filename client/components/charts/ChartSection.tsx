// components/charts/ChartSection.tsx
import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { AppText } from '../ui/AppText'
import { CelestialMark, type CelestialMotif } from '../ui/CelestialMark'
import { theme } from '../ui/theme'

type Props = {
  title: string
  motif?: CelestialMotif
  /** Small uppercase label above the title. */
  eyebrow?: string
  /** Supporting line under the title, e.g. a house-system note. */
  note?: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Shared section rhythm for the chart surface.
 *
 * Sections are separated by space and a single hairline rule rather than by
 * boxing each one in its own card. The chart already carries a lot of small
 * repeated data; giving every group a border turns the screen into a stack of
 * containers and leaves the wheel competing with them for attention.
 */
export function ChartSection({
  title,
  motif,
  eyebrow,
  note,
  children,
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.section, style]}>
      {eyebrow ? (
        <AppText variant="eyebrow" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
      ) : null}

      <View style={styles.titleRow}>
        {motif ? <CelestialMark motif={motif} /> : null}
        <AppText variant="heading" style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
      </View>

      {note ? (
        <AppText variant="caption" style={styles.note}>
          {note}
        </AppText>
      ) : null}

      <View style={styles.rule} />

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: theme.space.xxxl,
  },
  eyebrow: {
    color: theme.accent.base,
    marginBottom: theme.space.xs,
  },
  title: {
    color: theme.text.primary,
    flexShrink: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: theme.space.sm,
  },
  note: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border.base,
    marginTop: theme.space.md,
    marginBottom: theme.space.sm,
  },
})
