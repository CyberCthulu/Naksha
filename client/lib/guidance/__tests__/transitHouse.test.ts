import {
  assignPlanetsToWholeSignHouses,
  type HouseCusp,
} from '../../astro'
import { HOUSE_GUIDANCE } from '../../lexicon/guidance'
import { resolveTransitHouseContext } from '../transitHouse'

function wholeSignHouses(firstCusp: number): HouseCusp[] {
  return Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    lon: (firstCusp + index * 30) % 360,
  }))
}

describe('resolveTransitHouseContext', () => {
  it('maps a transit longitude through the existing Whole Sign assignment', () => {
    const houses = wholeSignHouses(90)
    const longitude = 245
    const expected = assignPlanetsToWholeSignHouses(
      [{ name: 'Mars', lon: longitude }],
      houses
    )[0]

    expect(resolveTransitHouseContext(longitude, houses)).toEqual({
      house: expected.house,
      guidance: HOUSE_GUIDANCE[expected.house as keyof typeof HOUSE_GUIDANCE],
    })
  })

  it('wraps correctly from Pisces into Aries', () => {
    const houses = wholeSignHouses(330)

    expect(resolveTransitHouseContext(359.999, houses)?.house).toBe(1)
    expect(resolveTransitHouseContext(0, houses)?.house).toBe(2)
  })

  it('uses the same sign-boundary behavior as the existing house engine', () => {
    const houses = wholeSignHouses(0)
    const beforeBoundary = assignPlanetsToWholeSignHouses(
      [{ name: 'Transit', lon: 29.999 }],
      houses
    )[0]
    const atBoundary = assignPlanetsToWholeSignHouses(
      [{ name: 'Transit', lon: 30 }],
      houses
    )[0]

    expect(resolveTransitHouseContext(29.999, houses)?.house).toBe(
      beforeBoundary.house
    )
    expect(resolveTransitHouseContext(30, houses)?.house).toBe(
      atBoundary.house
    )
    expect(beforeBoundary.house).toBe(1)
    expect(atBoundary.house).toBe(2)
  })

  it('rejects missing, incomplete, duplicate, and invalid house data', () => {
    const complete = wholeSignHouses(0)

    expect(resolveTransitHouseContext(10, null)).toBeNull()
    expect(resolveTransitHouseContext(10, complete.slice(0, 11))).toBeNull()
    expect(
      resolveTransitHouseContext(10, [
        ...complete.slice(0, 11),
        { house: 11, lon: 330 },
      ])
    ).toBeNull()
    expect(
      resolveTransitHouseContext(Number.NaN, complete)
    ).toBeNull()
  })
})
