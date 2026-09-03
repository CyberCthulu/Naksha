import {
  ASPECT_HIT_TOLERANCE,
  clampScale,
  clampTranslation,
  distanceToSegment,
  focalTranslation,
  MAX_WHEEL_SCALE,
  MIN_WHEEL_SCALE,
  maxTranslation,
  nearestSegmentIndex,
  type Segment,
} from '../chartWheelInteraction'

describe('scale clamping', () => {
  it('holds a continuous scale between the documented bounds', () => {
    expect(MIN_WHEEL_SCALE).toBe(1)
    expect(MAX_WHEEL_SCALE).toBe(3)

    expect(clampScale(1.734)).toBeCloseTo(1.734)
    expect(clampScale(0.2)).toBe(MIN_WHEEL_SCALE)
    expect(clampScale(9)).toBe(MAX_WHEEL_SCALE)
  })

  it('falls back to fitted for any non-finite scale', () => {
    // A transform driven by NaN or Infinity is worse than one that is simply
    // fitted, so both resolve to the minimum rather than the nearest bound.
    expect(clampScale(Number.NaN)).toBe(MIN_WHEEL_SCALE)
    expect(clampScale(Number.POSITIVE_INFINITY)).toBe(MIN_WHEEL_SCALE)
    expect(clampScale(Number.NEGATIVE_INFINITY)).toBe(MIN_WHEEL_SCALE)
  })
})

describe('translation clamping', () => {
  it('allows no movement at all while fitted', () => {
    expect(maxTranslation(320, 1)).toBe(0)
    expect(clampTranslation(500, 320, 1)).toBeCloseTo(0)
    expect(clampTranslation(-500, 320, 1)).toBeCloseTo(0)
  })

  it('allows only the overflow the zoom created', () => {
    // At 2x a 320 wheel renders 640, so 160 of slack each side.
    expect(maxTranslation(320, 2)).toBe(160)
    expect(clampTranslation(400, 320, 2)).toBe(160)
    expect(clampTranslation(-400, 320, 2)).toBe(-160)
    expect(clampTranslation(90, 320, 2)).toBe(90)
  })

  it('cannot be pushed off-screen by an absurd value', () => {
    const clamped = clampTranslation(1e9, 320, MAX_WHEEL_SCALE)
    expect(clamped).toBe(maxTranslation(320, MAX_WHEEL_SCALE))
    expect(clampTranslation(Number.NaN, 320, 2)).toBe(0)
  })
})

describe('focal point anchoring', () => {
  const size = 320
  const center = size / 2

  it('keeps the pinched point in place rather than zooming about the centre', () => {
    const focal = 240 // right of centre
    const next = focalTranslation(0, focal, center, 1, 2)

    // Zooming about the centre would leave translation at 0; anchoring the
    // focal point pulls the wheel back so the pinched detail stays put.
    expect(next).toBeLessThan(0)
    expect(next).toBeCloseTo(-(focal - center))
  })

  it('is a no-op when the pinch is centred', () => {
    expect(focalTranslation(0, center, center, 1, 2.4)).toBeCloseTo(0)
  })

  it('is a no-op when the scale does not change', () => {
    expect(focalTranslation(42, 300, center, 2, 2)).toBeCloseTo(42)
  })
})

describe('aspect hit testing', () => {
  const horizontal: Segment = { a: { x: 0, y: 100 }, b: { x: 200, y: 100 } }
  const vertical: Segment = { a: { x: 100, y: 0 }, b: { x: 100, y: 200 } }

  it('measures distance to the segment, not the infinite line', () => {
    expect(distanceToSegment({ x: 100, y: 110 }, horizontal)).toBeCloseTo(10)
    // Beyond the end: distance is to the endpoint.
    expect(distanceToSegment({ x: 260, y: 100 }, horizontal)).toBeCloseTo(60)
  })

  it('handles a degenerate zero-length segment', () => {
    const point: Segment = { a: { x: 10, y: 10 }, b: { x: 10, y: 10 } }
    expect(distanceToSegment({ x: 13, y: 14 }, point)).toBeCloseTo(5)
  })

  it('selects a line the finger is near but not exactly on', () => {
    const near = { x: 100, y: 100 + ASPECT_HIT_TOLERANCE - 2 }
    expect(nearestSegmentIndex(near, [horizontal])).toBe(0)
  })

  it('uses a corridor far wider than the visible stroke', () => {
    // Aspect strokes are between 1.2 and 2.0 wide.
    expect(ASPECT_HIT_TOLERANCE).toBeGreaterThan(10)
  })

  it('ignores taps beyond the tolerance', () => {
    const far = { x: 100, y: 100 + ASPECT_HIT_TOLERANCE + 5 }
    expect(nearestSegmentIndex(far, [horizontal])).toBeNull()
    expect(nearestSegmentIndex({ x: 5, y: 5 }, [horizontal, vertical])).toBeNull()
  })

  it('picks the closest of several candidates', () => {
    // 40 from the vertical line, 4 from the horizontal one.
    const point = { x: 60, y: 96 }
    expect(nearestSegmentIndex(point, [vertical, horizontal])).toBe(1)
    expect(nearestSegmentIndex(point, [horizontal, vertical])).toBe(0)
  })

  it('resolves an intersection deterministically to the lowest index', () => {
    const exactlyOnBoth = { x: 100, y: 100 }

    expect(nearestSegmentIndex(exactlyOnBoth, [horizontal, vertical])).toBe(0)
    expect(nearestSegmentIndex(exactlyOnBoth, [vertical, horizontal])).toBe(0)

    // Repeated calls never disagree.
    for (let i = 0; i < 20; i += 1) {
      expect(nearestSegmentIndex(exactlyOnBoth, [horizontal, vertical])).toBe(0)
    }
  })

  it('returns null for an empty aspect set', () => {
    expect(nearestSegmentIndex({ x: 1, y: 1 }, [])).toBeNull()
  })
})
