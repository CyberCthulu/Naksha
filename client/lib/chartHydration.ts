import {
  assignPlanetsToWholeSignHouses,
  computeWholeSignHouses,
} from './astro'
import type { ChartData } from './charts'
import { resolveStoredBirthMoment } from './time'

export type ChartHydrationInput = {
  chartData: ChartData
  birthDate: string
  birthTime: string
  birthUtcOffsetMinutes: number | null
  timeZone: string
  birthLat: number | null
  birthLon: number | null
}

export function hydrateChartData({
  chartData,
  birthDate,
  birthTime,
  birthUtcOffsetMinutes,
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
      const persistedInstant = chartData.meta.instant_utc
        ? new Date(chartData.meta.instant_utc)
        : null
      const jsDate =
        persistedInstant && !Number.isNaN(persistedInstant.getTime())
          ? persistedInstant
          : resolveStoredBirthMoment(
              birthDate,
              birthTime,
              timeZone,
              birthUtcOffsetMinutes
            ).instant.utc
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
