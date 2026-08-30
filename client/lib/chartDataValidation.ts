import type { Aspect, HouseCusp, PlanetHousePlacement, PlanetPos } from './astro'
import type { ChartData, ChartMeta } from './charts'
import {
  CURRENT_CHART_CALCULATION_VERSION,
  CURRENT_CHART_SCHEMA_VERSION,
} from './chartDataVersions'

const VALID_ASPECT_TYPES = new Set(['conj', 'opp', 'trine', 'square', 'sextile'])

export const UNSUPPORTED_CHART_DATA_MESSAGE =
  'This saved chart uses a chart-data version this copy of Naksha does not support. Update Naksha before opening it.'

export type ChartDataValidationResult =
  | {
      status: 'valid'
      compatibility: 'legacy-v1' | 'current'
      data: ChartData
    }
  | {
      status: 'unsupported'
      field: 'schema_version' | 'calculation_version'
      schemaVersion: number
      calculationVersion: number
    }
  | {
      status: 'invalid'
      reason: 'malformed-data' | 'malformed-version'
    }

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

function isVersionNumber(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0
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

export function validateChartData(value: unknown): ChartDataValidationResult {
  if (!isRecord(value)) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  const hasSchemaVersion = value.schema_version !== undefined
  const hasCalculationVersion = value.calculation_version !== undefined
  // Unversioned chart_data predates explicit markers and is legacy V1.
  const isLegacy = !hasSchemaVersion && !hasCalculationVersion

  if (
    hasSchemaVersion !== hasCalculationVersion ||
    (!isLegacy &&
      (!isVersionNumber(value.schema_version) ||
        !isVersionNumber(value.calculation_version)))
  ) {
    return { status: 'invalid', reason: 'malformed-version' }
  }

  if (!isLegacy) {
    const schemaVersion = value.schema_version as number
    const calculationVersion = value.calculation_version as number

    if (schemaVersion !== CURRENT_CHART_SCHEMA_VERSION) {
      return {
        status: 'unsupported',
        field: 'schema_version',
        schemaVersion,
        calculationVersion,
      }
    }

    if (calculationVersion !== CURRENT_CHART_CALCULATION_VERSION) {
      return {
        status: 'unsupported',
        field: 'calculation_version',
        schemaVersion,
        calculationVersion,
      }
    }
  }

  if (!isRecord(value.meta)) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  const meta = value.meta
  if (
    !isString(meta.birth_date) ||
    !isString(meta.birth_time) ||
    !isString(meta.time_zone) ||
    !isNullableNumber(meta.birth_lat) ||
    !isNullableNumber(meta.birth_lon)
  ) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  if (!Array.isArray(value.planets) || !value.planets.every(isPlanetPos)) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  if (!Array.isArray(value.aspects) || !value.aspects.every(isAspect)) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  const houses = parseNullableArray(value.houses, isHouseCusp)
  if (houses === undefined) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

  const planetHouses = parseNullableArray(
    value.planet_houses,
    isPlanetHousePlacement
  )
  if (planetHouses === undefined) {
    return { status: 'invalid', reason: 'malformed-data' }
  }

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

  const data: ChartData = {
    meta: parsedMeta,
    planets: value.planets,
    aspects: value.aspects,
    houses,
    planet_houses: planetHouses,
  }

  if (!isLegacy) {
    data.schema_version = value.schema_version as number
    data.calculation_version = value.calculation_version as number
  }

  return {
    status: 'valid',
    compatibility: isLegacy ? 'legacy-v1' : 'current',
    data,
  }
}

export function parseChartData(value: unknown): ChartData | null {
  const result = validateChartData(value)
  return result.status === 'valid' ? result.data : null
}
