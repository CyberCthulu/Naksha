import { useEffect, useRef } from 'react'
import { Animated, AppState, Easing, type AppStateStatus } from 'react-native'

import { useReducedMotion } from './useReducedMotion'

/** A slow native phase shared by the sky's fixed cloud textures. */
export function useCosmicMotion(
  enabled: boolean,
  halfCycleMs: number
): Animated.Value {
  const phase = useRef(new Animated.Value(0)).current
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduceMotion !== false) return

    let disposed = false
    let animation: Animated.CompositeAnimation | undefined

    const stop = () => {
      animation?.stop()
      animation = undefined
      phase.stopAnimation()
      // Phase zero is a composed, visible sky, including when motion is off.
      phase.setValue(0)
    }

    const update = (state: AppStateStatus | null) => {
      if (disposed) return
      if (state !== 'active') {
        stop()
        return
      }
      if (animation) return

      const options = {
        duration: halfCycleMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
        isInteraction: false,
      }
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(phase, { ...options, toValue: 1 }),
          Animated.timing(phase, { ...options, toValue: 0 }),
        ])
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
  }, [enabled, halfCycleMs, phase, reduceMotion])

  return phase
}
