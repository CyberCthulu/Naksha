import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

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
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

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
      <AppText style={styles.itemTitle}>
        {transit.transitPlanet} {ASPECT_LABELS[transit.aspect]} natal{' '}
        {transit.natalPlanet}
      </AppText>
      <MutedText style={styles.body}>
        {formatDate(transit.date)} | {transit.orb.toFixed(1)}° orb
      </MutedText>
      {transit.activeDays > 1 ? (
        <MutedText style={styles.persistence}>
          Active on {transit.activeDays} of 7 sampled days
        </MutedText>
      ) : null}
    </View>
  )
}

export function WeeklyForecastCard({
  forecast,
  onJournalReflection,
}: {
  forecast: WeeklyForecast
  onJournalReflection?: (
    prompt: ReflectionPrompt,
    practice: SuggestedPractice
  ) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const topTheme = forecast.weeklyThemes[0]
  const topTransit = forecast.strongestTransits[0]
  const reflectionPrompt = forecast.representativePrompt
  const reflectionPractice = forecast.representativePractice

  return (
    <Card>
      <Pressable
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} Weekly Forecast details`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.toggleSurface,
          pressed && styles.togglePressed,
        ]}
      >
        <AppText style={uiStyles.cardTitle}>Weekly Forecast</AppText>
        <MutedText style={styles.dateRange}>
          {formatDate(forecast.startDate)} - {formatDate(forecast.endDate)}
        </MutedText>

        {!expanded ? (
          <>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Weekly pattern</AppText>
              {topTheme ? (
                <View style={styles.listItem}>
                  <AppText style={styles.itemTitle}>
                    {topTheme.title}
                  </AppText>
                  <MutedText numberOfLines={2} style={styles.body}>
                    {topTheme.body}
                  </MutedText>
                </View>
              ) : (
                <MutedText style={styles.body}>
                  Weekly theme unavailable.
                </MutedText>
              )}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>
                Strongest transit
              </AppText>
              {topTransit ? (
                <TransitHighlight transit={topTransit} />
              ) : (
                <MutedText style={styles.body}>
                  No tight personal transit highlights this week.
                </MutedText>
              )}
            </View>
          </>
        ) : null}

        <MutedText style={styles.toggleHint}>
          {expanded ? 'Tap to collapse' : 'Tap to expand'}
        </MutedText>
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Weekly pattern</AppText>
            {forecast.weeklyThemes.map((theme) => (
              <View
                key={`${theme.tone}:${theme.title}`}
                style={styles.listItem}
              >
                <AppText style={styles.itemTitle}>{theme.title}</AppText>
                <MutedText style={styles.body}>{theme.body}</MutedText>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Daily rhythm</AppText>
            {forecast.dailyThemes.map((day) => (
              <View
                key={day.date}
                style={styles.rhythmRow}
                testID={`weekly-rhythm-${day.date}`}
              >
                <AppText style={styles.rhythmDay}>
                  {formatWeekday(day.date)}
                </AppText>
                <View style={styles.rhythmContent}>
                  <AppText numberOfLines={1} style={styles.rhythmTheme}>
                    {day.title}
                  </AppText>
                  <MutedText
                    numberOfLines={1}
                    style={styles.rhythmSummary}
                  >
                    {day.summary}
                  </MutedText>
                  {day.transitHouse ? (
                    <MutedText
                      numberOfLines={1}
                      style={styles.rhythmHouse}
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
            <AppText style={styles.sectionTitle}>
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
              <MutedText style={styles.body}>
                No tight personal transit highlights this week.
              </MutedText>
            )}
          </View>

          {reflectionPrompt && reflectionPractice ? (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Weekly reflection</AppText>
              <AppText style={styles.itemTitle}>
                {reflectionPrompt.title}
              </AppText>
              <MutedText style={styles.body}>
                {reflectionPrompt.prompt}
              </MutedText>
              {reflectionPrompt.followUp ? (
                <MutedText style={styles.followUp}>
                  {reflectionPrompt.followUp}
                </MutedText>
              ) : null}
              <MutedText style={styles.deeperFraming}>
                Deeper layer: notice what repeated across the week and
                what may be easy to avoid. Use this as reflection, not a
                diagnosis. Pause if it feels overwhelming.
              </MutedText>
              <AppText style={styles.practiceTitle}>Grounding practice</AppText>
              <AppText style={styles.itemTitle}>
                {reflectionPractice.title}
              </AppText>
              <MutedText style={styles.body}>
                {reflectionPractice.summary}
              </MutedText>
              {reflectionPractice.steps.map((step, index) => (
                <MutedText
                  key={`${reflectionPractice.id}:${index}`}
                  style={styles.practiceStep}
                >
                  {index + 1}. {step}
                </MutedText>
              ))}
              {onJournalReflection ? (
                <Button
                  title="Journal weekly reflection"
                  variant="ghost"
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

          <Pressable
            accessibilityLabel="Collapse Weekly Forecast details"
            accessibilityRole="button"
            accessibilityState={{ expanded: true }}
            onPress={() => setExpanded(false)}
            style={({ pressed }) => [
              styles.bottomToggle,
              pressed && styles.togglePressed,
            ]}
            testID="weekly-forecast-bottom-collapse"
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
  dateRange: {
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
    marginBottom: 2,
  },
  listItem: {
    marginTop: 7,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  persistence: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  rhythmRow: {
    flexDirection: 'row',
    marginTop: 9,
    minHeight: 36,
  },
  rhythmDay: {
    fontSize: 13,
    fontWeight: '600',
    width: 38,
  },
  rhythmContent: {
    flex: 1,
  },
  rhythmTheme: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  rhythmSummary: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  rhythmHouse: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  followUp: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  deeperFraming: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  practiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    marginTop: 10,
  },
  practiceStep: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  journalButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  bottomToggle: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
  },
  bottomToggleText: {
    fontSize: 12,
    lineHeight: 18,
  },
})
