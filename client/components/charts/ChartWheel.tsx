//components/charts/ChartWheel.tsx
import React, { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { useReducedMotion } from '../ui/useReducedMotion'
import {
  nearestPlanetIndex,
  PLANET_HIT_RADIUS,
} from './chartWheelInteraction'

import { Aspect, HouseCusp, PlanetPos } from '../../lib/astro'
import { theme } from '../ui/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedLine = Animated.createAnimatedComponent(Line)

/**
 * Selection glow bounds.
 *
 * Deliberately never zero. An overlay that breathes to nothing looks like a
 * rendering fault rather than a highlight, and on device it made some
 * selections appear static.
 */
export const GLOW_MIN = 0.3
export const GLOW_MAX = 0.7

/**
 * Motion for each aspect type.
 *
 * The selected line is *drawn* with these dashes rather than having them laid
 * over a solid line, so what moves is the line itself. And each aspect gets
 * its own character, because five relationships that all shimmer identically
 * waste the one channel that could distinguish them:
 *
 *   conjunction  dense and slow-drifting -- two bodies fused
 *   opposition   long strokes running the other way -- a polarity pulling
 *   square       short, fast, staccato -- friction
 *   trine        long, smooth, unhurried -- natural flow
 *   sextile      light and intermittent -- opportunity, not obligation
 *
 * The dash pattern survives when motion is switched off, so the distinction
 * still reads statically.
 */
export const ASPECT_MOTION = {
  conj: { dash: 3, gap: 5, duration: 2400, direction: 1 },
  opp: { dash: 11, gap: 9, duration: 1700, direction: -1 },
  square: { dash: 4, gap: 4, duration: 700, direction: 1 },
  trine: { dash: 13, gap: 8, duration: 2000, direction: 1 },
  sextile: { dash: 3, gap: 12, duration: 1250, direction: 1 },
} as const

export type AspectMotionKey = keyof typeof ASPECT_MOTION

export function aspectMotion(type: string) {
  return ASPECT_MOTION[type as AspectMotionKey] ?? ASPECT_MOTION.trine
}

/**
 * How much of the breathing glow the aspect bloom takes.
 *
 * The bloom is a halo around a hairline, so it needs a small fraction of the
 * planet-halo opacity. At full strength on a wide stroke it stopped reading
 * as a glow and became an opaque bar with the trace sliding inside it.
 */
export const ASPECT_BLOOM_OPACITY = 0.25

type PlanetAccentName = keyof typeof theme.planet

/**
 * The wheel's geometry, in one place.
 *
 * Hoisted out of the component so the gesture layer can hit-test against
 * exactly the endpoints that are drawn. The expressions are unchanged from
 * when they lived inline; nothing about the chart's shape moved.
 */
export function wheelGeometry(size: number) {
  const pad = 16
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - 26
  const rPlanets = (rOuter + rInner) / 2
  const rAspect = rInner - 6

  const rHouseOuter = rInner - 2
  const rHouseInner = rInner - 22
  const rHouseLabel = rHouseInner - 10

  const toXY = (lonDeg: number, radius: number) => {
    const ang = (lonDeg * Math.PI) / 180
    const x = cx + Math.cos(-ang + Math.PI / 2) * radius
    const y = cy + Math.sin(-ang + Math.PI / 2) * radius
    return { x, y }
  }

  // The padded viewBox renders into `size`, so screen space is scaled.
  const viewBoxSpan = size + pad * 2
  const svgScale = size / viewBoxSpan
  const toScreen = (lonDeg: number, radius: number) => {
    const { x, y } = toXY(lonDeg, radius)
    return { x: (x + pad) * svgScale, y: (y + pad) * svgScale }
  }

  return {
    pad, cx, cy, rOuter, rInner, rPlanets, rAspect,
    rHouseOuter, rHouseInner, rHouseLabel,
    toXY, toScreen,
  }
}

/** Screen-space centres of every drawable planet marker. */
export function wheelPlanetPoints(size: number, planets: PlanetPos[]) {
  const { toScreen, rPlanets } = wheelGeometry(size)
  return planets.map((p) => toScreen(p.lon, rPlanets))
}

/**
 * Screen-space house band: the ring the house numbers sit in.
 *
 * Returned in the same coordinates as the planet points and aspect segments,
 * so the gesture layer can test all three against one transformed touch.
 */
export function wheelHouseBand(size: number) {
  const g = wheelGeometry(size)
  const svgScale = size / (size + g.pad * 2)

  return {
    center: {
      x: (g.cx + g.pad) * svgScale,
      y: (g.cy + g.pad) * svgScale,
    },
    innerRadius: g.rHouseInner * svgScale,
    outerRadius: g.rHouseOuter * svgScale,
  }
}

/** Screen-space endpoints of every drawable aspect line. */
export function wheelAspectSegments(
  size: number,
  planets: PlanetPos[],
  aspects: Aspect[]
) {
  const { toScreen, rAspect } = wheelGeometry(size)

  return aspects.map((a) => {
    const A = planets.find((p) => p.name === a.a)
    const B = planets.find((p) => p.name === a.b)

    // Unresolvable endpoints are pushed far away so they can never be nearest.
    if (!A || !B) {
      return { a: { x: -1e6, y: -1e6 }, b: { x: -1e6, y: -1e6 } }
    }

    return { a: toScreen(A.lon, rAspect), b: toScreen(B.lon, rAspect) }
  })
}

export type ChartSelection =
  | { kind: 'planet'; planet: PlanetAccentName }
  | { kind: 'aspect'; index: number }
  | { kind: 'house'; house: number }
  | null

/**
 * Structural line weights, brightest to faintest.
 *
 * The border tokens are 10-18% alpha hairlines intended for card edges on a
 * solid surface. At 1px over a gradient they all but vanish, so the wheel
 * paints its structure with a solid slate and an explicit opacity per role.
 * This keeps one deliberate order of visual weight: focused planet, planet
 * discs, sign glyphs, house numbers, rim, house lines, sign ticks, aspects.
 */
const WHEEL = {
  rim: 0.55,
  innerRim: 0.34,
  signTick: 0.3,
  houseLine: 0.42,
  aspect: 0.4,
  planetRing: 0.5,
} as const

const ZODIAC_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi']

const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

type Props = {
  size: number
  planets: PlanetPos[]
  aspects: Aspect[]
  houses: HouseCusp[] | null
  /** Visual emphasis only. Never affects geometry. */
  focusedPlanet?: PlanetAccentName | null
  /** When supplied, planets and aspects become directly selectable. */
  onSelectPlanet?: (planet: PlanetAccentName) => void
  /** Selecting an aspect by its index in the `aspects` array. */
  onSelectAspect?: (index: number | null) => void
  /** The currently selected entity, if any. */
  selection?: ChartSelection
}

/**
 * Minimum touch size for an on-wheel planet, in dp.
 *
 * Deliberately fixed rather than proportional to the wheel: holding it at the
 * platform minimum is what makes enlarging the wheel actually separate
 * conjunct planets instead of scaling the crowding along with everything else.
 */
export const PLANET_HIT_SIZE = 48

export default function ChartWheel({
  size,
  planets,
  aspects,
  houses,
  focusedPlanet = null,
  onSelectPlanet,
  onSelectAspect,
  selection = null,
}: Props) {
  const reduceMotion = useReducedMotion()
  // Static unless the platform has positively told us motion is welcome.
  const animateGlow = reduceMotion === false
  const glow = useSharedValue(GLOW_MAX)
  const trace = useSharedValue(0)

  /*
   * Key the animation on the *identity* of what is selected, not on the
   * selection object or a boolean.
   *
   * Depending on the object restarts the breath on every re-render; depending
   * on `selection.kind` or "is anything selected" never restarts it when the
   * user moves Mars -> Uranus -> Saturn, because all three are
   * `kind: 'planet'`. A stable string like `planet:Mars` restarts precisely
   * when the selected entity actually changes, and re-selecting the same
   * entity deliberately leaves the running animation alone.
   */
  const selectionKey =
    selection == null
      ? 'none'
      : selection.kind === 'planet'
      ? `planet:${selection.planet}`
      : selection.kind === 'house'
      ? `house:${selection.house}`
      : `aspect:${selection.index}`

  const isAspectSelected = selection?.kind === 'aspect'

  /**
   * Which planets wear the selected treatment.
   *
   * A selected aspect lights *both* of its participants, so the pair being
   * described is obvious at a glance: the line says there is a relationship,
   * the two glowing markers say between what. A selected planet lights only
   * itself, and a selected house lights none.
   */
  const highlightedPlanets = useMemo(() => {
    if (selection?.kind === 'aspect') {
      const aspect = aspects[selection.index]
      return new Set<string>(aspect ? [aspect.a, aspect.b] : [])
    }

    if (selection?.kind === 'planet') return new Set<string>([selection.planet])
    if (selection?.kind === 'house') return new Set<string>()

    // Nothing selected: the chart still opens on its focused placement.
    return new Set<string>(focusedPlanet ? [focusedPlanet] : [])
  }, [selection, aspects, focusedPlanet])
  const selectedAspectType =
    selection?.kind === 'aspect' ? aspects[selection.index]?.type ?? null : null

  useEffect(() => {
    cancelAnimation(glow)
    cancelAnimation(trace)

    // Always reset to a defined, fully visible starting point. The glow never
    // reaches zero: a selection that fades to invisible reads as a bug.
    glow.value = GLOW_MAX
    trace.value = 0

    if (!animateGlow || selectionKey === 'none') return

    glow.value = withRepeat(
      withTiming(GLOW_MIN, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )

    if (isAspectSelected && selectedAspectType) {
      const motion = aspectMotion(selectedAspectType)
      const cycle = motion.dash + motion.gap

      // Exactly one dash period per repeat, linear, so the flow is continuous
      // with no visible jump at the loop boundary.
      trace.value = withRepeat(
        withTiming(-motion.direction * cycle, {
          duration: motion.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    }

    return () => {
      cancelAnimation(glow)
      cancelAnimation(trace)
    }
  }, [
    animateGlow,
    glow,
    trace,
    selectionKey,
    isAspectSelected,
    selectedAspectType,
  ])

  const glowProps = useAnimatedProps(() => ({ opacity: glow.value }))
  const bloomProps = useAnimatedProps(() => ({
    opacity: glow.value * ASPECT_BLOOM_OPACITY,
  }))
  const traceProps = useAnimatedProps(() => ({
    strokeDashoffset: trace.value,
  }))
  const {
    pad, cx, cy, rOuter, rInner, rPlanets, rAspect,
    rHouseOuter, rHouseInner, rHouseLabel, toXY, toScreen,
  } = wheelGeometry(size)

  const aspectStroke: Record<Aspect['type'], number> = {
    conj: 2.0,
    opp: 1.8,
    trine: 1.6,
    square: 1.6,
    sextile: 1.2,
  }

  const wheel = (
    <Svg
      width={size}
      height={size}
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle
        cx={cx}
        cy={cy}
        r={rOuter}
        stroke={theme.text.tertiary}
        strokeOpacity={WHEEL.rim}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={rInner}
        stroke={theme.text.tertiary}
        strokeOpacity={WHEEL.innerRim}
        strokeWidth={1}
        fill="none"
      />

      {Array.from({ length: 12 }).map((_, i) => {
        const ang = i * 30
        const { x: x1, y: y1 } = toXY(ang, rInner)
        const { x: x2, y: y2 } = toXY(ang, rOuter)
        const { x: lx, y: ly } = toXY(ang, rOuter + 12)

        return (
          <G key={`sign-${i}`}>
            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.text.tertiary}
              strokeOpacity={WHEEL.signTick}
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={10}
              textAnchor="middle"
              dy={3}
              fill={theme.accent.base}
            >
              {ZODIAC_ABBR[i]}
            </SvgText>
          </G>
        )
      })}

      {/*
        Selected house wedge.
        Drawn as a stroked arc rather than a filled path: one circle at the
        band's mid-radius, with a dash pattern showing exactly 30 degrees and
        a rotation placing it on the cusp. No new geometry is introduced --
        the radii and the 30-degree span are the ones the chart already uses.
      */}
      {selection?.kind === 'house' && houses
        ? (() => {
            const selected = houses.find(
              (h) => h.house === selection.house
            )
            if (!selected) return null

            const midRadius = (rHouseOuter + rHouseInner) / 2
            const bandWidth = rHouseOuter - rHouseInner
            const circumference = 2 * Math.PI * midRadius
            const arc = circumference / 12

            return (
              <AnimatedCircle
                testID={`house-wedge-${selected.house}`}
                cx={cx}
                cy={cy}
                r={midRadius}
                fill="none"
                stroke={theme.accent.base}
                strokeWidth={bandWidth}
                strokeDasharray={`${arc} ${circumference - arc}`}
                transform={`rotate(${60 - selected.lon} ${cx} ${cy})`}
                animatedProps={glowProps}
              />
            )
          })()
        : null}

      {houses?.map((h) => {
        const { x: x1, y: y1 } = toXY(h.lon, rHouseInner)
        const { x: x2, y: y2 } = toXY(h.lon, rHouseOuter)
        const midLon = h.lon + 15
        const { x: lx, y: ly } = toXY(midLon, rHouseLabel)

        return (
          <G key={`house-${h.house}`}>
            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.text.tertiary}
              strokeOpacity={WHEEL.houseLine}
              strokeWidth={1}
            />
            <SvgText
              x={lx}
              y={ly}
              fontSize={9}
              textAnchor="middle"
              dy={3}
              fill={
                selection?.kind === 'house' && selection.house === h.house
                  ? theme.accent.bright
                  : theme.text.secondary
              }
            >
              {h.house}
            </SvgText>
          </G>
        )
      })}

      {aspects.map((a, idx) => {
        const A = planets.find((p) => p.name === a.a)
        const B = planets.find((p) => p.name === a.b)
        if (!A || !B) return null

        const { x: x1, y: y1 } = toXY(A.lon, rAspect)
        const { x: x2, y: y2 } = toXY(B.lon, rAspect)
        const isSelectedAspect =
          selection?.kind === 'aspect' && selection.index === idx

        if (isSelectedAspect) {
          const motion = aspectMotion(a.type)

          return (
            <G key={`${a.a}-${a.b}-${idx}`}>
              {/*
                1. A faint continuous halo. This is the only thing that still
                traces the whole path, so the aspect stays legible between
                dashes without a solid line competing with them.
              */}
              <AnimatedLine
                testID={`aspect-bloom-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.accent.base}
                strokeWidth={aspectStroke[a.type] + 5}
                strokeLinecap="round"
                animatedProps={bloomProps}
              />

              {/*
                2. The line itself -- drawn dashed, and the dashes move.
                There is deliberately no solid stroke beneath this. Painting
                dashes over a continuous line is what made the motion read as
                something sliding across the top of it; when the dashes *are*
                the line, the line is what flows.

                The endpoints, angle and length are the same numbers the
                unselected line uses. Only the dash offset animates.
              */}
              <AnimatedLine
                testID={`aspect-selected-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.accent.bright}
                strokeWidth={aspectStroke[a.type] + 0.6}
                strokeLinecap="round"
                strokeDasharray={`${motion.dash} ${motion.gap}`}
                animatedProps={traceProps}
              />
            </G>
          )
        }

        return (
          <Line
            key={`${a.a}-${a.b}-${idx}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={theme.text.tertiary}
            strokeWidth={aspectStroke[a.type]}
            opacity={WHEEL.aspect}
            strokeDasharray={
              a.type === 'sextile' ? '4 4' : a.type === 'trine' ? '8 6' : undefined
            }
          />
        )
      })}

      {planets.map((p) => {
        const { x, y } = toXY(p.lon, rPlanets)
        const glyph = GLYPH[p.name] ?? p.name[0]
        const isFocused = highlightedPlanets.has(p.name)
        const accent = isFocused
          ? theme.planet[p.name as PlanetAccentName]
          : theme.accent.base
        const glowAccent = isFocused
          ? theme.planetGlow[p.name as PlanetAccentName]
          : theme.accent.base

        return (
          <G key={p.name}>
            {/* Focused halo. Purely decorative; the marker position is
                unchanged and the geometry above is untouched. */}
            {isFocused ? (
              <>
                {/*
                  The halo carries the planet's own hue, taken from the glow
                  palette rather than the ink palette. The accents are tuned
                  to read as ink on a dark surface, so Pluto and Mars all but
                  vanished as a large low-opacity wash; the glow variants are
                  the same hues at a common high luminance, which keeps the
                  identity without one planet blazing and another disappearing.
                */}
                <AnimatedCircle
                  testID={`planet-halo-${p.name}`}
                  cx={x}
                  cy={y}
                  r={20}
                  fill={glowAccent}
                  animatedProps={glowProps}
                />
                {/* Planet-coloured inner accent. */}
                <Circle
                  testID={`planet-accent-${p.name}`}
                  cx={x}
                  cy={y}
                  r={15}
                  fill={accent}
                  opacity={0.22}
                />
                {/* Stable ring: never animated, never absent while selected. */}
                <Circle
                  testID={`planet-ring-${p.name}`}
                  cx={x}
                  cy={y}
                  r={13}
                  fill="none"
                  stroke={glowAccent}
                  strokeWidth={1.5}
                  opacity={0.95}
                />
              </>
            ) : null}
            <Circle
              cx={x}
              cy={y}
              r={9}
              fill={theme.background.raised}
              stroke={isFocused ? accent : theme.text.tertiary}
              strokeOpacity={isFocused ? 1 : WHEEL.planetRing}
              strokeWidth={isFocused ? 1.5 : 1}
            />
            <SvgText
              x={x}
              y={y}
              fontSize={9}
              fill={isFocused ? accent : theme.text.primary}
              textAnchor="middle"
              dy={3}
            >
              {glyph}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )

  if (!onSelectPlanet) return wheel

  const planetPoints = planets.map((p) => toScreen(p.lon, rPlanets))
  const houseBand = wheelHouseBand(size)

  /**
   * Resolve a touch on a planet target to the *nearest* planet.
   *
   * The 48dp targets overlap heavily where planets cluster -- Neptune, Uranus
   * and Jupiter can all be under one finger. Whichever overlapping target
   * happens to be on top receives the touch, which is an arbitrary function of
   * render order, so resolving by distance from the actual touch point makes
   * the outcome match what the reader aimed at.
   *
   * Returns null when the touch belongs to the house band instead. The control
   * is a square that overhangs the ring below it, and the wedge under that
   * overhang has to stay selectable -- see `nearestPlanetIndex`. Declining here
   * is safe because the gesture layer sees the same touch and resolves it with
   * the same rule, so the house is what gets selected rather than nothing.
   */
  const resolvePlanetTouch = (
    fallback: PlanetAccentName,
    index: number,
    locationX?: number,
    locationY?: number
  ) => {
    if (locationX == null || locationY == null) {
      // No location: an assistive-technology activation. Take it at face value.
      return fallback
    }

    const origin = planetPoints[index]
    const point = {
      x: origin.x - PLANET_HIT_SIZE / 2 + locationX,
      y: origin.y - PLANET_HIT_SIZE / 2 + locationY,
    }

    const nearest = nearestPlanetIndex(
      point,
      planetPoints,
      houseBand,
      PLANET_HIT_RADIUS
    )
    if (nearest == null) return null

    return asAccentName(planets[nearest].name) ?? fallback
  }

  return (
    <View style={{ width: size, height: size }}>
      {wheel}


      {/* Real RN controls over a decorative drawing. Hit targets are views
          rather than SVG shapes so they get dependable Android touch handling
          and genuine accessibility, which SVG children do not reliably get. */}
      {planets.map((p, index) => {
        const key = asAccentName(p.name)
        if (!key) return null

        const { x, y } = planetPoints[index]
        const isFocused = highlightedPlanets.has(p.name)

        return (
          <Pressable
            key={`hit-${p.name}`}
            testID={`wheel-planet-${p.name}`}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            accessibilityHint="Selects this planet on the chart"
            accessibilityState={{ selected: isFocused }}
            onPress={(event) => {
              const resolved = resolvePlanetTouch(
                key,
                index,
                event?.nativeEvent?.locationX,
                event?.nativeEvent?.locationY
              )

              if (resolved) onSelectPlanet(resolved)
            }}
            style={[
              styles.hit,
              {
                left: x - PLANET_HIT_SIZE / 2,
                top: y - PLANET_HIT_SIZE / 2,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

function asAccentName(name: string): PlanetAccentName | null {
  return name in theme.planet ? (name as PlanetAccentName) : null
}

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
    width: PLANET_HIT_SIZE,
    height: PLANET_HIT_SIZE,
    borderRadius: PLANET_HIT_SIZE / 2,
  },
})