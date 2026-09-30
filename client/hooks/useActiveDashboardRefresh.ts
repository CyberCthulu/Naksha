import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { millisecondsUntilNextDashboardRefresh } from '../lib/dashboardFreshness'

/**
 * Refreshes once on activation and at the next hourly/local-day deadline.
 * No timer or AppState subscription survives while the route is inactive.
 */
export function useActiveDashboardRefresh(
  enabled: boolean,
  timeZone: string | null,
  lastSuccessfulEvaluationAt: number | null,
  onRefresh: (evaluatedAt: Date) => void
) {
  const refreshRef = useRef(onRefresh)

  useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled || !timeZone) return

    let disposed = false
    let running = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const stopTimer = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
    }

    const scheduleDeadline = () => {
      stopTimer()
      if (disposed) return

      const delay = millisecondsUntilNextDashboardRefresh(
        new Date(),
        timeZone,
        lastSuccessfulEvaluationAt
      )
      if (delay <= 0) return

      timer = setTimeout(() => {
        timer = undefined
        if (disposed) return
        refreshRef.current(new Date())
      }, delay)
    }

    const activate = () => {
      refreshRef.current(new Date())
      scheduleDeadline()
    }

    const update = (state: AppStateStatus | null) => {
      if (disposed) return

      if (state !== 'active') {
        running = false
        stopTimer()
      } else if (!running) {
        running = true
        activate()
      }
    }

    update(AppState.currentState)
    const subscription = AppState.addEventListener('change', update)

    return () => {
      disposed = true
      stopTimer()
      subscription.remove()
    }
  }, [enabled, lastSuccessfulEvaluationAt, timeZone])
}
