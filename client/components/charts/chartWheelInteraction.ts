// components/charts/chartWheelInteraction.ts

/**
 * Pure interaction maths for the chart wheel.
 *
 * Deliberately separate from both the drawing and the gesture layer: zoom
 * clamping, focal-point anchoring and hit testing are the parts most likely to
 * be wrong, and keeping them free of Reanimated and gesture-handler means they
 * can be tested directly rather than through a simulated pinch.
 *
 * Every function carries the 'worklet' directive so the gesture layer can call
 * it on the UI thread. They remain ordinary functions in Node.
 */

export const MIN_WHEEL_SCALE = 1
export const MAX_WHEEL_SCALE = 3

/**
 * Touch slop for aspect selection, in wheel-local points.
 *
 * 24 either side gives an interaction corridor of roughly 48 around a stroke
 * that is only 1.2-2.0 wide, which is what makes every aspect reachable rather
 * than only the ones that happen to fall under a finger.
 */
export const ASPECT_HIT_TOLERANCE = 24

/**
 * Touch slop for an aspect where it crosses the house band, in wheel-local
 * points.
 *
 * Every aspect line terminates at `rAspect`, which the wheel places *inside*
 * the house band rather than below it. At the full corridor each endpoint
 * therefore blankets the whole width of the band around its planet's
 * longitude, and a wedge holding several planets has almost no surface left
 * that resolves to the house. Tightening the corridor inside the band gives
 * the ring back to the houses while still taking a tap placed on the line --
 * which is all a conjunction, whose entire chord lies in the band, needs.
 */
export const ASPECT_BAND_TOLERANCE = 6

/** Radius of a planet's hit region, in wheel-local points. */
export const PLANET_HIT_RADIUS = 24

/** Extra slop either side of the visible house band, in wheel-local points. */
export const HOUSE_HIT_PADDING = 16

export type Point = { x: number; y: number }
export type Segment = { a: Point; b: Point }

export function clampScale(scale: number): number {
  'worklet'
  if (!Number.isFinite(scale)) return MIN_WHEEL_SCALE
  return Math.min(Math.max(scale, MIN_WHEEL_SCALE), MAX_WHEEL_SCALE)
}

/**
 * How far the wheel may be moved at a given scale.
 *
 * At 1x there is no slack, so the wheel cannot be nudged at all. Above that,
 * travel is limited to the overflow the zoom actually created, which is what
 * stops the wheel being flung off-screen and left there.
 */
export function maxTranslation(size: number, scale: number): number {
  'worklet'
  const overflow = (size * clampScale(scale) - size) / 2
  return Math.max(0, overflow)
}

export function clampTranslation(
  value: number,
  size: number,
  scale: number
): number {
  'worklet'
  const limit = maxTranslation(size, scale)
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, -limit), limit)
}

/**
 * Translation that keeps the pinch focal point under the fingers.
 *
 * Without this the wheel zooms about its centre and the detail being pinched
 * slides away from the gesture.
 */
export function focalTranslation(
  translation: number,
  focal: number,
  center: number,
  previousScale: number,
  nextScale: number
): number {
  'worklet'
  const from = clampScale(previousScale)
  const to = clampScale(nextScale)
  const offset = focal - center
  return (translation - offset) * (to / from) + offset
}

/** Distance from a point to a line segment, in the same units. */
export function distanceToSegment(point: Point, segment: Segment): number {
  'worklet'
  const dx = segment.b.x - segment.a.x
  const dy = segment.b.y - segment.a.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    const px = point.x - segment.a.x
    const py = point.y - segment.a.y
    return Math.sqrt(px * px + py * py)
  }

  let t =
    ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) /
    lengthSquared
  t = Math.min(Math.max(t, 0), 1)

  const cx = segment.a.x + t * dx
  const cy = segment.a.y + t * dy
  const ox = point.x - cx
  const oy = point.y - cy

  return Math.sqrt(ox * ox + oy * oy)
}

/**
 * Index of the closest aspect within tolerance, or null.
 *
 * Ties resolve to the lowest index, so a tap on an intersection always picks
 * the same aspect rather than depending on iteration order or float noise.
 */
export function nearestSegmentIndex(
  point: Point,
  segments: Segment[],
  tolerance: number = ASPECT_HIT_TOLERANCE
): number | null {
  'worklet'
  let bestIndex: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < segments.length; index += 1) {
    const distance = distanceToSegment(point, segments[index])

    if (distance <= tolerance && distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

/**
 * Undo the wheel's zoom/pan transform for a touch point.
 *
 * The gesture detector is attached to the untransformed frame, so a touch
 * arrives in frame coordinates while all hit geometry is expressed in the
 * wheel's own untransformed space. React Native applies `translate` then
 * `scale` about the view centre, so a wheel-local point L lands at
 * `centre + (L - centre) * scale + translate`. This is that inverted.
 */
export function inverseTransformPoint(
  point: Point,
  translateX: number,
  translateY: number,
  scale: number,
  center: number
): Point {
  'worklet'
  const s = clampScale(scale)

  return {
    x: (point.x - translateX - center) / s + center,
    y: (point.y - translateY - center) / s + center,
  }
}

/**
 * Index of the planet under a point, or null.
 *
 * Planets are tested before aspects so a tap inside a planet's region always
 * selects the planet, even when an aspect line passes directly through it.
 */
export function nearestPointIndex(
  point: Point,
  points: Point[],
  radius: number = PLANET_HIT_RADIUS
): number | null {
  'worklet'
  let bestIndex: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < points.length; index += 1) {
    const dx = point.x - points[index].x
    const dy = point.y - points[index].y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= radius && distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

export type HouseBand = {
  center: Point
  innerRadius: number
  outerRadius: number
}

/**
 * Longitude, in degrees, of a point relative to the wheel centre.
 *
 * Inverts the same mapping the drawing uses: a longitude is placed at screen
 * angle `90 - lon`, measured anticlockwise from twelve o'clock.
 */
export function longitudeAtPoint(point: Point, center: Point): number {
  'worklet'
  const dx = point.x - center.x
  const dy = point.y - center.y
  const screenAngle = (Math.atan2(dy, dx) * 180) / Math.PI
  const lon = 90 - screenAngle

  return ((lon % 360) + 360) % 360
}

/**
 * House number under a point, or null.
 *
 * Whole Sign houses each span exactly 30 degrees from their cusp, so a point
 * inside the house band belongs to whichever cusp it follows. The band is
 * padded either side of the drawn ring so the target is comfortable without
 * swallowing the planet ring outside it or the aspect field inside it.
 */
export function houseAtPoint(
  point: Point,
  band: HouseBand,
  houses: { house: number; lon: number }[] | null,
  padding: number = HOUSE_HIT_PADDING
): number | null {
  'worklet'
  if (!houses || houses.length === 0) return null

  const dx = point.x - band.center.x
  const dy = point.y - band.center.y
  const radius = Math.sqrt(dx * dx + dy * dy)

  if (radius < band.innerRadius - padding || radius > band.outerRadius + padding) {
    return null
  }

  const lon = longitudeAtPoint(point, band.center)

  for (const house of houses) {
    const offset = ((lon - house.lon) % 360 + 360) % 360
    if (offset < 30) return house.house
  }

  return null
}

/**
 * Index of the planet under a point, or null, with the house band excluded.
 *
 * A planet marker sits on its own ring, comfortably outside the house band --
 * but its 48dp control does not. At a wheel of 345 the control overhangs the
 * drawn band by about 10 points, which is enough to claim more than half the
 * band arc of the wedge behind it. With two planets close together that wedge
 * effectively cannot be selected at all: taps on houses 12 and 1 kept landing
 * on Mars or Pluto.
 *
 * So the drawn band belongs to the houses. Inside its outer edge a touch is
 * never a planet, however near one is; outside it the control is untouched and
 * still a full 48dp in every direction the planets actually crowd each other.
 * The boundary is one the reader can see, which is what makes it explicable
 * rather than arbitrary.
 *
 * Both the gesture layer and the planet's own Pressable resolve through this,
 * so the two cannot disagree about who owns a touch.
 */
export function nearestPlanetIndex(
  point: Point,
  points: Point[],
  band: HouseBand,
  radius: number = PLANET_HIT_RADIUS
): number | null {
  'worklet'
  const dx = point.x - band.center.x
  const dy = point.y - band.center.y

  if (Math.sqrt(dx * dx + dy * dy) < band.outerRadius) return null

  return nearestPointIndex(point, points, radius)
}

export type WheelTapTargets = {
  planetPoints: Point[]
  aspectSegments: Segment[]
  houseBand: HouseBand
  houses: { house: number; lon: number }[] | null
}

export type WheelTapResult =
  | { kind: 'planet'; index: number }
  | { kind: 'aspect'; index: number }
  | { kind: 'house'; house: number }
  | null

/**
 * What a tap in wheel-local space has landed on.
 *
 * The arbitration lives here rather than in the gesture layer for the reason
 * the whole module exists: deciding between three overlapping target types is
 * the part most likely to be wrong, and here it can be tested against real
 * wheel geometry instead of through a simulated gesture.
 *
 * `zoom` is the wheel's current scale. Slop is a property of the fingertip,
 * so every allowance below is stated on screen and divided by the scale to
 * reach wheel-local space -- a local distance reads `zoom` times larger once
 * the wheel is magnified. Without that conversion the corridors grow with the
 * drawing and zooming in to reach a crowded target makes it harder.
 */
export function resolveWheelTap(
  point: Point,
  targets: WheelTapTargets,
  zoom: number = MIN_WHEEL_SCALE
): WheelTapResult {
  'worklet'
  const scale = clampScale(zoom)

  /*
   * Planets first, and at an unscaled radius: the planet's own control is
   * drawn inside the transformed wheel, so it stays 48 wheel-local points at
   * every scale and this has to describe the same region.
   */
  const planetIndex = nearestPlanetIndex(
    point,
    targets.planetPoints,
    targets.houseBand,
    PLANET_HIT_RADIUS
  )
  if (planetIndex != null) return { kind: 'planet', index: planetIndex }

  const house = houseAtPoint(
    point,
    targets.houseBand,
    targets.houses,
    HOUSE_HIT_PADDING / scale
  )

  /*
   * Aspects still beat the house, but inside the band only on a precise hit.
   *
   * Every aspect line ends at a radius that falls within the house band, so
   * at the full corridor each endpoint covers the band around its own
   * planet's longitude. A wedge holding several planets was then almost
   * entirely spoken for by aspects and the house underneath could not be
   * selected. Outside the band nothing changes: the lines keep the generous
   * corridor along the whole of their length.
   */
  const tolerance =
    (house != null ? ASPECT_BAND_TOLERANCE : ASPECT_HIT_TOLERANCE) / scale

  const aspectIndex = nearestSegmentIndex(
    point,
    targets.aspectSegments,
    tolerance
  )
  if (aspectIndex != null) return { kind: 'aspect', index: aspectIndex }

  if (house != null) return { kind: 'house', house }

  return null
}
