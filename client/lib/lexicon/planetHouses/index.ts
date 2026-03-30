import { HouseNumber, PlanetKey, maybe } from '../types'
import { PLANET_HOUSE_MEANINGS } from './meanings'

export function getPlanetHouseMeaning(
  planet: PlanetKey,
  house: HouseNumber
) {
  return maybe(PLANET_HOUSE_MEANINGS[planet]?.[house])
}

export { PLANET_HOUSE_MEANINGS } from './meanings'
export type { PlanetHouseLexicon } from './meanings'