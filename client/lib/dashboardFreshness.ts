import { DateTime } from 'luxon'

export const DASHBOARD_GUIDANCE_REFRESH_MS = 60 * 60 * 1_000

export type DashboardGuidanceKeys = {
  localDate: string
  weekStartDate: string
}

let dashboardDataRevision = 0

export function getDashboardDataRevision(): number {
  return dashboardDataRevision
}

export function markDashboardDataStale(): void {
  dashboardDataRevision += 1
}

function localTime(at: Date, timeZone: string): DateTime {
  if (Number.isNaN(at.getTime())) {
    throw new Error('Invalid dashboard evaluation date')
  }

  const local = DateTime.fromJSDate(at, { zone: timeZone })
  if (!local.isValid) {
    throw new Error('Invalid dashboard time zone')
  }

  return local
}

function requireIsoDate(value: string | null): string {
  if (!value) throw new Error('Could not resolve dashboard local date')
  return value
}

export function getDashboardGuidanceKeys(
  at: Date,
  timeZone: string
): DashboardGuidanceKeys {
  const local = localTime(at, timeZone)

  return {
    localDate: requireIsoDate(local.toISODate()),
    weekStartDate: requireIsoDate(local.startOf('week').toISODate()),
  }
}

export function millisecondsUntilNextLocalDay(
  at: Date,
  timeZone: string
): number {
  const local = localTime(at, timeZone)
  const nextLocalDay = local.plus({ days: 1 }).startOf('day')
  return Math.max(1, nextLocalDay.toMillis() - at.getTime())
}

export function millisecondsUntilNextDashboardRefresh(
  at: Date,
  timeZone: string,
  lastSuccessfulEvaluationAt: number | null
): number {
  if (lastSuccessfulEvaluationAt == null) return 0

  const untilHourlyDeadline =
    lastSuccessfulEvaluationAt +
    DASHBOARD_GUIDANCE_REFRESH_MS -
    at.getTime()

  return Math.max(
    0,
    Math.min(
      untilHourlyDeadline,
      millisecondsUntilNextLocalDay(at, timeZone)
    )
  )
}
