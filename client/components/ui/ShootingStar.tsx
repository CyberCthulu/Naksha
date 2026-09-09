import { useId } from 'react'
import { Animated, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { theme } from './theme'
import { useShootingStar } from './useShootingStar'

type Props = {
  width: number
  height: number
  enabled: boolean
}

/** A single small, static streak is composited by the native animation driver. */
export function ShootingStar({ width, height, enabled }: Props) {
  const id = useId().replace(/:/g, '')
  const tailId = `shooting-star-tail-${id}`
  const { opacity, translateX, translateY } = useShootingStar(enabled, width, height)

  return (
    <Animated.View
      testID="background-shooting-star"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      renderToHardwareTextureAndroid={enabled}
      shouldRasterizeIOS={enabled}
      style={[
        styles.streak,
        { opacity, transform: [{ translateX }, { translateY }] },
      ]}
    >
      <Svg width={112} height={58} viewBox="0 0 112 58" pointerEvents="none">
        <Defs>
          <LinearGradient id={tailId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor={theme.atmosphere.star} stopOpacity="0" />
            <Stop offset="0.55" stopColor={theme.atmosphere.star} stopOpacity="0.25" />
            <Stop offset="1" stopColor={theme.text.primary} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>
        <Path
          d="M 3 5 L 104 47.8 Q 110 51.2 104 54.6 Z"
          fill={`url(#${tailId})`}
          opacity={0.16}
        />
        <Path
          d="M 3 5 L 105 50.2 Q 108 51.2 105 52.2 Z"
          fill={`url(#${tailId})`}
        />
        <Circle cx={105.7} cy={51.2} r={3.2} fill={theme.atmosphere.star} opacity={0.09} />
        <Circle cx={105.7} cy={51.2} r={1.2} fill={theme.text.primary} />
        <Circle cx={105.7} cy={51.2} r={0.55} fill={theme.accent.bright} opacity={0.55} />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  streak: { position: 'absolute', top: 0, left: 0, width: 112, height: 58 },
})
