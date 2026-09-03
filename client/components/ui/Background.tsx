import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'

import { theme, type PlanetAccent } from './theme'
import { useReducedMotion } from './useReducedMotion'

export type BackgroundVariant = 'flat' | 'quiet' | 'atmospheric' | 'hero'

/**
 * Deterministic star field. Fractional coordinates so the field scales with the
 * container, fixed so it never reshuffles between renders — a background that
 * rearranges itself reads as noise rather than atmosphere.
 *
 * Twelve stars, three opacity tiers. The dormant GL background used 5,000.
 */
const STARS = [
  { x: 0.08, y: 0.07, r: 1.0, opacity: 0.18 },
  { x: 0.21, y: 0.16, r: 0.5, opacity: 0.1 },
  { x: 0.34, y: 0.05, r: 1.5, opacity: 0.28 },
  { x: 0.47, y: 0.21, r: 0.5, opacity: 0.1 },
  { x: 0.62, y: 0.09, r: 1.0, opacity: 0.18 },
  { x: 0.76, y: 0.18, r: 0.5, opacity: 0.1 },
  { x: 0.88, y: 0.06, r: 1.5, opacity: 0.28 },
  { x: 0.14, y: 0.33, r: 0.5, opacity: 0.1 },
  { x: 0.55, y: 0.36, r: 1.0, opacity: 0.18 },
  { x: 0.93, y: 0.29, r: 0.5, opacity: 0.1 },
  { x: 0.29, y: 0.44, r: 0.5, opacity: 0.1 },
  { x: 0.71, y: 0.48, r: 1.0, opacity: 0.18 },
] as const

const GRADIENT_HEIGHT_RATIO = 0.4
const HERO_GLOW_RADIUS_RATIO = 0.45
const HERO_GLOW_CENTER_Y_RATIO = 0.3
const HERO_GLOW_OPACITY = 0.08

type Props = {
  variant?: BackgroundVariant
  /** Hero tint source. At most one planet accent is ever active. */
  planet?: PlanetAccent | null
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  testID?: string
}

function showsGradient(variant: BackgroundVariant) {
  return variant !== 'flat'
}

function showsStars(variant: BackgroundVariant) {
  return variant === 'atmospheric' || variant === 'hero'
}

export function Background({
  variant = 'quiet',
  planet = null,
  style,
  children,
  testID,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  )

  // Reduced motion, and the window before the preference resolves, both render
  // the flat base. The base color is painted by the container either way, so
  // this is a decoration decision only -- never a legibility one.
  const effectiveVariant: BackgroundVariant =
    reduceMotion === null || reduceMotion === true ? 'flat' : variant

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout

    setSize((current) =>
      current && current.width === width && current.height === height
        ? current
        : { width, height }
    )
  }

  const canDecorate =
    effectiveVariant !== 'flat' &&
    size != null &&
    size.width > 0 &&
    size.height > 0

  const glowColor = planet ? theme.planet[planet] : theme.accent.base

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[styles.container, style]}
    >
      {canDecorate ? (
        <View
          testID="background-decoration"
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <Svg
            width={size.width}
            height={size.height}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Defs>
              <LinearGradient id="naksha-bg-lift" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0"
                  stopColor={theme.background.raised}
                  stopOpacity="1"
                />
                <Stop
                  offset="1"
                  stopColor={theme.background.base}
                  stopOpacity="1"
                />
              </LinearGradient>
              <RadialGradient id="naksha-bg-glow" cx="0.5" cy="0.5" r="0.5">
                <Stop
                  offset="0"
                  stopColor={glowColor}
                  stopOpacity={String(HERO_GLOW_OPACITY)}
                />
                <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {showsGradient(effectiveVariant) ? (
              <Rect
                x="0"
                y="0"
                width={size.width}
                height={size.height * GRADIENT_HEIGHT_RATIO}
                fill="url(#naksha-bg-lift)"
              />
            ) : null}

            {effectiveVariant === 'hero' ? (
              <Circle
                testID="background-hero-glow"
                cx={size.width / 2}
                cy={size.height * HERO_GLOW_CENTER_Y_RATIO}
                r={size.width * HERO_GLOW_RADIUS_RATIO}
                fill="url(#naksha-bg-glow)"
              />
            ) : null}

            {showsStars(effectiveVariant)
              ? STARS.map((star, index) => (
                  <Circle
                    key={`naksha-star-${index}`}
                    testID="background-star"
                    cx={star.x * size.width}
                    cy={star.y * size.height}
                    r={star.r}
                    fill={theme.text.primary}
                    opacity={star.opacity}
                  />
                ))
              : null}
          </Svg>
        </View>
      ) : null}

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // The flat fallback. Painted unconditionally, so content stays legible
    // even if the decorative layer never renders.
    backgroundColor: theme.background.base,
  },
})
