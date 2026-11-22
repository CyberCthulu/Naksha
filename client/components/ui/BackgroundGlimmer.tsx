import { Animated, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

import { theme } from './theme'
import { useBackgroundMotion } from './useBackgroundMotion'

type Props = {
  width: number
  height: number
  gradientId: string
  stars: readonly { x: number; y: number; r: number }[]
  enabled: boolean
}

/** One native opacity animation over a small, fixed set of star highlights. */
export function BackgroundGlimmer({
  width,
  height,
  gradientId,
  stars,
  enabled,
}: Props) {
  const opacity = useBackgroundMotion(enabled)

  return (
    <Animated.View
      testID="background-glimmer"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // Cache the static SVG while compositing its opacity. No star geometry
      // or React state changes per frame; release the cache on hidden routes.
      renderToHardwareTextureAndroid={enabled}
      shouldRasterizeIOS={enabled}
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          <RadialGradient id={gradientId}>
            <Stop offset="0" stopColor={theme.atmosphere.star} stopOpacity="0.20" />
            <Stop offset="0.3" stopColor={theme.atmosphere.star} stopOpacity="0.06" />
            <Stop offset="1" stopColor={theme.atmosphere.star} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {stars.map((star, index) => (
          <Circle
            key={`halo-${index}`}
            cx={star.x * width}
            cy={star.y * height}
            r={star.r * 6}
            fill={`url(#${gradientId})`}
          />
        ))}
        {stars.map((star, index) => (
          <Circle
            key={`core-${index}`}
            testID="background-glimmer-star"
            cx={star.x * width}
            cy={star.y * height}
            r={star.r}
            fill={theme.text.primary}
            opacity={0.35}
          />
        ))}
      </Svg>
    </Animated.View>
  )
}
