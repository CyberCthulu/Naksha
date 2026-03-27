import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Aspect } from '../../lib/astro'
import { getAspectMeaning, type AspectType } from '../../lib/lexicon'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

function asAspectType(t: string): AspectType | null {
  const allowed: AspectType[] = ['conj', 'opp', 'square', 'trine', 'sextile']
  return (allowed as string[]).includes(t) ? (t as AspectType) : null
}

type Props = {
  aspects: Aspect[]
}

export default function AspectsList({ aspects }: Props) {
  return (
    <>
      <Text style={styles.h2}>Aspects</Text>

      {aspects.length === 0 ? (
        <Text style={uiStyles.muted}>None (within default orbs)</Text>
      ) : (
        aspects
          .slice()
          .sort((a, b) => a.orb - b.orb)
          .map((a, i) => {
            const at = asAspectType(a.type)
            const meaning = at ? getAspectMeaning(at) : null

            return (
              <View key={`${a.a}-${a.b}-${i}`} style={styles.itemRow}>
                <Text style={styles.itemLeft}>
                  {`${a.a} ${a.type} ${a.b} (${a.orb.toFixed(2)}°)`}
                </Text>
                <Text style={styles.itemRight} numberOfLines={3}>
                  {meaning?.short ?? ''}
                </Text>
              </View>
            )
          })
      )}
    </>
  )
}

const styles = StyleSheet.create({
  h2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemLeft: {
    width: 150,
    fontFamily: 'monospace' as any,
    color: theme.colors.text,
  },
  itemRight: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.sub,
    paddingLeft: 10,
    lineHeight: 16,
  },
})