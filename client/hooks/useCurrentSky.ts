import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { buildCurrentSky, type CurrentSky } from '../lib/currentSky'

export const SKY_REFRESH_MS = 60_000

/** Refresh only on a visible, active screen; resume with the actual current time. */
export function useCurrentSky(enabled: boolean) {
  const [sky, setSky] = useState<CurrentSky | null>(null)
  const [error, setError] = useState(false)
  const [active, setActive] = useState(false)
  const canRefresh = useRef(false)

  const refresh = useCallback(() => {
    if (!canRefresh.current) return
    try {
      setSky(buildCurrentSky(new Date()))
      setError(false)
    } catch {
      // Preserve a last successful snapshot and its timestamp if refresh fails.
      setError(true)
    }
  }, [])

  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setInterval> | undefined
    const stop = () => {
      canRefresh.current = false
      if (timer !== undefined) clearInterval(timer)
      timer = undefined
    }
    const update = (state: AppStateStatus | null) => {
      if (disposed) return
      const running = enabled && state === 'active'
      setActive(running)
      if (!running) {
        stop()
      } else if (timer === undefined) {
        canRefresh.current = true
        refresh()
        timer = setInterval(refresh, SKY_REFRESH_MS)
      }
    }
    update(AppState.currentState)
    const subscription = AppState.addEventListener('change', update)
    return () => {
      disposed = true
      stop()
      subscription.remove()
    }
  }, [enabled, refresh])

  return { sky, error, refresh, active: enabled && active }
}
