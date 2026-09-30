import * as Astro from 'astronomy-engine'

import {
  computeAscendantLongitude,
  computeWholeSignHouses,
} from '../astro'

const DEG2RAD = Math.PI / 180

type AscendantFixture = {
  name: string
  instant: string
  latitude: number
  longitude: number
  referenceAscendant: number
  previousNakshaAscendant?: number
}

const fixtures: AscendantFixture[] = [
  {
    name: 'low northern latitude',
    instant: '2026-01-15T10:00:00Z',
    latitude: 20,
    longitude: 0,
    referenceAscendant: 353.371137986,
    previousNakshaAscendant: 353.369082848882,
  },
  {
    name: 'mid southern latitude',
    instant: '2026-01-15T10:00:00Z',
    latitude: -40,
    longitude: 0,
    referenceAscendant: 355.902231365,
    previousNakshaAscendant: 355.900959716009,
  },
  {
    name: 'high northern latitude before the inversion threshold',
    instant: '2026-01-15T10:00:00Z',
    latitude: 60,
    longitude: 0,
    referenceAscendant: 338.331661886,
    previousNakshaAscendant: 338.325335328265,
  },
  {
    name: 'high southern latitude before the inversion threshold',
    instant: '2026-01-15T22:00:00Z',
    latitude: -60,
    longitude: 0,
    referenceAscendant: 160.295475224,
    previousNakshaAscendant: 160.288964556091,
  },
  {
    name: 'far north immediately before the branch inversion',
    instant: '2026-01-15T09:00:00Z',
    latitude: 67,
    longitude: 0,
    referenceAscendant: 257.611931449,
  },
  {
    name: 'far north after the branch inversion',
    instant: '2026-01-15T10:00:00Z',
    latitude: 67,
    longitude: 0,
    referenceAscendant: 75.483318606,
  },
  {
    name: 'far south immediately before the branch inversion',
    instant: '2026-01-15T20:00:00Z',
    latitude: -69,
    longitude: 0,
    referenceAscendant: 63.662780448,
  },
  {
    name: 'far south after the branch inversion',
    instant: '2026-01-15T21:00:00Z',
    latitude: -69,
    longitude: 0,
    referenceAscendant: 242.917473876,
  },
  {
    name: 'just before a sign boundary',
    instant: '2026-01-15T22:18:00Z',
    latitude: 40,
    longitude: 0,
    referenceAscendant: 179.901987555,
  },
  {
    name: 'just after a sign boundary',
    instant: '2026-01-15T22:19:00Z',
    latitude: 40,
    longitude: 0,
    referenceAscendant: 180.102337257,
  },
]

function angularDistance(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180)
}

/**
 * Independent rising/setting check. Astronomy Engine supplies apparent
 * sidereal time and mean obliquity; this evaluates the time derivative of
 * altitude for an ecliptic point as the Earth rotates.
 */
function horizonAltitudeRate(
  fixture: AscendantFixture,
  eclipticLongitude: number
) {
  const date = new Date(fixture.instant)
  const phi = fixture.latitude * DEG2RAD
  const eps = Astro.e_tilt(Astro.MakeTime(date)).mobl * DEG2RAD
  const lstDegrees =
    (((Astro.SiderealTime(date) * 15 + fixture.longitude) % 360) + 360) %
    360
  const theta = lstDegrees * DEG2RAD
  const lambda = eclipticLongitude * DEG2RAD

  return (
    Math.cos(phi) *
    (-Math.cos(lambda) * Math.sin(theta) +
      Math.sin(lambda) * Math.cos(eps) * Math.cos(theta))
  )
}

describe('Ascendant horizon intersection', () => {
  it('matches the independent fixture matrix and always returns the rising point', () => {
    for (const fixture of fixtures) {
      const date = new Date(fixture.instant)
      const actual = computeAscendantLongitude(
        date,
        fixture.latitude,
        fixture.longitude
      )
      const opposite = (actual + 180) % 360
      const firstCusp = computeWholeSignHouses(
        date,
        fixture.latitude,
        fixture.longitude
      )[0].lon

      expect({
        name: fixture.name,
        matchesReference:
          angularDistance(actual, fixture.referenceAscendant) < 0.02,
        rising: horizonAltitudeRate(fixture, actual) > 0,
        antipodeIsSetting: horizonAltitudeRate(fixture, opposite) < 0,
        wholeSignCusp:
          firstCusp === Math.floor(fixture.referenceAscendant / 30) * 30,
      }).toEqual({
        name: fixture.name,
        matchesReference: true,
        rising: true,
        antipodeIsSetting: true,
        wholeSignCusp: true,
      })
    }
  })

  it('preserves the existing output at ordinary and non-inverting high latitudes', () => {
    for (const fixture of fixtures.filter(
      ({ previousNakshaAscendant }) => previousNakshaAscendant !== undefined
    )) {
      expect(
        computeAscendantLongitude(
          new Date(fixture.instant),
          fixture.latitude,
          fixture.longitude
        )
      ).toBeCloseTo(fixture.previousNakshaAscendant!, 10)
    }
  })

  it('normalizes Whole Sign house 1 correctly across a sign boundary', () => {
    const before = fixtures.find(
      ({ name }) => name === 'just before a sign boundary'
    )!
    const after = fixtures.find(
      ({ name }) => name === 'just after a sign boundary'
    )!

    expect(
      computeWholeSignHouses(
        new Date(before.instant),
        before.latitude,
        before.longitude
      )[0].lon
    ).toBe(150)
    expect(
      computeWholeSignHouses(
        new Date(after.instant),
        after.latitude,
        after.longitude
      )[0].lon
    ).toBe(180)
  })
})
