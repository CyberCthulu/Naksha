import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import type {
  WeeklyForecast,
  WeeklyTransitHighlight,
} from '../../lib/guidance'
import type { ReflectionPrompt } from '../../lib/lexicon/guidance'
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
    </View>
  )
}

export function WeeklyForecastCard({
  forecast,
  onJournalPrompt,
}: {
  forecast: WeeklyForecast
  onJournalPrompt?: (prompt: ReflectionPrompt) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const topTheme = forecast.weeklyThemes[0]
  const topTransit = forecast.strongestTransits[0]

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
              <AppText style={styles.sectionTitle}>Top theme</AppText>
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
              <AppText style={styles.sectionTitle}>Top transit</AppText>
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
            <AppText style={styles.sectionTitle}>Weekly themes</AppText>
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
            <AppText style={styles.sectionTitle}>Strongest transits</AppText>
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

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Journal prompts</AppText>
            {forecast.journalPrompts.map((prompt) => (
              <View key={prompt.id} style={styles.listItem}>
                <AppText style={styles.itemTitle}>{prompt.title}</AppText>
                <MutedText style={styles.body}>{prompt.prompt}</MutedText>
                {onJournalPrompt ? (
                  <Button
                    title="Journal this"
                    variant="ghost"
                    onPress={() => onJournalPrompt(prompt)}
                    style={styles.journalButton}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>
              Suggested practices
            </AppText>
            {forecast.suggestions.map((practice) => (
              <View key={practice.id} style={styles.listItem}>
                <AppText style={styles.itemTitle}>{practice.title}</AppText>
                <MutedText style={styles.body}>{practice.summary}</MutedText>
              </View>
            ))}
          </View>

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
