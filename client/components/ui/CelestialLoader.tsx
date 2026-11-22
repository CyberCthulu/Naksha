import React, { useId } from 'react'
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Svg, { Circle, Defs, Mask, Path, RadialGradient, Stop } from 'react-native-svg'

import { useScreenActivity } from './ScreenActivity'
import { theme } from './theme'
import { useCelestialLoadingMotion } from './useCelestialLoadingMotion'

export type CelestialLoaderProps = {
  size?: number
  color?: string
  motionEnabled?: boolean
  testID?: string
  style?: StyleProp<ViewStyle>
}

// Twelve fine rays, alternating in length. Geometry stays fixed; only the
// containing native view turns and breathes while a request is in flight.
const SOLAR_RAYS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6
  const outerRadius = index % 2 === 0 ? 45 : 38
  const x1 = 48 + 30 * Math.sin(angle)
  const y1 = 48 - 30 * Math.cos(angle)
  const x2 = 48 + outerRadius * Math.sin(angle)
  const y2 = 48 - outerRadius * Math.cos(angle)
  return `M${x1.toFixed(3)} ${y1.toFixed(3)}L${x2.toFixed(3)} ${y2.toFixed(3)}`
}).join(' ')

/**
 * Naksha's solar seal turns into a small lunar sequence during longer waits.
 * The phases are a decorative loading cycle, not the Moon's current phase.
 * A screen's LoadingState or control owns the accessible progress label.
 */
export function CelestialLoader({
  size = 96,
  color = theme.accent.base,
  motionEnabled = true,
  testID = 'celestial-loader',
  style,
}: CelestialLoaderProps) {
  const screenActive = useScreenActivity()
  const phase = useCelestialLoadingMotion(motionEnabled && screenActive)
  const id = useId().replace(/:/g, '')
  const glowId = `loader-glow-${id}`
  const crescentId = `loader-crescent-${id}`
  const compact = size <= 24

  const rotation = phase.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  const counterRotation = phase.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  })
  const breath = phase.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.045, 1, 1.045, 1],
  })
  const glow = phase.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.65, 1, 0.65, 1, 0.65],
  })
  const sun = phase.interpolate({
    inputRange: [0, 0.42, 0.5, 0.9, 1],
    outputRange: [1, 1, 0, 0, 1],
  })
  const crescent = phase.interpolate({
    inputRange: [0, 0.42, 0.5, 0.58, 0.66, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  })
  const half = phase.interpolate({
    inputRange: [0, 0.58, 0.66, 0.74, 0.82, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  })
  const full = phase.interpolate({
    inputRange: [0, 0.74, 0.82, 0.9, 1],
    outputRange: [0, 0, 1, 1, 0],
  })

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, { width: size, height: size }]}
    >
      {!compact ? (
        <Animated.View
          style={[styles.layer, { opacity: glow, transform: [{ scale: breath }] }]}
        >
          <Svg width={size} height={size} viewBox="0 0 96 96">
            <Defs>
              <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={color} stopOpacity={0.2} />
                <Stop offset="0.45" stopColor={color} stopOpacity={0.07} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={48} cy={48} r={47} fill={`url(#${glowId})`} />
          </Svg>
        </Animated.View>
      ) : null}

      <Animated.View
        testID={`${testID}-sun`}
        style={[styles.layer, { opacity: compact ? 1 : sun }]}
      >
        <Animated.View
          style={[
            styles.layer,
            { transform: [{ rotate: rotation }, { scale: compact ? 1 : breath }] },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 96 96">
            <Path
              d={SOLAR_RAYS}
              fill="none"
              stroke={color}
              strokeWidth={compact ? 5 : 1.5}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {!compact ? (
          <Animated.View
            style={[styles.layer, { transform: [{ rotate: counterRotation }] }]}
          >
            <Svg width={size} height={size} viewBox="0 0 96 96">
              <Circle
                cx={48}
                cy={48}
                r={24}
                fill="none"
                stroke={color}
                strokeWidth={0.8}
                opacity={0.25}
              />
              <Path
                d="M27.2 36a24 24 0 0 1 32.8-8.8M68.8 60a24 24 0 0 1-32.8 8.8"
                fill="none"
                stroke={color}
                strokeWidth={1.3}
                strokeLinecap="round"
                opacity={0.72}
              />
            </Svg>
          </Animated.View>
        ) : null}

        <Svg width={size} height={size} viewBox="0 0 96 96">
          <Circle
            cx={48}
            cy={48}
            r={compact ? 17 : 15}
            fill={color}
            fillOpacity={0.16}
            stroke={color}
            strokeWidth={compact ? 5 : 1.5}
          />
          {!compact ? (
            <Circle cx={48} cy={48} r={2.2} fill={color} opacity={0.8} />
          ) : null}
        </Svg>
      </Animated.View>

      {!compact ? (
        <>
          <Animated.View
            testID={`${testID}-crescent`}
            style={[styles.layer, { opacity: crescent }]}
          >
            <Svg width={size} height={size} viewBox="0 0 96 96">
              <Defs>
                <Mask
                  id={crescentId}
                  x={20}
                  y={20}
                  width={56}
                  height={56}
                  maskUnits="userSpaceOnUse"
                >
                  <Circle cx={48} cy={48} r={20} fill="white" />
                  <Circle cx={56} cy={42} r={19} fill="black" />
                </Mask>
              </Defs>
              <Circle
                cx={48}
                cy={48}
                r={20}
                fill={color}
                mask={`url(#${crescentId})`}
                opacity={0.85}
              />
            </Svg>
          </Animated.View>
          <Animated.View
            testID={`${testID}-half`}
            style={[styles.layer, { opacity: half }]}
          >
            <Svg width={size} height={size} viewBox="0 0 96 96">
              <Path
                d="M48 28a20 20 0 0 0 0 40Z"
                fill={color}
                opacity={0.85}
              />
            </Svg>
          </Animated.View>
          <Animated.View
            testID={`${testID}-full`}
            style={[styles.layer, { opacity: full }]}
          >
            <Svg width={size} height={size} viewBox="0 0 96 96">
              <Circle cx={48} cy={48} r={20} fill={color} opacity={0.85} />
              <Circle
                cx={48}
                cy={48}
                r={25}
                fill="none"
                stroke={color}
                strokeWidth={0.8}
                opacity={0.25}
              />
            </Svg>
          </Animated.View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
})
