import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { CelestialMark, type CelestialMotif } from '../ui/CelestialMark'
import { Icon } from '../ui/Icon'
import { theme } from '../ui/theme'

/** Shared surface and typography for the Dashboard's two guidance views. */
export function GuidanceCard({
  title,
  motif,
  metadata,
  expanded,
  onExpandedChange,
  testID,
  children,
}: {
  title: string
  motif: CelestialMotif
  metadata: string
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  testID: string
  children: ReactNode
}) {
  return (
    <Card testID={testID}>
      {/* Keep the toggle bounded to the header so body copy stays independently
          readable in TalkBack. The Dashboard owns expansion across tab changes. */}
      <Pressable
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title} details`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => onExpandedChange(!expanded)}
        testID={`${testID}-toggle`}
        style={({ pressed }) => [styles.header, pressed && styles.togglePressed]}
      >
        <View style={styles.titleRow}>
          <CelestialMark motif={motif} />
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
        </View>
        <Icon
          name={expanded ? 'collapse' : 'expand'}
          size="sm"
          color={theme.text.secondary}
        />
      </Pressable>

      <MutedText variant="eyebrow" style={styles.metadata}>
        {metadata}
      </MutedText>

      {children}

      {expanded ? (
        <Pressable
          accessibilityLabel={`Collapse ${title} details`}
          accessibilityRole="button"
          accessibilityState={{ expanded: true }}
          onPress={() => onExpandedChange(false)}
          style={({ pressed }) => [
            styles.bottomToggle,
            pressed && styles.togglePressed,
          ]}
          testID={`${testID}-bottom-collapse`}
        >
          <MutedText variant="bodySmall" style={styles.bottomToggleText}>
            Collapse
          </MutedText>
        </Pressable>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: theme.space.md,
    justifyContent: 'space-between',
    minHeight: theme.touchTarget.min,
  },
  title: {
    flexShrink: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: theme.space.sm,
    flex: 1,
  },
  togglePressed: {
    opacity: 0.75,
  },
  metadata: {
    color: theme.accent.base,
    marginTop: theme.space.hair,
  },
  bottomToggle: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border.base,
    justifyContent: 'center',
    marginTop: theme.space.lg,
    minHeight: theme.touchTarget.min,
    paddingTop: theme.space.md,
    width: '100%',
  },
  bottomToggleText: {
    color: theme.text.secondary,
  },
})
