// lib/timezones.ts
// A minimal list of common IANA time zones for user selection.

import { listTimeZones } from 'timezone-support'

export const TIMEZONES: string[] = listTimeZones()

export function isValidTimeZone(tz: string | null | undefined): tz is string {
  return !!tz && TIMEZONES.includes(tz)
}

const ABBR_TO_IANA: Record<string, string> = {
    PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  IST: 'Asia/Kolkata',
  GMT: 'Etc/GMT',
  UTC: 'Etc/UTC',
};

export function normalizeZone(raw:string | null | undefined): string | null {
  if (!raw) return null;
  const z = raw.trim();
  const mapped = ABBR_TO_IANA[z.toUpperCase()];
  if (mapped) return mapped;
  return isValidTimeZone(z) ? z : null;
}