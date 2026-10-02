// lib/timezones.ts
// A minimal list of common IANA time zones for user selection.

import { listTimeZones } from 'timezone-support'

const IANA_TIME_ZONES = listTimeZones()
const IANA_TIME_ZONE_SET = new Set(IANA_TIME_ZONES)

// The picker offers geographic zones plus UTC. Short fixed-offset names and
// POSIX/Etc aliases are valid for historical calculation, but are too easy to
// confuse with geographic zones that observe different daylight-saving rules.
export const TIMEZONES: string[] = IANA_TIME_ZONES.filter(
  (zone) =>
    zone === 'Etc/UTC' ||
    (zone.includes('/') && !zone.startsWith('Etc/GMT'))
)

export function isValidTimeZone(tz: string | null | undefined): boolean {
  return !!tz && IANA_TIME_ZONE_SET.has(tz)
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
  if (isValidTimeZone(z)) return z;
  const mapped = ABBR_TO_IANA[z.toUpperCase()];
  if (mapped) return mapped;
  return null;
}

export function getDeviceTimeZoneNormalized(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  return normalizeZone(detected) || 'Etc/UTC'
}
