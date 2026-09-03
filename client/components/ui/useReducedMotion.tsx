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
 * Naksha has no motion system: backgrounds are static and nothing animates.
 * This exists so the one documented consequence — decorative background layers
 * fall back to `flat` — is observed safely rather than retrofitted later.
 *
 * The value is tri-state on purpose:
 *
 *   null   the platform setting has not resolved yet
 *   false  reduced motion is off
 *   true   reduced motion is on
 *
 * Callers treat `null` as "render the calm thing". Because the platform read is
 * async, assuming `false` up front would show decoration and then snatch it
 * away from exactly the users who asked for less; assuming `true` would flash
 * decoration in for everyone else. Holding decoration until the answer arrives
 * costs one quiet frame and avoids both.
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
