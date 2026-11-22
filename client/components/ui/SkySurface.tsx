import React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'

import { Background } from './Background'
import { theme } from './theme'

/** A panel's own opaque sky, keeping content behind the panel out of view. */
export function SkySurface({ children, style, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.surface, style]}>
      <View
        testID="sky-surface-decoration"
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Background
          variant="atmospheric"
          motionEnabled={false}
          protectSystemBars={false}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: theme.background.base,
  },
})
