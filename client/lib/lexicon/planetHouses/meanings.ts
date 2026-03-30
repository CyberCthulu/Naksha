import { HouseNumber, Interpretation, PlanetKey } from '../types'

export type PlanetHouseLexicon = Partial<
  Record<PlanetKey, Partial<Record<HouseNumber, Interpretation>>>
>

export const PLANET_HOUSE_MEANINGS: PlanetHouseLexicon = {
  Sun: {
    1: {
      short: '...',
      long: `...`,
    },
  },
}