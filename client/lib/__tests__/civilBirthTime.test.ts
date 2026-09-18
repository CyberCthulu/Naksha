import {
  BirthTimeResolutionError,
  classifyZonedCivilTime,
  civilDateFromPicker,
  civilDateToPicker,
  civilTimeFromPicker,
  civilTimeToPicker,
  parseCivilDate,
  parseCivilTime,
  prepareBirthMoment,
  resolveStoredBirthMoment,
  serializeCivilDate,
  serializeCivilTime,
  type CivilDate,
  type CivilTime,
} from '../time'

const DATE: CivilDate = { year: 1997, month: 9, day: 15 }
const TIME: CivilTime = { hour: 13, minute: 55 }

describe('civil birth data preservation', () => {
  it('round-trips picker adapter values as local civil fields', () => {
    expect(civilDateFromPicker(civilDateToPicker(DATE))).toEqual(DATE)
    expect(civilTimeFromPicker(civilTimeToPicker(TIME))).toEqual(TIME)
  })

  it.each([
    ['America/Los_Angeles', '1997-09-15T20:55:00.000Z'],
    ['Asia/Kolkata', '1997-09-15T08:25:00.000Z'],
    ['Pacific/Kiritimati', '1997-09-14T23:55:00.000Z'],
  ])('preserves 1997-09-15 in %s', (zone, expectedUtc) => {
    const result = prepareBirthMoment(DATE, TIME, zone)

    expect(result.birthDate).toBe('1997-09-15')
    expect(result.birthTime).toBe('13:55:00')
    expect(result.timeZone).toBe(zone)
    expect(result.birthUtcOffsetMinutes).toBeNull()
    expect(result.instant.utcIso).toBe(expectedUtc)
  })

  it('preserves leap day exactly', () => {
    expect(serializeCivilDate({ year: 2000, month: 2, day: 29 })).toBe(
      '2000-02-29'
    )
  })

  it('round-trips repeatedly at UTC+14 without date drift', () => {
    let stored = '1997-09-15'

    for (let cycle = 0; cycle < 5; cycle += 1) {
      const hydrated = parseCivilDate(stored)
      expect(hydrated).toEqual(DATE)
      stored = serializeCivilDate(hydrated!)
    }

    expect(stored).toBe('1997-09-15')
    expect(
      resolveStoredBirthMoment(
        stored,
        '13:55:00',
        'Pacific/Kiritimati'
      ).birthDate
    ).toBe('1997-09-15')
  })

  it('does not use the device zone when serializing a birthplace date', () => {
    const deviceZone = 'America/Los_Angeles'
    const birthplaceZone = 'Pacific/Kiritimati'
    expect(deviceZone).not.toBe(birthplaceZone)

    const result = prepareBirthMoment(DATE, TIME, birthplaceZone)
    expect(result.birthDate).toBe('1997-09-15')
  })
})

describe('strict civil validation', () => {
  it.each(['1997-02-29', '2000-02-30', '1997-13-01', '1997-00-01']) (
    'rejects invalid calendar value %s',
    (value) => {
      expect(parseCivilDate(value)).toBeNull()
      expect(() =>
        resolveStoredBirthMoment(value, '13:55:00', 'Etc/UTC')
      ).toThrow(BirthTimeResolutionError)
    }
  )

  it.each(['25:00', '99:99', '1:55 PM', 'malformed', '13:55:01']) (
    'rejects invalid clock value %s',
    (value) => {
      expect(parseCivilTime(value)).toBeNull()
      expect(() =>
        resolveStoredBirthMoment('1997-09-15', value, 'Etc/UTC')
      ).toThrow(BirthTimeResolutionError)
    }
  )

  it('rejects invalid civil objects instead of normalizing them', () => {
    expect(() =>
      serializeCivilDate({ year: 1997, month: 2, day: 29 })
    ).toThrow('valid birth date')
    expect(() => serializeCivilTime({ hour: 25, minute: 0 })).toThrow(
      'valid birth time'
    )
  })

  it('rejects unknown IANA zones', () => {
    expect(() => prepareBirthMoment(DATE, TIME, 'Mars/Olympus')).toThrow(
      'valid IANA time zone'
    )
  })
})

describe('zoned civil-time resolution', () => {
  it('classifies an ordinary local time as unambiguous', () => {
    const result = classifyZonedCivilTime(DATE, TIME, 'America/Los_Angeles')

    expect(result.status).toBe('unambiguous')
    if (result.status === 'unambiguous') {
      expect(result.option.offsetMinutes).toBe(-420)
      expect(result.option.utcIso).toBe('1997-09-15T20:55:00.000Z')
    }
  })

  it('classifies the Los Angeles spring-forward gap as nonexistent', () => {
    const result = classifyZonedCivilTime(
      { year: 2025, month: 3, day: 9 },
      { hour: 2, minute: 30 },
      'America/Los_Angeles'
    )

    expect(result).toEqual({ status: 'nonexistent' })
    expect(() =>
      resolveStoredBirthMoment(
        '2025-03-09',
        '02:30:00',
        'America/Los_Angeles'
      )
    ).toThrow('did not exist')
  })

  it('returns both Los Angeles fall-back occurrences in instant order', () => {
    const result = classifyZonedCivilTime(
      { year: 2025, month: 11, day: 2 },
      { hour: 1, minute: 30 },
      'America/Los_Angeles'
    )

    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') {
      expect(result.options.map((option) => option.offsetMinutes)).toEqual([
        -420,
        -480,
      ])
      expect(result.options.map((option) => option.utcIso)).toEqual([
        '2025-11-02T08:30:00.000Z',
        '2025-11-02T09:30:00.000Z',
      ])
    }
  })

  it('requires an explicit fold choice and reproduces each selected instant', () => {
    expect(() =>
      resolveStoredBirthMoment(
        '2025-11-02',
        '01:30:00',
        'America/Los_Angeles'
      )
    ).toThrow('occurred twice')

    const earlier = resolveStoredBirthMoment(
      '2025-11-02',
      '01:30:00',
      'America/Los_Angeles',
      -420
    )
    const later = resolveStoredBirthMoment(
      '2025-11-02',
      '01:30:00',
      'America/Los_Angeles',
      -480
    )

    expect(earlier.birthUtcOffsetMinutes).toBe(-420)
    expect(earlier.instant.utcIso).toBe('2025-11-02T08:30:00.000Z')
    expect(later.birthUtcOffsetMinutes).toBe(-480)
    expect(later.instant.utcIso).toBe('2025-11-02T09:30:00.000Z')
  })

  it('rejects a stale or forged fold offset', () => {
    expect(() =>
      resolveStoredBirthMoment(
        '2025-11-02',
        '01:30:00',
        'America/Los_Angeles',
        0
      )
    ).toThrow('not valid')
  })
})
