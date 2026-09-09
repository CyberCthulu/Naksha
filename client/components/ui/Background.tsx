import React, { useId, useState } from 'react'
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
  Ellipse,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { theme, type PlanetAccent } from './theme'
import { BackgroundGlimmer } from './BackgroundGlimmer'

export type BackgroundVariant = 'flat' | 'quiet' | 'atmospheric' | 'hero'

/**
 * A fixed, lightly scattered field across the whole viewport. The outer
 * columns stay in the gutters, with stars also visible through reading cards.
 * Sizes are in layout pixels; fractional positions adapt to the container.
 * Built once, with a fixed seed, so renders and route changes never reshuffle it.
 */
const STARS = (() => {
  let seed = 7391
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }

  return Array.from({ length: 96 }, (_, index) => {
    const column = index % 8
    const row = Math.floor(index / 8)
    const x =
      column === 0
        ? 0.014 + next() * 0.025
        : column === 7
          ? 0.961 + next() * 0.025
          : (column + 0.15 + next() * 0.7) / 8
    const y = (row + 0.12 + next() * 0.76) / 12
    const brightness = next()
    const bright = brightness > 0.88

    return {
      x,
      y,
      r: bright ? 1.15 : brightness > 0.5 ? 0.75 : 0.45,
      opacity: bright ? 0.72 : brightness > 0.5 ? 0.44 : 0.24,
      bright,
    }
  })
})()

const GLIMMER_STARS = STARS.filter((star) => star.bright)

const HERO_GLOW_RADIUS_RATIO = 0.45
const HERO_GLOW_CENTER_Y_RATIO = 0.3
const HERO_GLOW_OPACITY = 0.08

type Props = {
  variant?: BackgroundVariant
  /** Hero tint source. At most one planet accent is ever active. */
  planet?: PlanetAccent | null
  /** Disable glimmer for hidden routes. The static sky remains visible. */
  motionEnabled?: boolean
  /** Screen backgrounds protect system bars; contained panel skies do not. */
  protectSystemBars?: boolean
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  testID?: string
}

function showsStars(variant: BackgroundVariant) {
  return variant === 'atmospheric' || variant === 'hero'
}

export function Background({
  variant = 'quiet',
  planet = null,
  motionEnabled = true,
  protectSystemBars = true,
  style,
  children,
  testID,
}: Props) {
  const insets = useSafeAreaInsets()
  const gradientId = `naksha-bg-${useId().replace(/:/g, '')}`
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  )

  // The sky always renders immediately. Only the optional glimmer waits for
  // motion preferences and app/route activity; the base never disappears.
  const starry = showsStars(variant)

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout

    setSize((current) =>
      current && current.width === width && current.height === height
        ? current
        : { width, height }
    )
  }

  const canDecorate =
    variant !== 'flat' &&
    size != null &&
    size.width > 0 &&
    size.height > 0

  const glowColor = planet ? theme.planetGlow[planet] : theme.accent.base

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
              <LinearGradient id={`${gradientId}-lift`} x1="0" y1="0" x2="0" y2="1">
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
              <RadialGradient id={`${gradientId}-nebula`}>
                <Stop offset="0" stopColor={theme.atmosphere.nebula} stopOpacity="0.24" />
                <Stop offset="0.45" stopColor={theme.atmosphere.nebula} stopOpacity="0.10" />
                <Stop offset="1" stopColor={theme.atmosphere.nebula} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id={`${gradientId}-haze`}>
                <Stop offset="0" stopColor={theme.atmosphere.haze} stopOpacity="0.20" />
                <Stop offset="0.5" stopColor={theme.atmosphere.haze} stopOpacity="0.08" />
                <Stop offset="1" stopColor={theme.atmosphere.haze} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id={`${gradientId}-starlight`}>
                <Stop offset="0" stopColor={theme.atmosphere.star} stopOpacity="0.18" />
                <Stop offset="0.3" stopColor={theme.atmosphere.star} stopOpacity="0.06" />
                <Stop offset="1" stopColor={theme.atmosphere.star} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id={`${gradientId}-glow`} cx="0.5" cy="0.5" r="0.5">
                <Stop
                  offset="0"
                  stopColor={glowColor}
                  stopOpacity={String(HERO_GLOW_OPACITY)}
                />
                <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            <Rect
              x="0"
              y="0"
              width={size.width}
              height={size.height * (starry ? 0.7 : 0.4)}
              fill={`url(#${gradientId}-lift)`}
            />

            {starry ? (
              <>
                <Ellipse
                  testID="background-nebula"
                  cx={size.width * 0.9}
                  cy={size.height * 0.28}
                  rx={size.width * 0.85}
                  ry={size.height * 0.28}
                  fill={`url(#${gradientId}-nebula)`}
                />
                <Ellipse
                  testID="background-haze"
                  cx={size.width * 0.05}
                  cy={size.height * 0.65}
                  rx={size.width * 0.9}
                  ry={size.height * 0.32}
                  fill={`url(#${gradientId}-haze)`}
                />
              </>
            ) : null}

            {variant === 'hero' ? (
              <Circle
                testID="background-hero-glow"
                cx={size.width / 2}
                cy={size.height * HERO_GLOW_CENTER_Y_RATIO}
                r={size.width * HERO_GLOW_RADIUS_RATIO}
                fill={`url(#${gradientId}-glow)`}
              />
            ) : null}

            {starry
              ? STARS.map((star, index) => (
                  <React.Fragment key={`naksha-star-${index}`}>
                    {star.bright ? (
                      <Circle
                        cx={star.x * size.width}
                        cy={star.y * size.height}
                        r={star.r * 5}
                        fill={`url(#${gradientId}-starlight)`}
                      />
                    ) : null}
                    <Circle
                      testID="background-star"
                      cx={star.x * size.width}
                      cy={star.y * size.height}
                      r={star.r}
                      fill={star.bright ? theme.text.primary : theme.atmosphere.star}
                      opacity={star.opacity}
                    />
                  </React.Fragment>
                ))
              : null}
          </Svg>
          {starry && motionEnabled ? (
            <BackgroundGlimmer
              width={size.width}
              height={size.height}
              stars={GLIMMER_STARS}
              gradientId={`${gradientId}-glimmer`}
              enabled={motionEnabled}
            />
          ) : null}
        </View>
      ) : null}

      {children}

      {/* System-bar protection.
          Under edge-to-edge the window extends beneath the system bars, so a
          screen's contentContainer paddingTop positions its first item but
          does nothing about items that scroll up into that region and stay
          visible behind the status icons. This paints over that strip.

          It is absolutely positioned and rendered after children, so it
          occludes scrolled content without contributing any layout -- there is
          no second inset and no header is pushed down twice. */}
      {protectSystemBars && insets.top > 0 ? (
        <View
          testID="background-status-bar-protection"
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.statusBarProtection,
            {
              height: insets.top,
              // Match what sits directly beneath: the gradient's upper stop on
              // decorated variants, the flat environment otherwise. A base-
              // coloured strip over the gradient would read as a dark band.
              backgroundColor:
                variant === 'flat'
                  ? theme.background.base
                  : theme.background.raised,
            },
          ]}
        />
      ) : null}

      {/* The navigation bar has the same problem: content scrolls up behind
          the back/home/recents buttons and stays visible there. The gradient
          has faded out well before the bottom, so this strip is always the
          flat environment colour. */}
      {protectSystemBars && insets.bottom > 0 ? (
        <View
          testID="background-navigation-bar-protection"
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.navigationBarProtection,
            {
              height: insets.bottom,
              backgroundColor: theme.background.base,
            },
          ]}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  statusBarProtection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  navigationBarProtection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
    // The flat fallback. Painted unconditionally, so content stays legible
    // even if the decorative layer never renders.
    backgroundColor: theme.background.base,
  },
})
