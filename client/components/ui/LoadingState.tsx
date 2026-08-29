import type { ActivityIndicatorProps } from 'react-native'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { AppText } from './AppText'
import { uiStyles } from './uiStyles'

type Props = {
  label?: string
  size?: ActivityIndicatorProps['size']
}

export function LoadingState({ label = 'Loading', size }: Props) {
  return (
    <View style={uiStyles.center}>
      <ActivityIndicator size={size} />
      <AppText
        accessibilityLabel={label}
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
    lineHeight: 20,
    marginTop: 8,
    minWidth: 160,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
})
