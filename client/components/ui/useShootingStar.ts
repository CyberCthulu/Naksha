import { useEffect, useMemo } from 'react'
import { Animated, AppState, Easing, type AppStateStatus } from 'react-native'

import { celestialConfig } from './celestialConfig'
import { useReducedMotion } from './useReducedMotion'

// Fractional origins spread rare flights across the sky without randomness.
// Every trail points along the same gentle downward diagonal as its travel.
const TRAJECTORIES = [
  { x: -0.12, y: 0.08, distance: 0.88 },
  { x: 0.12, y: 0.29, distance: 0.76 },
  { x: -0.16, y: 0.5, distance: 0.94 },
] as const

export const SHOOTING_STAR_SLOPE = 0.45

/** One short native flight, then a long idle timer. No per-frame JS work. */
export function useShootingStar(
  enabled: boolean,
  width: number,
  height: number
) {
  const reduceMotion = useReducedMotion()
  const motion = useMemo(() => {
    const progress = new Animated.Value(0)
    const origin = new Animated.ValueXY({ x: 0, y: 0 })
    const distance = new Animated.Value(0)
    const travel = Animated.multiply(progress, distance)

    return {
      progress,
      origin,
      distance,
      translateX: Animated.add(origin.x, travel),
      translateY: Animated.add(
        origin.y,
        Animated.multiply(travel, SHOOTING_STAR_SLOPE)
      ),
      opacity: progress.interpolate({
        inputRange: [0, 0.12, 0.62, 1],
        outputRange: [
          0,
          celestialConfig.shootingStar.peakOpacity,
          celestialConfig.shootingStar.peakOpacity,
          0,
        ],
        extrapolate: 'clamp',
      }),
    }
  }, [])

  useEffect(() => {
    if (!enabled || reduceMotion !== false || width <= 0 || height <= 0) return

    let disposed = false
    let active = false
    let generation = 0
    let flightIndex = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let animation: Animated.CompositeAnimation | undefined

    const stop = () => {
      // Invalidate before stop(), which can synchronously call completion.
      generation += 1
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      const previous = animation
      animation = undefined
      previous?.stop()
      motion.progress.stopAnimation()
      motion.progress.setValue(0)
    }

    const schedule = (delay: number) => {
      if (disposed || !active || timer !== undefined || animation) return
      const scheduledGeneration = generation
      timer = setTimeout(() => {
        if (disposed || !active || scheduledGeneration !== generation) return
        timer = undefined

        const trajectory = TRAJECTORIES[flightIndex % TRAJECTORIES.length]
        motion.origin.setValue({ x: width * trajectory.x, y: height * trajectory.y })
        motion.distance.setValue(Math.min(width * trajectory.distance, 520))
        motion.progress.setValue(0)

        const current = Animated.timing(motion.progress, {
          toValue: 1,
          duration: celestialConfig.shootingStar.durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        })
        animation = current
        current.start(({ finished }) => {
          if (
            disposed ||
            !active ||
            scheduledGeneration !== generation ||
            animation !== current
          ) return

          animation = undefined
          motion.progress.setValue(0)
          if (!finished) return

          const gaps = celestialConfig.shootingStar.gapsMs
          const delay = gaps[flightIndex % gaps.length]
          flightIndex += 1
          schedule(delay)
        })
      }, delay)
    }

    const update = (state: AppStateStatus | null) => {
      if (disposed) return
      if (state !== 'active') {
        active = false
        stop()
        return
      }
      // Repeated active events must neither duplicate nor bypass the idle gap.
      if (active) return
      active = true
      schedule(celestialConfig.shootingStar.firstDelayMs)
    }

    const subscription = AppState.addEventListener('change', update)
    update(AppState.currentState)

    return () => {
      disposed = true
      active = false
      subscription.remove()
      stop()
    }
  }, [enabled, height, motion, reduceMotion, width])

  return motion
}
