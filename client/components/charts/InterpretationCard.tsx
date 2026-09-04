// components/charts/InterpretationCard.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Interpretation } from '../../lib/lexicon'
import { AppText } from '../ui/AppText'
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
  /** Small uppercase label above the title, e.g. "Planet Interpretation". */
  eyebrow?: string | null
}

type TextSegment = {
  text: string
  paragraphIndex: number
  sentenceIndex: number
}

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function splitSentences(paragraph: string): string[] {
  const sentences: string[] = []
  let sentenceStart = 0

  for (let index = 0; index < paragraph.length; index += 1) {
    const character = paragraph[index]
    if (character !== '.' && character !== '!' && character !== '?') continue

    const nextCharacter = paragraph[index + 1]
    if (nextCharacter && !/\s/.test(nextCharacter)) continue

    const sentence = paragraph.slice(sentenceStart, index + 1).trim()
    if (sentence) sentences.push(sentence)

    sentenceStart = index + 1
    while (
      sentenceStart < paragraph.length &&
      /\s/.test(paragraph[sentenceStart])
    ) {
      sentenceStart += 1
    }
    index = sentenceStart - 1
  }

  const trailingSentence = paragraph.slice(sentenceStart).trim()
  if (trailingSentence) sentences.push(trailingSentence)

  return sentences
}

function splitTextSegments(content: string): TextSegment[] {
  return splitParagraphs(content).flatMap((paragraph, paragraphIndex) =>
    splitSentences(paragraph).map((text, sentenceIndex) => ({
      text,
      paragraphIndex,
      sentenceIndex,
    }))
  )
}

export default function InterpretationCard({
  title,
  subtitle = null,
  summary = null,
  blocks = [],
  eyebrow = null,
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
      {!!eyebrow && (
        <AppText variant="eyebrow" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
      )}

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
        const textSegments = splitTextSegments(content)

        return (
          <View
            key={`${block.title ?? 'block'}-${index}`}
            style={index > 0 ? styles.blockSpacing : undefined}
          >
            {!!block.title && (
              <Text style={styles.blockTitle}>{block.title}</Text>
            )}

            {textSegments.map((segment) => (
              <Text
                key={`${block.title ?? 'sentence'}-${index}-${segment.paragraphIndex}-${segment.sentenceIndex}`}
                style={[
                  styles.bodyText,
                  segment.paragraphIndex > 0 &&
                    segment.sentenceIndex === 0 &&
                    styles.paragraphGap,
                ]}
              >
                {segment.text}
              </Text>
            ))}

            <View
              testID="interpretation-block-bottom-spacer"
              style={styles.blockBottomSpacer}
            />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.space.md,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.accent.base,
    marginBottom: theme.space.xs,
  },
  title: {
    ...theme.typography.display,
    color: theme.text.primary,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.accent.base,
    marginTop: theme.space.xs,
    marginBottom: theme.space.lg,
  },
  summaryBlock: {
    marginTop: theme.space.xs,
    marginBottom: theme.space.lg,
    paddingBottom: theme.space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border.base,
  },
  summaryText: {
    ...theme.typography.bodyLarge,
    color: theme.text.primary,
  },
  blockSpacing: {
    marginTop: theme.space.xl,
  },
  blockTitle: {
    ...theme.typography.heading,
    color: theme.text.primary,
    marginBottom: theme.space.sm,
  },
  bodyText: {
    ...theme.typography.bodyLarge,
    color: theme.text.secondary,
    // Part of the verified long-text clipping fix. Deliberately kept true even
    // though the typography roles disable it everywhere else.
    includeFontPadding: true,
  },
  paragraphGap: {
    marginTop: theme.space.md,
  },
  blockBottomSpacer: {
    height: theme.space.sm,
  },
})
