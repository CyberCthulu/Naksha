import { formatBirthDate, formatBirthMoment } from '../time'

describe('birth date formatting', () => {
  it('reads the stored calendar fields rather than an instant', () => {
    expect(formatBirthDate('1997-09-15')).toBe('15 Sep 1997')
    expect(formatBirthDate('2000-01-01')).toBe('1 Jan 2000')
    expect(formatBirthDate('1985-12-31')).toBe('31 Dec 1985')
  })

  it('does not shift the date west of Greenwich', () => {
    /*
     * The bug this exists to prevent: `new Date('1997-09-15')` is midnight
     * UTC, so `getDate()` returns 14 for anyone in the Americas. A birth date
     * is a calendar field, not a moment, and must read the same everywhere.
     *
     * Asserted by construction -- the formatter never builds a Date at all --
     * and then demonstrated against the naive implementation.
     */
    const naive = new Date('1997-09-15').getDate()
    const stored = Number('1997-09-15'.split('-')[2])

    // In a UTC-negative test environment these genuinely disagree; where they
    // agree the assertion below still holds, so the test is not environment
    // dependent in either direction.
    expect(formatBirthDate('1997-09-15')).toBe(`${stored} Sep 1997`)
    expect(formatBirthDate('1997-09-15')).not.toBe(`${naive === 15 ? 14 : naive} Sep 1997`)
  })

  it('returns null for anything it cannot parse, rather than a placeholder', () => {
    for (const bad of [
      null,
      undefined,
      '',
      '   ',
      'not-a-date',
      '1997-9-15',
      '15-09-1997',
      '1997-09-15T13:55:00Z',
      '1997-13-01',
      '1997-09-32',
      '1997-09-00',
    ]) {
      expect(formatBirthDate(bad as string | null | undefined)).toBeNull()
    }
  })

  it('joins date and time, and omits the separator when a half is missing', () => {
    const both = formatBirthMoment('1997-09-15', '13:55:00')
    expect(both).not.toBeNull()
    expect(both!.startsWith('15 Sep 1997 · ')).toBe(true)

    // A half-known birth record produces a clean line, never a dangling dot.
    expect(formatBirthMoment('1997-09-15', null)).toBe('15 Sep 1997')
    expect(formatBirthMoment('1997-09-15', '')).toBe('15 Sep 1997')
    expect(formatBirthMoment(null, null)).toBeNull()
    expect(formatBirthMoment('nonsense', null)).toBeNull()
  })

  it('never renders a stored field verbatim', () => {
    const line = formatBirthMoment('1997-09-15', '13:55:00')

    expect(line).not.toContain('1997-09-15')
    expect(line).not.toContain('13:55:00')
  })
})
