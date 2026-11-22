import { useEffect, useRef } from 'react'
import { Animated, AppState, Easing, type AppStateStatus } from 'react-native'

import { useReducedMotion } from './useReducedMotion'

export const CELESTIAL_LOADING_CYCLE_MS = 12000

/**
 * A native 0–1 phase for a loader's rotation, glow, and lunar interlude.
 * Render the same visible sun at both endpoints so the native loop's reset
 * is seamless. Phase zero is also the static accessibility fallback.
 */
export function useCelestialLoadingMotion(enabled: boolean): Animated.Value {
  const phase = useRef(new Animated.Value(0)).current
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduceMotion !== false) return

    let disposed = false
    let animation: Animated.CompositeAnimation | undefined

    const stop = () => {
      const previous = animation
      animation = undefined
      previous?.stop()
      phase.stopAnimation()
      phase.setValue(0)
    }

    const update = (state: AppStateStatus | null) => {
      if (disposed) return
      if (state !== 'active') {
        stop()
        return
      }
      // Some platforms repeat active events; keep exactly one native loop.
      if (animation) return

      animation = Animated.loop(
        Animated.timing(phase, {
          toValue: 1,
          duration: CELESTIAL_LOADING_CYCLE_MS,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        })
      )
      animation.start()
    }

    const subscription = AppState.addEventListener('change', update)
    update(AppState.currentState)

    return () => {
      disposed = true
      subscription.remove()
      stop()
    }
  }, [enabled, phase, reduceMotion])

  return phase
}
