// components/charts/InteractiveChartWheel.tsx
import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import type { Aspect, HouseCusp, PlanetPos } from '../../lib/astro'
import { theme } from '../ui/theme'
import ChartWheel, {
  type ChartSelection,
  wheelAspectSegments,
  wheelHouseBand,
  wheelPlanetPoints,
} from './ChartWheel'
import {
  ASPECT_HIT_TOLERANCE,
  clampScale,
  clampTranslation,
  focalTranslation,
  houseAtPoint,
  inverseTransformPoint,
  MAX_WHEEL_SCALE,
  MIN_WHEEL_SCALE,
  nearestPointIndex,
  nearestSegmentIndex,
  PLANET_HIT_RADIUS,
} from './chartWheelInteraction'

type PlanetAccentName = keyof typeof theme.planet

type Props = {
  size: number
  planets: PlanetPos[]
  aspects: Aspect[]
  houses: HouseCusp[] | null
  focusedPlanet?: PlanetAccentName | null
  selection: ChartSelection
  onSelectPlanet: (planet: PlanetAccentName) => void
  onSelectAspect: (index: number | null) => void
  onSelectHouse: (house: number) => void
}

/** One deliberate step for the screen-reader zoom actions. */
const ACCESSIBILITY_ZOOM_STEP = 0.5

/** How far a finger may travel and still count as a tap. */
export const TAP_SLOP = 12
/** How long a finger may rest and still count as a tap. */
export const TAP_MAX_DURATION = 260

/**
 * Pinch-to-zoom and pan around the chart wheel.
 *
 * There are no visible zoom buttons: the gesture is the control. Everything a
 * pinch can do is still reachable without one, through custom accessibility
 * actions, because a pinch is unavailable to screen-reader and switch users.
 *
 * Gesture arbitration is the fiddly part and is deliberately explicit:
 *
 *   - pan is disabled at 1x, so a one-finger drag over a fitted wheel belongs
 *     to the page and vertical scrolling is untouched;
 *   - pan requires two pointers to begin only once enlarged, so a tap never
 *     turns into a drag;
 *   - the tap gesture is exclusive with pinch, so pinching cannot select.
 */
export function InteractiveChartWheel({
  size,
  planets,
  aspects,
  houses,
  focusedPlanet = null,
  selection,
  onSelectPlanet,
  onSelectAspect,
  onSelectHouse,
}: Props) {
  const scale = useSharedValue(MIN_WHEEL_SCALE)
  const savedScale = useSharedValue(MIN_WHEEL_SCALE)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const center = size / 2

  // Mirrors the shared values on the JS side so `pan.enabled` and the hit
  // test can read them. The shared values remain the source of truth for the
  // transform itself, which stays entirely on the UI thread.
  const [isZoomed, setIsZoomed] = useState(false)
  const [view, setView] = useState({ scale: MIN_WHEEL_SCALE, x: 0, y: 0 })

  const syncView = useCallback((scale: number, x: number, y: number) => {
    setView({ scale, x, y })
    setIsZoomed(scale > MIN_WHEEL_SCALE + 0.01)
  }, [])

  // The same endpoints the wheel draws, so a tap is tested against what is
  // actually on screen rather than a second copy of the geometry.
  const planetPoints = useMemo(
    () => wheelPlanetPoints(size, planets),
    [size, planets]
  )
  const aspectSegments = useMemo(
    () => wheelAspectSegments(size, planets, aspects),
    [size, planets, aspects]
  )
  const houseBand = useMemo(() => wheelHouseBand(size), [size])

  /**
   * Resolve a tap on the frame to a selection.
   *
   * The gesture detector is attached to the untransformed frame, so the touch
   * has to be pushed back through the current zoom and pan before it can be
   * compared with wheel-space geometry. Planets are tested first and win
   * outright inside their radius, even when an aspect passes through them.
   */
  const handleTap = useCallback(
    (x: number, y: number) => {
      const local = inverseTransformPoint(
        { x, y },
        view.x,
        view.y,
        view.scale,
        center
      )

      const planetIndex = nearestPointIndex(
        local,
        planetPoints,
        PLANET_HIT_RADIUS
      )

      if (planetIndex != null) {
        // The planet's own 48dp control already handled this touch and
        // resolved it to the nearest planet. Selecting again here fired a
        // second, differently-resolved selection, which is what made a tap in
        // a cluster briefly land on a neighbour before settling.
        return
      }

      /*
       * Aspects before houses.
       *
       * The aspect corridor is narrow and its endpoints sit just inside the
       * house band, so testing lines first keeps them reachable; the house
       * band then catches everything else in the ring, which is most of it.
       */
      const aspectIndex = nearestSegmentIndex(
        local,
        aspectSegments,
        ASPECT_HIT_TOLERANCE
      )

      if (aspectIndex != null) {
        onSelectAspect(aspectIndex)
        return
      }

      const house = houseAtPoint(local, houseBand, houses)

      if (house != null) {
        onSelectHouse(house)
        return
      }

      // Nothing eligible under the finger: clear.
      onSelectAspect(null)
    },
    [
      view,
      center,
      planetPoints,
      aspectSegments,
      houseBand,
      houses,
      onSelectAspect,
      onSelectHouse,
    ]
  )

  const applyScale = useCallback(
    (next: number) => {
      const clamped = clampScale(next)
      scale.value = withTiming(clamped, { duration: 160 })
      savedScale.value = clamped

      const x = clampTranslation(translateX.value, size, clamped)
      const y = clampTranslation(translateY.value, size, clamped)
      translateX.value = withTiming(x, { duration: 160 })
      translateY.value = withTiming(y, { duration: 160 })
      savedTranslateX.value = x
      savedTranslateY.value = y
      syncView(clamped, x, y)
    },
    [
      scale,
      savedScale,
      translateX,
      translateY,
      savedTranslateX,
      savedTranslateY,
      size,
      syncView,
    ]
  )

  const reset = useCallback(
    () => applyScale(MIN_WHEEL_SCALE),
    [applyScale]
  )

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })
    .onUpdate((event) => {
      const next = clampScale(savedScale.value * event.scale)

      // Anchor the zoom under the fingers rather than the wheel's centre.
      translateX.value = clampTranslation(
        focalTranslation(
          savedTranslateX.value,
          event.focalX,
          center,
          savedScale.value,
          next
        ),
        size,
        next
      )
      translateY.value = clampTranslation(
        focalTranslation(
          savedTranslateY.value,
          event.focalY,
          center,
          savedScale.value,
          next
        ),
        size,
        next
      )
      scale.value = next
    })
    .onEnd(() => {
      savedScale.value = scale.value
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
      runOnJS(syncView)(scale.value, translateX.value, translateY.value)
    })

  /*
   * Pan is disabled while fitted.
   *
   * Clamping alone was not enough: an active pan still claims the drag from
   * the parent ScrollView even when it produces no movement, so the page
   * stopped scrolling over the wheel. Disabling it outright at 1x hands the
   * gesture back to the ScrollView.
   */
  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .averageTouches(true)
    .onStart(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })
    .onUpdate((event) => {
      // At 1x the clamp is zero, so the wheel cannot move and the parent
      // ScrollView keeps the drag.
      translateX.value = clampTranslation(
        savedTranslateX.value + event.translationX,
        size,
        scale.value
      )
      translateY.value = clampTranslation(
        savedTranslateY.value + event.translationY,
        size,
        scale.value
      )
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
      runOnJS(syncView)(scale.value, translateX.value, translateY.value)
    })

  /*
   * Taps are constrained by movement, not by pointer count.
   *
   * RNGH 2.28's TapGesture has no `maxPointers` -- it exposes minPointers,
   * numberOfTaps, maxDistance, maxDuration and maxDelay only. So the "fail as
   * soon as a second finger appears" guarantee is met two other ways:
   *
   *   1. Race (below) means the taps never gate the pinch in the first place.
   *   2. maxDistance/maxDuration make a tap fail the moment fingers travel or
   *      linger, which is exactly what happens at the start of a pinch.
   *
   * Together these give the same outcome the pointer cap was meant to: a
   * two-finger gesture reaches the pinch recogniser without waiting.
   */
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDistance(TAP_SLOP)
    .maxDuration(TAP_MAX_DURATION)
    .onEnd((event: { x: number; y: number }) => {
      runOnJS(handleTap)(event.x, event.y)
    })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(TAP_SLOP)
    .onEnd(() => {
      runOnJS(reset)()
    })

  /*
   * Two independent groups, raced against each other:
   *
   *   continuous = pinch + pan, recognised together
   *   taps       = double tap preferred over single tap
   *
   * Racing them means a two-finger pinch never queues behind a one-finger tap
   * recogniser. Within the tap group Exclusive is correct and harmless: it
   * only delays the single tap, which has nothing to block.
   */
  const composed = Gesture.Race(
    Gesture.Simultaneous(pinch, pan),
    Gesture.Exclusive(doubleTap, singleTap)
  )

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <View
      testID="interactive-chart-wheel"
      style={[styles.frame, { width: size, height: size }]}
      accessibilityActions={[
        { name: 'zoomIn', label: 'Zoom into chart' },
        { name: 'zoomOut', label: 'Zoom out of chart' },
        { name: 'resetZoom', label: 'Reset chart to fitted size' },
      ]}
      onAccessibilityAction={(event) => {
        const action = event.nativeEvent.actionName

        if (action === 'zoomIn') {
          applyScale(savedScale.value + ACCESSIBILITY_ZOOM_STEP)
        } else if (action === 'zoomOut') {
          applyScale(savedScale.value - ACCESSIBILITY_ZOOM_STEP)
        } else if (action === 'resetZoom') {
          reset()
        }
      }}
    >
      <GestureDetector gesture={composed}>
        {/* Untransformed. Tap coordinates therefore arrive in frame space and
            are inverted explicitly, rather than depending on how the platform
            reports coordinates inside a transformed view. */}
        <View testID="chart-wheel-gesture-surface" style={styles.surface}>
          <Animated.View testID="chart-wheel-transform" style={wheelStyle}>
            <ChartWheel
            size={size}
            planets={planets}
            aspects={aspects}
            houses={houses}
            focusedPlanet={focusedPlanet}
            selection={selection}
              onSelectPlanet={onSelectPlanet}
              onSelectAspect={onSelectAspect}
            />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  )
}

export { MAX_WHEEL_SCALE, MIN_WHEEL_SCALE }

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  surface: {
    flex: 1,
  },
})
