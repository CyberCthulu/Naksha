import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import type {
  DailyGuidance,
  DailyGuidanceSection,
} from '../../lib/guidance'
import type { ReflectionPrompt } from '../../lib/lexicon/guidance'
import { AppText, MutedText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

function GuidanceSection({
  section,
  numberOfLines,
}: {
  section: DailyGuidanceSection
  numberOfLines?: number
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{section.title}</AppText>
      <MutedText
        numberOfLines={numberOfLines}
        style={styles.sectionBody}
      >
        {section.body}
      </MutedText>
    </View>
  )
}

export function TodayEnergyCard({
  guidance,
  onJournalPrompt,
}: {
  guidance: DailyGuidance
  onJournalPrompt?: (prompt: ReflectionPrompt) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <Pressable
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} Today’s Energy details`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.toggleSurface,
          pressed && styles.togglePressed,
        ]}
      >
        <AppText style={uiStyles.cardTitle}>Today’s Energy</AppText>
        <MutedText style={styles.transitSigns}>
          Moon in {guidance.transitMoonSign ?? 'Unknown'} | Sun in{' '}
          {guidance.transitSunSign ?? 'Unknown'}
        </MutedText>

        {!expanded ? (
          <>
            <GuidanceSection
              section={guidance.mood}
              numberOfLines={2}
            />
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>
                {guidance.transitSummary.title}
              </AppText>
              <MutedText
                numberOfLines={2}
                style={styles.sectionBody}
              >
                {guidance.transitSummary.body}
              </MutedText>
            </View>
          </>
        ) : null}

        <MutedText style={styles.toggleHint}>
          {expanded ? 'Tap to collapse' : 'Tap to expand'}
        </MutedText>
      </Pressable>

      {expanded ? (
        <>
          <GuidanceSection section={guidance.mood} />
          <GuidanceSection section={guidance.warning} />
          <GuidanceSection section={guidance.opportunity} />
          <GuidanceSection section={guidance.transitSummary} />

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Reflection prompt</AppText>
            <AppText style={styles.itemTitle}>
              {guidance.reflectionPrompt.title}
            </AppText>
            <MutedText style={styles.sectionBody}>
              {guidance.reflectionPrompt.prompt}
            </MutedText>
            {guidance.reflectionPrompt.followUp ? (
              <MutedText style={styles.followUp}>
                {guidance.reflectionPrompt.followUp}
              </MutedText>
            ) : null}
            {onJournalPrompt ? (
              <Button
                title="Journal this"
                variant="ghost"
                onPress={() => onJournalPrompt(guidance.reflectionPrompt)}
                style={styles.journalButton}
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Suggested practice</AppText>
            <AppText style={styles.itemTitle}>
              {guidance.suggestedPractice.title}
            </AppText>
            <MutedText style={styles.sectionBody}>
              {guidance.suggestedPractice.summary}
            </MutedText>
            {guidance.suggestedPractice.steps.map((step, index) => (
              <MutedText
                key={`${guidance.suggestedPractice.id}:${index}`}
                style={styles.practiceStep}
              >
                {index + 1}. {step}
              </MutedText>
            ))}
          </View>

          <Pressable
            accessibilityLabel="Collapse Today’s Energy details"
            accessibilityRole="button"
            accessibilityState={{ expanded: true }}
            onPress={() => setExpanded(false)}
            style={({ pressed }) => [
              styles.bottomToggle,
              pressed && styles.togglePressed,
            ]}
            testID="today-energy-bottom-collapse"
          >
            <MutedText style={styles.bottomToggleText}>
              Tap to collapse
            </MutedText>
          </Pressable>
        </>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  toggleSurface: {
    borderRadius: 4,
  },
  togglePressed: {
    opacity: 0.75,
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 10,
  },
  transitSigns: {
    fontSize: 12,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    marginTop: 12,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  followUp: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  practiceStep: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  journalButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bottomToggle: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
    paddingBottom: 8,
    width: '100%',
  },
  bottomToggleText: {
    fontSize: 12,
    lineHeight: 18,
  },
})
