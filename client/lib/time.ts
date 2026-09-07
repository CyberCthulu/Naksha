// lib/time.ts
import { DateTime } from 'luxon'

export function birthToUTC(date: string, time: string, ianaZone: string) {
  // date: 'YYYY-MM-DD', time: 'HH:MM:SS'
  const [h,m,s] = time.split(':').map(Number)
  const dtLocal = DateTime.fromISO(`${date}T00:00:00`, { zone: ianaZone })
    .set({ hour: h||0, minute: m||0, second: s||0, millisecond: 0 })

  if (!dtLocal.isValid) throw new Error('Invalid birth datetime or zone')
  const dtUTC = dtLocal.toUTC()
  // astronomy-engine wants a JS Date or numbers
  return { jsDate: dtUTC.toJSDate(), dtUTC }
}

// Format helpers used across screens
export function formatDateForDb(d: Date) {
  return d.toISOString().split('T')[0]
}

export function formatTimeForDb(d: Date) {
  return d.toTimeString().split(' ')[0]
}

export function formatShortTimeFromHHMM(timeStr: string | null | undefined) {
  if (!timeStr) return '—'
  const [h, m] = String(timeStr).split(':')
  const d = new Date()
  d.setHours(parseInt(h || '0', 10), parseInt(m || '0', 10), 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * "15 Sep 1997" from a stored 'YYYY-MM-DD' birth date.
 *
 * Parsed field by field, deliberately. A birth date is a calendar field, not
 * an instant: `new Date('1997-09-15')` is midnight UTC, which renders as the
 * 14th for anyone west of Greenwich. Reading the string's own numbers means
 * the date shown is always the date stored, on every device.
 *
 * This is why it is not the journal's timestamp formatter. Journal entries
 * *are* instants and should localise; birth dates must not.
 *
 * Returns null for anything unparseable so callers can omit the line rather
 * than print a placeholder over real content.
 */
export function formatBirthDate(value: string | null | undefined): string | null {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const monthName = MONTHS[month - 1]
  if (!monthName || day < 1 || day > 31) return null

  return `${day} ${monthName} ${year}`
}

/**
 * "15 Sep 1997 · 1:55 PM" from the stored date and time fields.
 *
 * Either half may be missing; the separator only appears when both sides do.
 */
export function formatBirthMoment(
  date: string | null | undefined,
  time: string | null | undefined
): string | null {
  const day = formatBirthDate(date)
  const clock = time ? formatShortTimeFromHHMM(time) : null
  const parts = [day, clock === '—' ? null : clock].filter(Boolean)

  return parts.length ? parts.join(' · ') : null
}
