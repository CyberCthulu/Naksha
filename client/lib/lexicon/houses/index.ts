//houses/index.ts
import { HouseNumber, Interpretation, ZodiacName, maybe } from '../types'
import { HOUSE_MEANINGS } from './meanings'
import { HOUSE_SIGN_MEANINGS, HOUSE_SIGN_FLAVORS } from './signMeanings'

/** Get generic meaning for a specific house */
export function getHouseMeaning(house: HouseNumber): Interpretation | null {
  return maybe(HOUSE_MEANINGS[house])
}

/**
 * Get a sign-aware meaning for a house.
 * 1. Use a specific handcrafted definition if available.
 * 2. Otherwise fall back to the blended generic+sign version.
 */
export function getHouseSignMeaning(
  house: HouseNumber,
  sign: ZodiacName
): Interpretation | null {
  const specific = HOUSE_SIGN_MEANINGS[house]?.[sign]
  if (specific) return specific

  const base = getHouseMeaning(house)
  if (!base) return null

  const flavor = HOUSE_SIGN_FLAVORS[sign]

  return {
    short: `${base.short} You tend to approach this area of life ${flavor}.`,
    long: `${base.long}

With ${sign} on the cusp of this house, you tend to approach this part of life ${flavor}. This sign colors how you experience, express, and develop the themes of this house.`,
  }
}

export { HOUSE_MEANINGS } from './meanings'
export { HOUSE_SIGN_MEANINGS, HOUSE_SIGN_FLAVORS } from './signMeanings'