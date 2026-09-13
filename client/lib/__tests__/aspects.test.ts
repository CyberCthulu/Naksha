import {
  angularSeparation,
  ASPECT_RULES,
  calculateAspects,
} from '../aspects'

const planetsAt = (a: number, b: number) => [
  { name: 'Moon', lon: a },
  { name: 'Saturn', lon: b },
]

describe('angular separation', () => {
  it.each([
    [0, 0, 0],
    [0, 180, 180],
    [359, 1, 2],
    [-1, 1, 2],
    [1081, -719, 0],
    [1085, -725, 10],
    [-540, 0, 180],
  ])('measures %s° and %s° as %s° apart', (a, b, expected) => {
    expect(angularSeparation(a, b)).toBeCloseTo(expected, 12)
    expect(angularSeparation(b, a)).toBeCloseTo(expected, 12)
  })

  it.each([NaN, Infinity, -Infinity])(
    'rejects nonfinite longitude %s',
    (longitude) => {
      expect(() => angularSeparation(longitude, 0)).toThrow()
      expect(() => angularSeparation(0, longitude)).toThrow()
    }
  )
})

describe('aspect rules', () => {
  it('publishes the explicit angles and inclusive tolerances used by Sky Now', () => {
    expect(
      ASPECT_RULES.map(({ type, label, angle, orb }) => ({
        type,
        label,
        angle,
        orb,
      }))
    ).toEqual([
      { type: 'conj', label: 'Conjunction', angle: 0, orb: 6 },
      { type: 'opp', label: 'Opposition', angle: 180, orb: 6 },
      { type: 'trine', label: 'Trine', angle: 120, orb: 5 },
      { type: 'square', label: 'Square', angle: 90, orb: 5 },
      { type: 'sextile', label: 'Sextile', angle: 60, orb: 4 },
    ])
  })

  it.each(ASPECT_RULES)(
    'classifies an exact $label from both planet orders',
    ({ type, angle }) => {
      expect(calculateAspects(planetsAt(0, angle))).toEqual([
        { a: 'Moon', b: 'Saturn', type, orb: 0 },
      ])
      expect(calculateAspects(planetsAt(angle, 0))).toEqual([
        { a: 'Moon', b: 'Saturn', type, orb: 0 },
      ])
    }
  )

  it.each(ASPECT_RULES)(
    'includes $label at its limit and excludes positions just beyond it',
    ({ type, angle, orb }) => {
      const directions = angle === 0 ? [1] : angle === 180 ? [-1] : [-1, 1]
      for (const direction of directions) {
        const boundary = angle + direction * orb
        expect(calculateAspects(planetsAt(0, boundary))).toEqual([
          { a: 'Moon', b: 'Saturn', type, orb },
        ])
        // Rounding before comparison would incorrectly include this position.
        expect(
          calculateAspects(planetsAt(0, boundary + direction * 0.00001))
        ).toEqual([])
        expect(
          calculateAspects(planetsAt(0, boundary - direction * 0.00001))
        ).toEqual([
          expect.objectContaining({ a: 'Moon', b: 'Saturn', type }),
        ])
      }
    }
  )

  it('preserves calculated orb precision independently of display rounding', () => {
    const [aspect] = calculateAspects(
      planetsAt(194.059834486267, 12.918029729386733)
    )
    expect(aspect.type).toBe('opp')
    expect(aspect.orb).toBeCloseTo(1.1418047568802194, 12)
    expect(aspect.orb).not.toBe(Number(aspect.orb.toFixed(2)))
  })

  it('does not call a small nonzero orb an exact aspect', () => {
    const [aspect] = calculateAspects(planetsAt(0, 179.9999))
    expect(aspect.type).toBe('opp')
    expect(aspect.orb).toBeCloseTo(0.0001, 12)
    expect(aspect.orb).toBeGreaterThan(0)
  })

  it('normalizes both longitudes before finding aspects', () => {
    expect(calculateAspects(planetsAt(-720, 1260))).toEqual([
      { a: 'Moon', b: 'Saturn', type: 'opp', orb: 0 },
    ])
    expect(calculateAspects(planetsAt(719, -719))).toEqual([
      { a: 'Moon', b: 'Saturn', type: 'conj', orb: 2 },
    ])
  })

  it('returns each pair once and never pairs a body with itself', () => {
    expect(
      calculateAspects([
        { name: 'Sun', lon: 0 },
        { name: 'Moon', lon: 90 },
        { name: 'Saturn', lon: 180 },
      ])
    ).toEqual([
      { a: 'Sun', b: 'Moon', type: 'square', orb: 0 },
      { a: 'Sun', b: 'Saturn', type: 'opp', orb: 0 },
      { a: 'Moon', b: 'Saturn', type: 'square', orb: 0 },
    ])
    expect(calculateAspects([])).toEqual([])
    expect(calculateAspects([{ name: 'Moon', lon: 90 }])).toEqual([])
  })

  it('does not change its source positions', () => {
    const planets = planetsAt(-720, 1260)
    const original = planets.map((planet) => ({ ...planet }))
    calculateAspects(planets)
    expect(planets).toEqual(original)
  })

  it.each([NaN, Infinity, -Infinity])(
    'rejects a nonfinite planet longitude even without another planet: %s',
    (lon) => {
      expect(() => calculateAspects([{ name: 'Moon', lon }])).toThrow()
      expect(() => calculateAspects(planetsAt(0, lon))).toThrow()
    }
  )

  it.each(['', '   '])('rejects an empty planet name: %j', (name) => {
    expect(() => calculateAspects([{ name, lon: 0 }])).toThrow()
  })

  it('rejects duplicate names so a displayed pair cannot resolve to the wrong body', () => {
    expect(() =>
      calculateAspects([
        { name: 'Moon', lon: 0 },
        { name: 'Moon', lon: 180 },
      ])
    ).toThrow()
  })
})
