import {
  assignPlanetsToWholeSignHouses,
  type HouseCusp,
} from '../astro'
import type { HouseNumber } from '../lexicon'
import { getHouseGuidance } from '../lexicon/guidance'
import type { TransitHouseContext } from './types'

function isCompleteWholeSignHouseSet(
  houses: readonly HouseCusp[]
): boolean {
  if (houses.length !== 12) return false

  const houseNumbers = new Set<number>()

  for (const cusp of houses) {
    if (
      !Number.isInteger(cusp.house) ||
      cusp.house < 1 ||
      cusp.house > 12 ||
      !Number.isFinite(cusp.lon) ||
      houseNumbers.has(cusp.house)
    ) {
      return false
    }

    houseNumbers.add(cusp.house)
  }

  return houseNumbers.size === 12
}

export function resolveTransitHouseContext(
  transitLongitude: number,
  natalHouses?: readonly HouseCusp[] | null
): TransitHouseContext | null {
  if (
    !Number.isFinite(transitLongitude) ||
    !natalHouses ||
    !isCompleteWholeSignHouseSet(natalHouses)
  ) {
    return null
  }

  const orderedHouses = [...natalHouses].sort(
    (first, second) => first.house - second.house
  )
  const placement = assignPlanetsToWholeSignHouses(
    [{ name: 'Transit', lon: transitLongitude }],
    orderedHouses
  )[0]

  if (
    !placement ||
    !Number.isInteger(placement.house) ||
    placement.house < 1 ||
    placement.house > 12
  ) {
    return null
  }

  const house = placement.house as HouseNumber

  return {
    house,
    guidance: getHouseGuidance(house),
  }
}
