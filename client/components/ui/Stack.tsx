// components/ui/Stack.tsx
import React from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { theme } from './theme'

export type StackGap = keyof typeof theme.space

type Props = {
  children: React.ReactNode
  /** Semantic spacing token. Defaults to `md`. */
  gap?: StackGap
  /** Lay children out in a row instead of a column. */
  row?: boolean
  align?: ViewStyle['alignItems']
  justify?: ViewStyle['justifyContent']
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Deliberately narrow: a direction, a semantic gap, and alignment.
 *
 * It exists to retire the `<View style={{ height: 8 }} />` spacer idiom, not to
 * become a layout framework. Anything more specific belongs in the component
 * that needs it.
 */
export function Stack({
  children,
  gap = 'md',
  row = false,
  align,
  justify,
  style,
  testID,
}: Props) {
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: row ? 'row' : 'column',
          gap: theme.space[gap],
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
