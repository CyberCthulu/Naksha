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
