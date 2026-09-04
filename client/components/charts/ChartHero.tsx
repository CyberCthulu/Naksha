// components/charts/ChartHero.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { theme } from '../ui/theme'
import { PLANET_GLYPH } from './ChartCompass'

type Props = {
  title: string
  meaning?: string | null
  /** House the selected placement falls in, when one is known. */
  house?: number | null
  /** Drives the single active planet accent. */
  planet?: keyof typeof theme.planet | null
  /** Opens the full interpretation for the selected placement. */
  onOpen?: () => void
}

/**
 * The chart's headline placement, sitting directly under the wheel: the one
 * thing a reader should take away before scanning the detail beneath it.
 *
 * It is the only place on the screen that uses display type, and it carries
 * the single active planet accent.
 */
export function ChartHero({
  title,
  meaning,
  house = null,
  planet = null,
  onOpen,
}: Props) {
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

      {house ? (
        <AppText variant="eyebrow" style={styles.house}>
          {`House ${house}`}
        </AppText>
      ) : null}

      {meaning ? (
        <AppText variant="bodyLarge" style={styles.meaning}>
          {meaning}
        </AppText>
      ) : null}

      {onOpen ? (
        <Button
          testID="chart-hero-open"
          title="Read full interpretation"
          variant="tertiary"
          onPress={onOpen}
          style={styles.action}
        />
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
    /*
      Laid out at the container's full width rather than shrinking to fit.

      `hero` centres its children, so without this the Text would be sized by
      its own measured width. On Android that measurement and the layout that
      follows it disagree by a fraction of a pixel for some strings -- the
      serif display face carries negative letterSpacing, so glyph advances are
      fractional -- and the paragraph re-wraps inside a box measured for a
      single line. The overflowing word lands on a second line the view has no
      height for, which is how "Jupiter in Aquarius" rendered as "Jupiter in"
      while the longer "Neptune in Capricorn" was fine.

      Stretching removes the disagreement: the width comes from the container,
      so there is nothing for the re-wrap to round against. `textAlign` keeps
      the line centred, which is all the centring was ever doing here.
    */
    alignSelf: 'stretch',
    color: theme.text.primary,
    textAlign: 'center',
  },
  house: {
    color: theme.accent.base,
    marginTop: theme.space.xs,
  },
  meaning: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: theme.space.sm,
  },
})
