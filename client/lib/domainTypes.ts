import type { Tables } from './database.types'

export type UserProfileFields = {
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  birth_time: string | null
  birth_location: string | null
  time_zone: string | null
  birth_lat: number | null
  birth_lon: number | null
}

export type UserRow = Tables<'users'>

export type SubscriptionRow = Tables<'subscriptions'>

export type PurchaseRow = Tables<'purchases'>

export type JournalRow = Tables<'journals'>

export type ChartPreferencesRow = Tables<'chart_preferences'>

export type ChartCalculationPreferences = {
  house_system: 'whole_sign'
  zodiac_type: 'tropical'
  orb_mode: 'medium'
  show_house_degrees: boolean
}

export const DEFAULT_CHART_CALCULATION_PREFERENCES: ChartCalculationPreferences =
  {
    house_system: 'whole_sign',
    zodiac_type: 'tropical',
    orb_mode: 'medium',
    show_house_degrees: false,
  }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseChartCalculationPreferences(
  value: unknown
): ChartCalculationPreferences | null {
  if (!isRecord(value)) return null

  if (
    value.house_system !== 'whole_sign' ||
    value.zodiac_type !== 'tropical' ||
    value.orb_mode !== 'medium' ||
    typeof value.show_house_degrees !== 'boolean'
  ) {
    return null
  }

  return {
    house_system: value.house_system,
    zodiac_type: value.zodiac_type,
    orb_mode: value.orb_mode,
    show_house_degrees: value.show_house_degrees,
  }
}

export function resolveChartCalculationPreferences(
  preferences: unknown = DEFAULT_CHART_CALCULATION_PREFERENCES
): ChartCalculationPreferences {
  if (preferences == null) return DEFAULT_CHART_CALCULATION_PREFERENCES

  const parsed = parseChartCalculationPreferences(preferences)
  if (!parsed) {
    throw new Error(
      'Unsupported chart calculation preferences. Only whole_sign/tropical/medium is implemented.'
    )
  }

  return parsed
}

export type ChartProfile = Pick<
  UserProfileFields,
  'birth_date' | 'birth_time' | 'time_zone'
> &
  Partial<
    Pick<
      UserProfileFields,
      'birth_lat' | 'birth_lon' | 'birth_location' | 'first_name' | 'last_name'
    >
  >

export type ChartMode = 'self' | 'guest'

export type ChartRouteParams<TSavedChart = unknown> = {
  profile: ChartProfile
  chartMode?: ChartMode
  fromSaved?: boolean
  saved?: TSavedChart
}
