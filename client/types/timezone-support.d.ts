//types/timezone-support.d.ts

declare module 'timezone-support' {
  /** Returns an array of IANA time zone IDs (e.g., "America/Los_Angeles"). */
  export function listTimeZones(): string[];
}
