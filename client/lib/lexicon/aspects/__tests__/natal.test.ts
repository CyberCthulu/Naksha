import {
  CANONICAL_PLANET_KEYS,
  getAspectMeaning,
  getNatalAspectMeaning,
  isPlanetKey,
} from '../..'

describe('natal aspect interpretation eligibility', () => {
  it('recognizes exactly the canonical ten bodies', () => {
    expect(CANONICAL_PLANET_KEYS).toEqual([
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
      'Pluto',
    ])
    expect(CANONICAL_PLANET_KEYS.every(isPlanetKey)).toBe(true)
    expect(isPlanetKey('UnknownBody')).toBe(false)
  })

  it('preserves current generic interpretation for a canonical pair', () => {
    expect(getNatalAspectMeaning('Moon', 'Saturn', 'square')).toBe(
      getAspectMeaning('square')
    )
  })

  it.each([
    ['UnknownBody', 'Saturn', 'square'],
    ['Moon', 'UnknownBody', 'square'],
    ['UnknownBody', 'Saturn', 'trine'],
  ])(
    'does not interpret unsupported identity %s %s %s',
    (first, second, aspect) => {
      expect(getNatalAspectMeaning(first, second, aspect)).toBeNull()
    }
  )

  it('does not broaden acceptance to an unknown aspect key', () => {
    expect(
      getNatalAspectMeaning('Moon', 'Saturn', 'quincunx')
    ).toBeNull()
  })
})
