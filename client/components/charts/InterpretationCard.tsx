// components/charts/InterpretationCard.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Interpretation } from '../../lib/lexicon'
import { theme } from '../ui/theme'

type InterpretationBlock = {
  title?: string
  interpretation?: Interpretation | null
  mode?: 'short' | 'long'
}

type Props = {
  title: string
  subtitle?: string | null
  summary?: string | null
  blocks?: InterpretationBlock[]
}

export default function InterpretationCard({
  title,
  subtitle = null,
  summary = null,
  blocks = [],
}: Props) {
  const visibleBlocks = blocks.filter((block) => {
    if (!block.interpretation) return false

    const mode = block.mode ?? 'long'
    const content =
      mode === 'short'
        ? block.interpretation.short
        : block.interpretation.long

    return !!content?.trim()
  })

  return (
    <View style={[styles.card]}>
      <Text style={styles.title}>{title}</Text>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {!!summary?.trim() && (
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}

      {visibleBlocks.map((block, index) => {
        const mode = block.mode ?? 'long'
        const content =
          mode === 'short'
            ? block.interpretation?.short ?? ''
            : block.interpretation?.long ?? ''

        return (
          <View
            key={`${block.title ?? 'block'}-${index}`}
            style={index > 0 ? styles.blockSpacing : undefined}
          >
            {!!block.title && (
              <Text style={styles.blockTitle}>{block.title}</Text>
            )}

            <Text style={styles.bodyText}>{content}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.sub,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  summaryBlock: {
    marginTop: 4,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  blockSpacing: {
    marginTop: 14,
  },
  blockTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  bodyText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
})