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
    lineHeight: 24,
    includeFontPadding: true,
  },
  paragraphGap: {
    marginTop: 10,
  },
  blockBottomSpacer: {
    height: 8,
  },
})
