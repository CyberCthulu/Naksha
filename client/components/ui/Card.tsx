// components/ui/Card.tsx
import React from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { theme } from './theme'

export type CardVariant = 'default' | 'raised' | 'selected'

type Props = {
  children: React.ReactNode
  variant?: CardVariant
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * The single card implementation. Translucency belongs to the background fill,
 * leaving text and controls fully opaque. Depth comes from lightness and a
 * hairline border, with no blur or shadow layers.
 */
export function Card({
  children,
  variant = 'default',
  style,
  testID,
}: Props) {
  return (
    <View testID={testID} style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
  },
})

const variantStyles = StyleSheet.create({
  default: {
    ...theme.elevation.level1,
    backgroundColor: theme.cardSurface.base,
  },
  raised: {
    ...theme.elevation.level2,
    backgroundColor: theme.cardSurface.raised,
  },
  selected: {
    ...theme.elevation.level3,
    backgroundColor: theme.cardSurface.selected,
  },
})
