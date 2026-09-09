import { useId, useMemo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg'

import { theme } from './theme'
import { useCosmicMotion } from './useCosmicMotion'

type Props = {
  width: number
  height: number
  enabled: boolean
  /** Scale the decorative light; use a lower value on quieter screens. */
  intensity?: number
  /** One journey in each direction; the whole cycle is twice this duration. */
  halfCycleMs?: number
  /** Maximum movement in layout pixels. */
  driftDistance?: number
}

/**
 * Two soft, static cloud textures drift and crossfade on the native thread.
 * Moving overlapping blue, plum, and teal light shifts the perceived color;
 * no SVG paint, geometry, or React state changes on animation frames.
 */
export function CosmicSky({
  width,
  height,
  enabled,
  intensity = 1,
  halfCycleMs = 24000,
  driftDistance = 24,
}: Props) {
  const gradientId = `cosmic-sky-${useId().replace(/:/g, '')}`
  const validSize = width > 0 && height > 0
  const strength = Math.max(0, Math.min(1, intensity))
  const phase = useCosmicMotion(enabled && validSize && strength > 0, halfCycleMs)
  const distance = Math.max(0, Math.min(driftDistance, width * 0.1))
  const motion = useMemo(() => ({
    plumOpacity: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [0.62 * strength, strength],
    }),
    plumX: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [-distance * 0.5, distance * 0.5],
    }),
    plumY: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [0, distance * 0.75],
    }),
    tealOpacity: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [strength, 0.55 * strength],
    }),
    tealX: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [distance * 0.45, -distance * 0.45],
    }),
    tealY: phase.interpolate({
      inputRange: [0, 1],
      outputRange: [distance * 0.5, -distance * 0.5],
    }),
  }), [distance, phase, strength])

  if (!validSize || strength === 0) return null

  const cloudWidth = width * 1.35
  const cloudHeight = height * 0.68

  return (
    <View
      testID="background-cosmic-sky"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        testID="background-cosmic-plum"
        pointerEvents="none"
        renderToHardwareTextureAndroid={enabled}
        shouldRasterizeIOS={enabled}
        style={{
          position: 'absolute',
          left: -width * 0.22,
          top: -height * 0.015,
          width: cloudWidth,
          height: cloudHeight,
          opacity: motion.plumOpacity,
          transform: [{ translateX: motion.plumX }, { translateY: motion.plumY }],
        }}
      >
        <Svg width={cloudWidth} height={cloudHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={`${gradientId}-plum`}>
              <Stop offset="0" stopColor={theme.atmosphere.nebula} stopOpacity={0.42} />
              <Stop offset="0.42" stopColor={theme.atmosphere.nebula} stopOpacity={0.21} />
              <Stop offset="1" stopColor={theme.atmosphere.nebula} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${gradientId}-blue`}>
              <Stop offset="0" stopColor={theme.atmosphere.haze} stopOpacity={0.28} />
              <Stop offset="0.5" stopColor={theme.atmosphere.haze} stopOpacity={0.1} />
              <Stop offset="1" stopColor={theme.atmosphere.haze} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={47} cy={48} rx={46} ry={46} fill={`url(#${gradientId}-plum)`} />
          <Ellipse cx={65} cy={55} rx={33} ry={39} fill={`url(#${gradientId}-blue)`} />
        </Svg>
      </Animated.View>
      <Animated.View
        testID="background-cosmic-teal"
        pointerEvents="none"
        renderToHardwareTextureAndroid={enabled}
        shouldRasterizeIOS={enabled}
        style={{
          position: 'absolute',
          left: -width * 0.035,
          top: height * 0.34,
          width: cloudWidth,
          height: cloudHeight,
          opacity: motion.tealOpacity,
          transform: [{ translateX: motion.tealX }, { translateY: motion.tealY }],
        }}
      >
        <Svg width={cloudWidth} height={cloudHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={`${gradientId}-teal`}>
              <Stop offset="0" stopColor={theme.atmosphere.aurora} stopOpacity={0.34} />
              <Stop offset="0.4" stopColor={theme.atmosphere.haze} stopOpacity={0.2} />
              <Stop offset="1" stopColor={theme.atmosphere.haze} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={50} cy={48} rx={48} ry={46} fill={`url(#${gradientId}-teal)`} />
        </Svg>
      </Animated.View>
    </View>
  )
}
