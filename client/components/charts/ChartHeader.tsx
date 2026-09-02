//components/charts/ChartHeader.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { theme } from '../ui/theme'
import { uiStyles } from '../ui/uiStyles'

type Props = {
  title?: string
  subtitleLocation?: string | null
  subtitleZone?: string | null
  subtitleCoords?: string
  sunTitle?: string | null
  sunShortMeaning?: string | null
  onBack: () => void
}

export default function ChartHeader({
  title = 'Natal Chart',
  subtitleLocation,
  subtitleZone,
  subtitleCoords = '',
  sunTitle,
  sunShortMeaning,
  onBack,
}: Props) {
  return (
    <>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>{title}</Text>

        <View style={styles.rightSlot} />
      </View>

      {(subtitleLocation || subtitleZone) && (
        <Text style={styles.subtitle}>
          {subtitleLocation ? `${subtitleLocation}` : ''}
          {subtitleLocation && subtitleZone ? ' · ' : ''}
          {subtitleZone}
          {subtitleCoords}
        </Text>
      )}

      {!!sunShortMeaning && !!sunTitle && (
        <View style={[uiStyles.card, { alignItems: 'center' }]}>
          <Text style={[uiStyles.cardTitle, { textAlign: 'center' }]}>
            {sunTitle}
          </Text>
          <Text style={[uiStyles.text, { opacity: 0.9, textAlign: 'center' }]}>
            {sunShortMeaning}
          </Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  rightSlot: {
    width: 56,
  },
  subtitle: {
    color: theme.colors.sub,
    textAlign: 'center',
    marginBottom: 10,
  },
})