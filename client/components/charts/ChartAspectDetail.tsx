// components/charts/ChartAspectDetail.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'

import type { Aspect } from '../../lib/astro'
import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'
import { PLANET_GLYPH } from './ChartCompass'

type Props = {
  aspect: Aspect
  /** Human aspect name, e.g. "Opposition". */
  label: string
  /** Existing lexicon summary for the aspect type. */
  summary?: string | null
  testID?: string
}

/**
 * Explanation for an aspect selected on the wheel.
 *
 * Sits below the wheel in the same place the placement explanation does, so
 * the two never occupy the screen at once and neither covers the chart.
 * Every value shown already exists: participating planets, aspect name, orb
 * and the lexicon summary.
 */
export function ChartAspectDetail({ aspect, label, summary, testID }: Props) {
  const glyphA = PLANET_GLYPH[aspect.a]
  const glyphB = PLANET_GLYPH[aspect.b]

  return (
    <View testID={testID} style={styles.detail}>
      <AppText variant="eyebrow" style={styles.eyebrow}>
        {label}
      </AppText>

      {/* Keyed for the same reason as the hero: a changing title on a
          reused Text view can be laid out in the previous string's width. */}
      <AppText
        key={`${aspect.a}-${aspect.b}`}
        variant="heading"
        style={styles.pair}
      >
        {glyphA ? `${glyphA} ` : ''}
        {aspect.a}
        <AppText style={styles.join}> · </AppText>
        {glyphB ? `${glyphB} ` : ''}
        {aspect.b}
      </AppText>

      <AppText variant="numeric" style={styles.orb}>
        {`${aspect.orb.toFixed(2)}° orb`}
      </AppText>

      {summary ? (
        <AppText variant="bodyLarge" style={styles.summary}>
          {summary}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  detail: {
    alignItems: 'center',
    marginTop: theme.space.xl,
    paddingHorizontal: theme.space.sm,
  },
  eyebrow: {
    color: theme.accent.base,
  },
  pair: {
    color: theme.text.primary,
    marginTop: theme.space.xs,
    textAlign: 'center',
  },
  join: {
    color: theme.text.tertiary,
  },
  orb: {
    color: theme.text.tertiary,
    fontSize: 12,
    marginTop: theme.space.hair,
  },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
})
