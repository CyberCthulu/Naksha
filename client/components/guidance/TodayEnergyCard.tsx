import { StyleSheet, View } from 'react-native'

import type {
  DailyGuidance,
  DailyGuidanceSection,
} from '../../lib/guidance'
import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

function GuidanceSection({
  section,
}: {
  section: DailyGuidanceSection
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{section.title}</AppText>
      <MutedText style={styles.sectionBody}>{section.body}</MutedText>
    </View>
  )
}

export function TodayEnergyCard({
  guidance,
}: {
  guidance: DailyGuidance
}) {
  return (
    <Card>
      <AppText style={uiStyles.cardTitle}>Today’s Energy</AppText>
      <MutedText style={styles.transitSigns}>
        Moon in {guidance.transitMoonSign ?? 'Unknown'} | Sun in{' '}
        {guidance.transitSunSign ?? 'Unknown'}
      </MutedText>

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
    </Card>
  )
}

const styles = StyleSheet.create({
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
})
