//components/charts/ChartHeader.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ScreenHeader } from '../ui/ScreenHeader'
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
      <ScreenHeader title={title} onBack={onBack} />

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
  subtitle: {
    color: theme.colors.sub,
    textAlign: 'center',
    marginBottom: 10,
  },
})