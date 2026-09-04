//components/charts/AspectsList.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Aspect } from '../../lib/astro'
import { getAspectMeaning, type AspectType } from '../../lib/lexicon'
import { AppText } from '../ui/AppText'
import { theme } from '../ui/theme'
import { PLANET_GLYPH } from './ChartCompass'

const ASPECT_LABEL: Record<AspectType, string> = {
  conj: 'Conjunction',
  opp: 'Opposition',
  square: 'Square',
  trine: 'Trine',
  sextile: 'Sextile',
}

function asAspectType(t: string): AspectType | null {
  const allowed: AspectType[] = ['conj', 'opp', 'square', 'trine', 'sextile']
  return (allowed as string[]).includes(t) ? (t as AspectType) : null
}

type Props = {
  aspects: Aspect[]
}

export default function AspectsList({ aspects }: Props) {
  if (aspects.length === 0) {
    return (
      <AppText variant="bodySmall" style={styles.fallback}>
        None (within default orbs)
      </AppText>
    )
  }

  return (
    <View>
      {aspects
        .slice()
        .sort((a, b) => a.orb - b.orb)
        .map((a, i) => {
          const at = asAspectType(a.type)
          const meaning = at ? getAspectMeaning(at) : null
          const glyphA = PLANET_GLYPH[a.a]
          const glyphB = PLANET_GLYPH[a.b]

          return (
            <View
              key={`${a.a}-${a.b}-${i}`}
              testID={`aspect-row-${a.a}-${a.b}`}
              style={styles.row}
            >
              <View style={styles.headline}>
                <AppText variant="subheading" style={styles.pair}>
                  {glyphA ? `${glyphA} ` : ''}
                  {a.a}
                  <AppText style={styles.pairJoin}> · </AppText>
                  {glyphB ? `${glyphB} ` : ''}
                  {a.b}
                </AppText>
              </View>

              <View style={styles.metaRow}>
                <AppText variant="eyebrow" style={styles.type}>
                  {at ? ASPECT_LABEL[at] : a.type}
                </AppText>
                <AppText variant="numeric" style={styles.orb}>
                  {`${a.orb.toFixed(2)}° orb`}
                </AppText>
              </View>

              {meaning?.short ? (
                <AppText variant="bodySmall" style={styles.summary}>
                  {meaning.short}
                </AppText>
              ) : null}
            </View>
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    color: theme.text.secondary,
  },
  row: {
    paddingVertical: theme.space.md,
  },
  headline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pair: {
    color: theme.text.primary,
    flexShrink: 1,
  },
  pairJoin: {
    color: theme.text.tertiary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.space.sm,
    marginTop: theme.space.xs,
  },
  type: {
    color: theme.accent.base,
  },
  orb: {
    color: theme.text.tertiary,
    fontSize: 12,
  },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
})
