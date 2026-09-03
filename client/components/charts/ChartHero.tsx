// components/charts/ChartHero.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'
import { PLANET_GLYPH } from './ChartCompass'

type Props = {
  title: string
  meaning?: string | null
  /** Drives the single active planet accent. */
  planet?: keyof typeof theme.planet | null
}

/**
 * The chart's headline placement, sitting directly under the wheel: the one
 * thing a reader should take away before scanning the detail beneath it.
 *
 * It is the only place on the screen that uses display type, and it carries
 * the single active planet accent.
 */
export function ChartHero({ title, meaning, planet = null }: Props) {
  const accent = planet ? theme.planet[planet] : theme.accent.base
  const glyph = planet ? PLANET_GLYPH[planet] : null

  return (
    <View style={styles.hero} testID="chart-hero">
      {glyph ? (
        <AppText
          // A content glyph, not an icon: it carries astrological meaning.
          style={[styles.glyph, { color: accent }]}
        >
          {glyph}
        </AppText>
      ) : null}

      <AppText variant="display" style={styles.title}>
        {title}
      </AppText>

      {meaning ? (
        <AppText variant="bodyLarge" style={styles.meaning}>
          {meaning}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: theme.space.xl,
    paddingHorizontal: theme.space.sm,
  },
  glyph: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: theme.space.xs,
  },
  title: {
    color: theme.text.primary,
    textAlign: 'center',
  },
  meaning: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
})
