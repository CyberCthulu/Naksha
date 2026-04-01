//lib/chartPageBuilders.ts
import type { PlanetPos, HouseCusp, PlanetHousePlacement } from './astro'
import {
  zodiacNameFromLongitude,
  getPlanetSignMeaning,
  getPlanetHouseMeaning,
  getHouseMeaning,
  getHouseSignMeaning,
  type PlanetKey,
} from './lexicon'
import type { InterpretationPage } from '../components/charts/interpretationTypes'
import { asHouseNumber, buildPlanetSummary } from './chartInterpretation'

export function buildPlanetPages(
  planets: PlanetPos[],
  orderedPlanetKeys: PlanetKey[],
  planetHouses: PlanetHousePlacement[] | null
): InterpretationPage[] {
  return orderedPlanetKeys.flatMap((planetKey) => {
    const planet = planets.find((p) => p.name === planetKey)
    if (!planet) return []

    const signName = zodiacNameFromLongitude(planet.lon)
    const signMeaning = getPlanetSignMeaning(planetKey, signName)

    const placement = planetHouses?.find((ph) => ph.name === planetKey)
    const houseNumber = placement ? asHouseNumber(placement.house) : null
    const houseMeaning = houseNumber
      ? getPlanetHouseMeaning(planetKey, houseNumber)
      : null

    return [
      {
        key: planetKey,
        title: planet.name,
        subtitle: `${signName}${houseNumber ? ` · House ${houseNumber}` : ''}`,
        summary: buildPlanetSummary(planetKey, planet.lon, planetHouses),
        blocks: [
          {
            title: `${planet.name} in ${signName}`,
            interpretation: signMeaning ?? null,
            mode: 'long',
          },
          {
            title:
              houseNumber != null
                ? `${planet.name} in House ${houseNumber}`
                : undefined,
            interpretation: houseMeaning ?? null,
            mode: 'long',
          },
        ],
      },
    ]
  })
}

export function buildHousePages(
  houses: HouseCusp[] | null
): InterpretationPage[] {
  if (!houses) return []

  return houses.flatMap((h) => {
    const houseNumber = asHouseNumber(h.house)
    if (!houseNumber) return []

    const signName = zodiacNameFromLongitude(h.lon)
    const genericMeaning = getHouseMeaning(houseNumber)
    const signMeaning = getHouseSignMeaning(houseNumber, signName)

    return [
      {
        key: `house-${houseNumber}`,
        title: `House ${houseNumber}`,
        subtitle: signName,
        summary: signMeaning?.short ?? genericMeaning?.short ?? null,
        blocks: [
          {
            title: `House ${houseNumber}`,
            interpretation: genericMeaning,
            mode: 'long',
          },
          {
            title: `${signName} on House ${houseNumber}`,
            interpretation: signMeaning,
            mode: 'long',
          },
        ],
      },
    ]
  })
}