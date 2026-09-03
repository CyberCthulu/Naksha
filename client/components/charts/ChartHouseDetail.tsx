// components/charts/ChartHouseDetail.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { theme } from '../ui/theme'

type Props = {
  house: number
  signName: string
  summary?: string | null
  onOpen?: () => void
  testID?: string
}

/**
 * Explanation for a house selected on the wheel.
 *
 * Sits in the same slot as the placement and aspect explanations, so only one
 * is ever on screen and none of them covers the chart. Everything shown comes
 * from existing chart data and lexicon content.
 */
export function ChartHouseDetail({
  house,
  signName,
  summary,
  onOpen,
  testID,
}: Props) {
  return (
    <View testID={testID} style={styles.detail}>
      <AppText variant="eyebrow" style={styles.eyebrow}>
        Life area
      </AppText>

      <AppText key={`house-${house}`} variant="display" style={styles.title}>
        {`House ${house}`}
      </AppText>

      <AppText variant="bodySmall" style={styles.sign}>
        {signName}
      </AppText>

      {summary ? (
        <AppText variant="bodyLarge" style={styles.summary}>
          {summary}
        </AppText>
      ) : null}

      {onOpen ? (
        <Button
          testID="chart-house-open"
          title="Read full interpretation"
          variant="tertiary"
          onPress={onOpen}
          style={styles.action}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  detail: {
    alignItems: 'center',
    marginTop: theme.space.xl,
    paddingHorizontal: theme.space.sm,
  },
  eyebrow: { color: theme.accent.base },
  title: { color: theme.text.primary, textAlign: 'center' },
  sign: { color: theme.accent.base, marginTop: theme.space.hair },
  summary: {
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  action: { marginTop: theme.space.sm },
})
