// lib/timezones.ts
// A minimal list of common IANA time zones for user selection.

import { listTimeZones } from 'timezone-support'

export const TIMEZONES: string[] = listTimeZones()

export function isValidTimeZone(tz: string | null | undefined): tz is string {
  return !!tz && TIMEZONES.includes(tz)
}