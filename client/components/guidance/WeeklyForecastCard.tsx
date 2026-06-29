import { StyleSheet, View } from 'react-native'

import type {
  WeeklyForecast,
  WeeklyTransitHighlight,
} from '../../lib/guidance'
import { AppText, MutedText } from '../ui/AppText'
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

export function WeeklyForecastCard({
  forecast,
}: {
  forecast: WeeklyForecast
}) {
  return (
    <Card>
      <AppText style={uiStyles.cardTitle}>Weekly Forecast</AppText>
      <MutedText style={styles.dateRange}>
        {formatDate(forecast.startDate)} - {formatDate(forecast.endDate)}
      </MutedText>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Weekly themes</AppText>
        {forecast.weeklyThemes.map((theme) => (
          <View key={`${theme.tone}:${theme.title}`} style={styles.listItem}>
            <AppText style={styles.itemTitle}>{theme.title}</AppText>
            <MutedText style={styles.body}>{theme.body}</MutedText>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Strongest transits</AppText>
        {forecast.strongestTransits.length > 0 ? (
          forecast.strongestTransits.map((transit) => (
            <View
              key={`${transit.transitPlanet}:${transit.aspect}:${transit.natalPlanet}`}
              style={styles.listItem}
            >
              <AppText style={styles.itemTitle}>
                {transit.transitPlanet} {ASPECT_LABELS[transit.aspect]} natal{' '}
                {transit.natalPlanet}
              </AppText>
              <MutedText style={styles.body}>
                {formatDate(transit.date)} | {transit.orb.toFixed(1)}° orb
              </MutedText>
            </View>
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
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Suggested practices</AppText>
        {forecast.suggestions.map((practice) => (
          <View key={practice.id} style={styles.listItem}>
            <AppText style={styles.itemTitle}>{practice.title}</AppText>
            <MutedText style={styles.body}>{practice.summary}</MutedText>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
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
})
