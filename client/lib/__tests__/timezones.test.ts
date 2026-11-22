import { prepareBirthMoment } from '../time'
import { isValidTimeZone, normalizeZone, TIMEZONES } from '../timezones'

describe('timezone identity and selection', () => {
  it.each(['EST', 'MST', 'HST'])(
    'preserves valid fixed-offset IANA zone %s',
    (zone) => {
      expect(isValidTimeZone(zone)).toBe(true)
      expect(normalizeZone(zone)).toBe(zone)
    }
  )

  it.each([
    'America/New_York',
    'America/Denver',
    'America/Phoenix',
    'Pacific/Honolulu',
    'Asia/Kolkata',
  ])('preserves geographic IANA zone %s', (zone) => {
    expect(isValidTimeZone(zone)).toBe(true)
    expect(normalizeZone(zone)).toBe(zone)
    expect(TIMEZONES).toContain(zone)
  })

  it('keeps fixed and legacy aliases out of the user-facing picker', () => {
    expect(TIMEZONES).toContain('Etc/UTC')
    expect(TIMEZONES).not.toEqual(
      expect.arrayContaining([
        'EST',
        'MST',
        'HST',
        'CET',
        'EET',
        'MET',
        'WET',
        'CST6CDT',
        'EST5EDT',
        'MST7MDT',
        'PST8PDT',
        'Etc/GMT+5',
        'Etc/GMT-5',
      ])
    )
  })

  it.each([
    ['PST', 'America/Los_Angeles'],
    ['CST', 'America/Chicago'],
    ['IST', 'Asia/Kolkata'],
  ])('maps only unsupported legacy value %s to %s', (legacy, expected) => {
    expect(isValidTimeZone(legacy)).toBe(false)
    expect(normalizeZone(legacy)).toBe(expected)
  })

  it('does not treat fixed-offset MST as DST-observing America/Denver in summer', () => {
    const date = { year: 2025, month: 7, day: 15 }
    const time = { hour: 12, minute: 0 }
    const fixed = prepareBirthMoment(date, time, 'MST')
    const geographic = prepareBirthMoment(date, time, 'America/Denver')

    expect(fixed.timeZone).toBe('MST')
    expect(fixed.instant.offsetMinutes).toBe(-420)
    expect(fixed.instant.utcIso).toBe('2025-07-15T19:00:00.000Z')
    expect(geographic.timeZone).toBe('America/Denver')
    expect(geographic.instant.offsetMinutes).toBe(-360)
    expect(geographic.instant.utcIso).toBe('2025-07-15T18:00:00.000Z')
  })
})
