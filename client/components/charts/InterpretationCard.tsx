//components/charts/InterpretationCard.tsx

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

type Section = {
  title?: string
  content: string
}

type Props = {
  title: string
  subtitle?: string | null
  summary?: string | null
  sections?: Section[]
}

export default function InterpretationCard({
  title,
  subtitle = null,
  summary = null,
  sections = [],
}: Props) {
  const visibleSections = sections.filter(
    (section) => section.content && section.content.trim().length > 0
  )

  return (
    <View style={[uiStyles.card, styles.card]}>
      <Text style={styles.title}>{title}</Text>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {!!summary && (
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}

      {visibleSections.map((section, index) => (
        <View
          key={`${section.title ?? 'section'}-${index}`}
          style={index > 0 ? styles.sectionSpacing : undefined}
        >
          {!!section.title && (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          <Text style={styles.bodyText}>{section.content}</Text>
        </View>
      ))}
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
  sectionSpacing: {
    marginTop: 14,
  },
  sectionTitle: {
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