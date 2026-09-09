import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Reduced-motion foundation.
 *
 * Animated chart effects use this preference to show a static state. The
 * background is always static and does not need to subscribe or disappear.
 *
 * The value is tri-state on purpose:
 *
 *   null   the platform setting has not resolved yet
 *   false  reduced motion is off
 *   true   reduced motion is on
 *
 * Animated callers treat `null` as a request for their static state, so motion
 * never starts before the platform preference has resolved.
 */
const ReducedMotionContext = createContext<boolean | null | undefined>(
  undefined
)

function subscribeToReducedMotion(
  onChange: (enabled: boolean) => void
): () => void {
  let active = true

  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      if (active) onChange(enabled)
    })
    .catch(() => {
      // A platform that cannot answer is treated as "no preference expressed".
      if (active) onChange(false)
    })

  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled: boolean) => {
      if (active) onChange(enabled)
    }
  )

  return () => {
    active = false
    subscription?.remove?.()
  }
}

/**
 * Optional root provider. Reads the platform setting once for the whole tree so
 * that many consumers do not each open their own listener.
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)

  useEffect(() => subscribeToReducedMotion(setReduceMotion), [])

  return (
    <ReducedMotionContext.Provider value={reduceMotion}>
      {children}
    </ReducedMotionContext.Provider>
  )
}

/**
 * Returns the current reduced-motion preference, or null while it resolves.
 * Works with or without `ReducedMotionProvider`; when a provider is present no
 * additional listener is opened.
 */
export function useReducedMotion(): boolean | null {
  const provided = useContext(ReducedMotionContext)
  const hasProvider = provided !== undefined
  const [local, setLocal] = useState<boolean | null>(null)

  useEffect(() => {
    if (hasProvider) return
    return subscribeToReducedMotion(setLocal)
  }, [hasProvider])

  return hasProvider ? provided : local
}
