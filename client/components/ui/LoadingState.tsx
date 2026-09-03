import type { ActivityIndicatorProps } from 'react-native'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { AppText } from './AppText'
import { theme } from './theme'
import { uiStyles } from './uiStyles'

type Props = {
  label?: string
  size?: ActivityIndicatorProps['size']
}

export function LoadingState({ label = 'Loading', size }: Props) {
  return (
    <View style={uiStyles.center}>
      <ActivityIndicator size={size} color={theme.accent.base} />
      <AppText
        accessibilityLabel={label}
        accessibilityLiveRegion="polite"
        numberOfLines={1}
        style={styles.label}
      >
        {label}...
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    ...theme.typography.bodySmall,
    color: theme.text.secondary,
    marginTop: theme.space.sm,
    minWidth: 160,
    paddingHorizontal: theme.space.sm,
    textAlign: 'center',
  },
})
