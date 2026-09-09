import { StyleSheet, View } from 'react-native'

import type {
  DailyGuidance,
  DailyGuidanceSection,
} from '../../lib/guidance'
import type {
  ReflectionPrompt,
  SuggestedPractice,
} from '../../lib/lexicon/guidance'
import { AppText, MutedText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { theme } from '../ui/theme'
import { GuidanceCard } from './GuidanceCard'

function GuidanceSection({
  section,
  numberOfLines,
}: {
  section: DailyGuidanceSection
  numberOfLines?: number
}) {
  return (
    <View style={styles.section}>
      <AppText variant="subheading" style={styles.sectionTitle}>
        {section.title}
      </AppText>
      <MutedText
        variant="body"
        numberOfLines={numberOfLines}
        style={styles.sectionBody}
      >
        {section.body}
      </MutedText>
    </View>
  )
}

/**
 * Expansion is owned by the Dashboard, not by the card.
 *
 * Only one guidance surface is on screen at a time, so the inactive card is
 * not rendered at all -- which is what keeps it out of the layout and out of
 * TalkBack's reach without hiding a live subtree. That makes local `useState`
 * the wrong home for the flag: unmounting would drop it, and a reader who
 * expanded Today, looked at This Week and came back would find it collapsed.
 */
export function TodayEnergyCard({
  guidance,
  expanded,
  onExpandedChange,
  onJournalReflection,
}: {
  guidance: DailyGuidance
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  onJournalReflection?: (
    prompt: ReflectionPrompt,
    practice: SuggestedPractice
  ) => void
}) {
  return (
    <GuidanceCard
      title="Today’s Energy"
      motif="sun"
      metadata={`Moon in ${guidance.transitMoonSign ?? 'Unknown'} | Sun in ${guidance.transitSunSign ?? 'Unknown'}`}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      testID="today-energy"
    >
      {!expanded ? (
        <>
          <GuidanceSection section={guidance.mood} numberOfLines={2} />
          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              {guidance.transitSummary.title}
            </AppText>
            <MutedText
              variant="body"
              numberOfLines={2}
              style={styles.sectionBody}
            >
              {guidance.transitSummary.body}
            </MutedText>
          </View>
        </>
      ) : null}

      {expanded ? (
        <>
          <GuidanceSection section={guidance.mood} />
          <GuidanceSection section={guidance.warning} />
          <GuidanceSection section={guidance.opportunity} />
          <GuidanceSection section={guidance.transitSummary} />

          {guidance.transitHouse ? (
            <View style={styles.section}>
              <AppText variant="subheading" style={styles.sectionTitle}>
                Life area
              </AppText>
              <AppText variant="subheading" style={styles.itemTitle}>
                House {guidance.transitHouse.house}
              </AppText>
              <MutedText variant="body" style={styles.sectionBody}>
                {guidance.transitHouse.guidance.focus}
              </MutedText>
            </View>
          ) : null}

          <View style={[styles.section, styles.majorBreak]}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Reflection
            </AppText>
            <AppText variant="subheading" style={styles.itemTitle}>
              {guidance.reflectionPrompt.title}
            </AppText>
            <MutedText variant="body" style={styles.sectionBody}>
              {guidance.reflectionPrompt.prompt}
            </MutedText>
            {guidance.reflectionPrompt.followUp ? (
              <MutedText variant="body" style={styles.followUp}>
                {guidance.reflectionPrompt.followUp}
              </MutedText>
            ) : null}
            <MutedText variant="body" style={styles.deeperFraming}>
              Deeper layer: notice what feels uncomfortable, repetitive,
              or easy to avoid. Use this as reflection, not a diagnosis.
              Pause if it feels overwhelming.
            </MutedText>
            <AppText variant="subheading" style={styles.practiceTitle}>
              Grounding practice
            </AppText>
            <AppText variant="subheading" style={styles.itemTitle}>
              {guidance.suggestedPractice.title}
            </AppText>
            <MutedText variant="body" style={styles.sectionBody}>
              {guidance.suggestedPractice.summary}
            </MutedText>
            {guidance.suggestedPractice.steps.map((step, index) => (
              <MutedText
                variant="body"
                key={`${guidance.suggestedPractice.id}:${index}`}
                style={styles.practiceStep}
              >
                {index + 1}. {step}
              </MutedText>
            ))}
            {onJournalReflection ? (
              <Button
                title="Journal this reflection"
                variant="tertiary"
                onPress={() =>
                  onJournalReflection(
                    guidance.reflectionPrompt,
                    guidance.suggestedPractice
                  )
                }
                style={styles.journalButton}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </GuidanceCard>
  )
}

const styles = StyleSheet.create({
  /*
   * Spacing-led rhythm. Every section used to carry its own hairline rule,
   * which drew a grid over what is meant to read as continuous guidance.
   * Rules are now reserved for genuine boundaries.
   */
  section: {
    marginTop: theme.space.lg,
  },
  majorBreak: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border.base,
    paddingTop: theme.space.lg,
  },
  sectionTitle: {
    color: theme.text.primary,
    marginBottom: theme.space.xs,
  },
  sectionBody: {
    color: theme.text.secondary,
  },
  itemTitle: {
    color: theme.text.primary,
    marginBottom: theme.space.hair,
  },
  followUp: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
  },
  deeperFraming: {
    color: theme.text.tertiary,
    marginTop: theme.space.md,
  },
  practiceTitle: {
    color: theme.text.primary,
    marginBottom: theme.space.xs,
    marginTop: theme.space.lg,
  },
  practiceStep: {
    color: theme.text.secondary,
    marginTop: theme.space.xs,
  },
  journalButton: {
    marginTop: theme.space.md,
    alignSelf: 'flex-start',
  },
})
