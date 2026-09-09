import { StyleSheet, View } from 'react-native'

import type {
  WeeklyForecast,
  WeeklyTransitHighlight,
} from '../../lib/guidance'
import type {
  ReflectionPrompt,
  SuggestedPractice,
} from '../../lib/lexicon/guidance'
import { AppText, MutedText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { theme } from '../ui/theme'
import { GuidanceCard } from './GuidanceCard'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const ASPECT_LABELS: Record<
  WeeklyTransitHighlight['aspect'],
  string
> = {
  conj: 'conjunct',
  opp: 'opposite',
  trine: 'trine',
  square: 'square',
  sextile: 'sextile',
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  const monthName = MONTHS[month - 1]

  if (!year || !monthName || !day) return value
  return `${monthName} ${day}, ${year}`
}

function formatWeekday(value: string): string {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return value
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ]
}

function TransitHighlight({
  transit,
}: {
  transit: WeeklyTransitHighlight
}) {
  return (
    <View style={styles.listItem}>
      <AppText variant="subheading" style={styles.itemTitle}>
        {transit.transitPlanet} {ASPECT_LABELS[transit.aspect]} natal{' '}
        {transit.natalPlanet}
      </AppText>
      <MutedText variant="bodySmall" style={styles.body}>
        {formatDate(transit.date)} | {transit.orb.toFixed(1)}° orb
      </MutedText>
      {transit.activeDays > 1 ? (
        <MutedText variant="caption" style={styles.persistence}>
          Active on {transit.activeDays} of 7 sampled days
        </MutedText>
      ) : null}
    </View>
  )
}

/** Expansion is owned by the Dashboard -- see the note on TodayEnergyCard. */
export function WeeklyForecastCard({
  forecast,
  expanded,
  onExpandedChange,
  onJournalReflection,
}: {
  forecast: WeeklyForecast
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  onJournalReflection?: (
    prompt: ReflectionPrompt,
    practice: SuggestedPractice
  ) => void
}) {
  const topTheme = forecast.weeklyThemes[0]
  const topTransit = forecast.strongestTransits[0]
  const reflectionPrompt = forecast.representativePrompt
  const reflectionPractice = forecast.representativePractice

  return (
    <GuidanceCard
      title="Weekly Forecast"
      metadata={`${formatDate(forecast.startDate)} - ${formatDate(forecast.endDate)}`}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      testID="weekly-forecast"
    >
      {!expanded ? (
        <>
          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Weekly pattern
            </AppText>
            {topTheme ? (
              <View style={styles.listItem}>
                <AppText variant="subheading" style={styles.itemTitle}>
                  {topTheme.title}
                </AppText>
                <MutedText
                  variant="body"
                  numberOfLines={2}
                  style={styles.body}
                >
                  {topTheme.body}
                </MutedText>
              </View>
            ) : (
              <MutedText variant="body" style={styles.body}>
                Weekly theme unavailable.
              </MutedText>
            )}
          </View>

          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Strongest transit
            </AppText>
            {topTransit ? (
              <TransitHighlight transit={topTransit} />
            ) : (
              <MutedText variant="body" style={styles.body}>
                No tight personal transit highlights this week.
              </MutedText>
            )}
          </View>
        </>
      ) : null}

      {expanded ? (
        <>
          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Weekly pattern
            </AppText>
            {forecast.weeklyThemes.map((theme) => (
              <View
                key={`${theme.tone}:${theme.title}`}
                style={styles.listItem}
              >
                <AppText variant="subheading" style={styles.itemTitle}>
                  {theme.title}
                </AppText>
                <MutedText variant="body" style={styles.body}>
                  {theme.body}
                </MutedText>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Daily rhythm
            </AppText>
            {forecast.dailyThemes.map((day) => (
              <View
                key={day.date}
                style={styles.rhythmRow}
                testID={`weekly-rhythm-${day.date}`}
              >
                <AppText variant="subheading" style={styles.rhythmDay}>
                  {formatWeekday(day.date)}
                </AppText>
                <View style={styles.rhythmContent}>
                  <AppText variant="subheading" style={styles.rhythmTheme}>
                    {day.title}
                  </AppText>
                  <MutedText variant="bodySmall" style={styles.rhythmSummary}>
                    {day.summary}
                  </MutedText>
                  {day.transitHouse ? (
                    <MutedText
                      variant="bodySmall"
                      style={styles.rhythmHouse}
                      testID={`weekly-rhythm-house-${day.date}`}
                    >
                      House {day.transitHouse.house} ·{' '}
                      {day.transitHouse.guidance.focus}
                    </MutedText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <AppText variant="subheading" style={styles.sectionTitle}>
              Underlying transits
            </AppText>
            {forecast.strongestTransits.length > 0 ? (
              forecast.strongestTransits.map((transit) => (
                <TransitHighlight
                  key={`${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}`}
                  transit={transit}
                />
              ))
            ) : (
              <MutedText variant="body" style={styles.body}>
                No tight personal transit highlights this week.
              </MutedText>
            )}
          </View>

          {reflectionPrompt && reflectionPractice ? (
            <View style={[styles.section, styles.majorBreak]}>
              <AppText variant="subheading" style={styles.sectionTitle}>
                Weekly reflection
              </AppText>
              <AppText variant="subheading" style={styles.itemTitle}>
                {reflectionPrompt.title}
              </AppText>
              <MutedText variant="body" style={styles.body}>
                {reflectionPrompt.prompt}
              </MutedText>
              {reflectionPrompt.followUp ? (
                <MutedText variant="body" style={styles.followUp}>
                  {reflectionPrompt.followUp}
                </MutedText>
              ) : null}
              <MutedText variant="body" style={styles.deeperFraming}>
                Deeper layer: notice what repeated across the week and
                what may be easy to avoid. Use this as reflection, not a
                diagnosis. Pause if it feels overwhelming.
              </MutedText>
              <AppText variant="subheading" style={styles.practiceTitle}>
                Grounding practice
              </AppText>
              <AppText variant="subheading" style={styles.itemTitle}>
                {reflectionPractice.title}
              </AppText>
              <MutedText variant="body" style={styles.body}>
                {reflectionPractice.summary}
              </MutedText>
              {reflectionPractice.steps.map((step, index) => (
                <MutedText
                  variant="body"
                  key={`${reflectionPractice.id}:${index}`}
                  style={styles.practiceStep}
                >
                  {index + 1}. {step}
                </MutedText>
              ))}
              {onJournalReflection ? (
                <Button
                  title="Journal weekly reflection"
                  variant="tertiary"
                  onPress={() =>
                    onJournalReflection(
                      reflectionPrompt,
                      reflectionPractice
                    )
                  }
                  style={styles.journalButton}
                />
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </GuidanceCard>
  )
}

const styles = StyleSheet.create({
  /* Spacing-led rhythm -- see the note on TodayEnergyCard. */
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
  listItem: {
    marginTop: theme.space.sm,
  },
  itemTitle: {
    color: theme.text.primary,
    marginBottom: theme.space.hair,
  },
  body: {
    color: theme.text.secondary,
  },
  persistence: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
  },
  /*
   * The weekday column is sized by its own content rather than pinned to 38.
   * A fixed column clips "Wed" the moment the device font scale grows, and a
   * three-letter label in one face varies by only a couple of points anyway.
   */
  rhythmRow: {
    flexDirection: 'row',
    columnGap: theme.space.md,
    marginTop: theme.space.md,
  },
  rhythmDay: {
    color: theme.text.tertiary,
  },
  rhythmContent: {
    flex: 1,
  },
  rhythmTheme: {
    color: theme.text.primary,
  },
  rhythmSummary: {
    color: theme.text.secondary,
    marginTop: theme.space.hair,
  },
  rhythmHouse: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
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
