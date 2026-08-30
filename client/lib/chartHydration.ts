import {
  assignPlanetsToWholeSignHouses,
  computeWholeSignHouses,
} from './astro'
import type { ChartData } from './charts'
import { birthToUTC } from './time'

export type ChartHydrationInput = {
  chartData: ChartData
  birthDate: string
  birthTime: string
  timeZone: string
  birthLat: number | null
  birthLon: number | null
}

export function hydrateChartData({
  chartData,
  birthDate,
  birthTime,
  timeZone,
  birthLat,
  birthLon,
}: ChartHydrationInput): ChartData {
  let houses = chartData.houses

  if (!houses) {
    if (
      birthLat == null ||
      birthLon == null ||
      !Number.isFinite(birthLat) ||
      !Number.isFinite(birthLon)
    ) {
      return chartData
    }

    try {
      const { jsDate } = birthToUTC(birthDate, birthTime, timeZone)
      houses = computeWholeSignHouses(jsDate, birthLat, birthLon)
    } catch {
      return chartData
    }
  }

  const planetHouses =
    chartData.planet_houses ??
    assignPlanetsToWholeSignHouses(chartData.planets, houses)

  if (
    houses === chartData.houses &&
    planetHouses === chartData.planet_houses
  ) {
    return chartData
  }

  return {
    ...chartData,
    houses,
    planet_houses: planetHouses,
  }
}
