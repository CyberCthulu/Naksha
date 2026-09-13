import { buildCurrentSky, formatSkyPosition } from '../currentSky'

describe('current sky calculations', () => {
  it('calculates all ten bodies for an instant without a birth profile', () => {
    const at = new Date('2026-09-12T12:00:00Z')
    const sky = buildCurrentSky(at)
    expect(sky.planets.map((planet) => planet.name)).toEqual([
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
    for (const planet of sky.planets) {
      expect(planet.lon).toBeGreaterThanOrEqual(0)
      expect(planet.lon).toBeLessThan(360)
    }
    // A snapshot must retain its calculation time even if the caller mutates its Date.
    at.setUTCFullYear(2000)
    expect(sky.evaluatedAt.toISOString()).toBe('2026-09-12T12:00:00.000Z')
    expect(sky.aspects.length).toBeGreaterThan(0)
    for (const aspect of sky.aspects) {
      expect(sky.planets.some((planet) => planet.name === aspect.a)).toBe(true)
      expect(sky.planets.some((planet) => planet.name === aspect.b)).toBe(true)
    }
  })

  it('advances the sky with elapsed time', () => {
    const today = buildCurrentSky(new Date('2026-09-12T12:00:00Z'))
    const tomorrow = buildCurrentSky(new Date('2026-09-13T12:00:00Z'))
    const movement = (name: string) =>
      (tomorrow.planets.find((planet) => planet.name === name)!.lon -
        today.planets.find((planet) => planet.name === name)!.lon +
        360) %
      360
    expect(movement('Sun')).toBeGreaterThan(0.9)
    expect(movement('Sun')).toBeLessThan(1.1)
    expect(movement('Moon')).toBeGreaterThan(10)
    expect(movement('Moon')).toBeLessThan(16)
  })

  it('rejects an invalid time', () => {
    expect(() => buildCurrentSky(new Date('invalid'))).toThrow(
      'Invalid sky timestamp'
    )
  })

  it.each([
    [0, '0°00′ Aries'],
    [29.9999, '29°59′ Aries'],
    [30, '0°00′ Taurus'],
    [359.9999, '29°59′ Pisces'],
    [360, '0°00′ Aries'],
    [-0.001, '29°59′ Pisces'],
  ])('keeps longitude %s in its correct sign', (longitude, expected) => {
    expect(formatSkyPosition(longitude)).toBe(expected)
  })
})
