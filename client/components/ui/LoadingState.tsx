import { StyleSheet, View } from 'react-native'

import { AppText } from './AppText'
import { CelestialLoader } from './CelestialLoader'
import { theme } from './theme'
import { uiStyles } from './uiStyles'

type Props = {
  label?: string
  size?: 'small' | 'large' | number
}

export function LoadingState({ label = 'Loading', size }: Props) {
  const emblemSize = typeof size === 'number'
    ? size
    : size === 'small'
      ? 56
      : size === 'large'
        ? 112
        : 96

  return (
    <View
      style={uiStyles.center}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
    >
      <CelestialLoader size={emblemSize} />
      <AppText
        variant="bodySmall"
        accessible={false}
        style={styles.label}
      >
        {label}…
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    color: theme.text.secondary,
    marginTop: theme.space.lg,
    maxWidth: 320,
    paddingHorizontal: theme.space.sm,
    textAlign: 'center',
  },
})
