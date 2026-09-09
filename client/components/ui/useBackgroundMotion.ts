import { useEffect, useRef } from 'react'
import { Animated, AppState, Easing, type AppStateStatus } from 'react-native'

import { useReducedMotion } from './useReducedMotion'

/**
 * Fades a small decorative layer on the native thread. Hidden screens,
 * backgrounded apps, and unresolved accessibility settings stay still.
 */
export function useBackgroundMotion(enabled: boolean): Animated.Value {
  const opacity = useRef(new Animated.Value(0)).current
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!enabled || reduceMotion !== false) return

    let disposed = false
    let animation: Animated.CompositeAnimation | undefined

    const stop = () => {
      animation?.stop()
      animation = undefined
      opacity.stopAnimation()
      opacity.setValue(0)
    }

    const update = (state: AppStateStatus | null) => {
      if (disposed) return
      if (state !== 'active') {
        stop()
        return
      }
      // Repeated active events must not create concurrent loops.
      if (animation) return

      const options = {
        duration: 6000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { ...options, toValue: 1 }),
          Animated.timing(opacity, { ...options, toValue: 0 }),
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
  }, [enabled, opacity, reduceMotion])

  return opacity
}
