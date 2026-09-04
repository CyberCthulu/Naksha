//components/charts/ChartHeader.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '../ui/AppText'
import { ScreenHeader } from '../ui/ScreenHeader'
import { theme } from '../ui/theme'

type Props = {
  title?: string
  subtitleLocation?: string | null
  subtitleZone?: string | null
  subtitleCoords?: string
  onBack: () => void
}

/**
 * Chart identity: the screen header plus the birth context that names this
 * particular chart. The same data as before, but split onto its own lines so a
 * long place name wraps instead of forming one dense centred run-on.
 */
export default function ChartHeader({
  title = 'Natal Chart',
  subtitleLocation,
  subtitleZone,
  subtitleCoords = '',
  onBack,
}: Props) {
  const coords = subtitleCoords.trim().replace(/^\(|\)$/g, '')

  return (
    <>
      <ScreenHeader title={title} onBack={onBack} />

      {subtitleLocation || subtitleZone ? (
        <View style={styles.identity}>
          {subtitleLocation ? (
            <AppText variant="body" style={styles.place}>
              {subtitleLocation}
            </AppText>
          ) : null}

          {subtitleZone ? (
            <AppText variant="caption" style={styles.meta}>
              {subtitleZone}
            </AppText>
          ) : null}

          {coords ? (
            <AppText variant="numeric" style={styles.coords}>
              {coords}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    marginTop: theme.space.xs,
    marginBottom: theme.space.lg,
    paddingHorizontal: theme.space.md,
  },
  place: {
    color: theme.text.secondary,
    textAlign: 'center',
  },
  meta: {
    color: theme.text.tertiary,
    marginTop: theme.space.hair,
    textAlign: 'center',
  },
  coords: {
    color: theme.text.tertiary,
    fontSize: 12,
    marginTop: theme.space.hair,
    textAlign: 'center',
  },
})
