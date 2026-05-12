import type { Aspect, HouseCusp, PlanetHousePlacement, PlanetPos } from './astro'
import type { ChartData, ChartMeta } from './charts'

const VALID_ASPECT_TYPES = new Set(['conj', 'opp', 'trine', 'square', 'sextile'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function isHouseNumber(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 12
}

function isPlanetPos(value: unknown): value is PlanetPos {
  return isRecord(value) && isString(value.name) && isNumber(value.lon)
}

function isAspect(value: unknown): value is Aspect {
  return (
    isRecord(value) &&
    isString(value.a) &&
    isString(value.b) &&
    isString(value.type) &&
    VALID_ASPECT_TYPES.has(value.type) &&
    isNumber(value.orb)
  )
}

function isHouseCusp(value: unknown): value is HouseCusp {
  return isRecord(value) && isHouseNumber(value.house) && isNumber(value.lon)
}

function isPlanetHousePlacement(
  value: unknown
): value is PlanetHousePlacement {
  return isRecord(value) && isString(value.name) && isHouseNumber(value.house)
}

function parseNullableArray<T>(
  value: unknown,
  isItem: (item: unknown) => item is T
): T[] | null | undefined {
  if (value === null) return null
  if (!Array.isArray(value)) return undefined
  return value.every(isItem) ? value : undefined
}

export function parseChartData(value: unknown): ChartData | null {
  if (!isRecord(value) || !isRecord(value.meta)) return null

  const meta = value.meta
  if (
    !isString(meta.birth_date) ||
    !isString(meta.birth_time) ||
    !isString(meta.time_zone) ||
    !isNullableNumber(meta.birth_lat) ||
    !isNullableNumber(meta.birth_lon)
  ) {
    return null
  }

  if (!Array.isArray(value.planets) || !value.planets.every(isPlanetPos)) {
    return null
  }

  if (!Array.isArray(value.aspects) || !value.aspects.every(isAspect)) {
    return null
  }

  const houses = parseNullableArray(value.houses, isHouseCusp)
  if (houses === undefined) return null

  const planetHouses = parseNullableArray(
    value.planet_houses,
    isPlanetHousePlacement
  )
  if (planetHouses === undefined) return null

  const parsedMeta: ChartMeta = {
    name: isString(meta.name) ? meta.name : 'Natal Chart',
    birth_date: meta.birth_date,
    birth_time: meta.birth_time,
    time_zone: meta.time_zone,
    birth_lat: meta.birth_lat,
    birth_lon: meta.birth_lon,
    computed_at: isString(meta.computed_at) ? meta.computed_at : '',
    instant_utc:
      meta.instant_utc === null || isString(meta.instant_utc)
        ? meta.instant_utc
        : null,
  }

  return {
    meta: parsedMeta,
    planets: value.planets,
    aspects: value.aspects,
    houses,
    planet_houses: planetHouses,
  }
}
