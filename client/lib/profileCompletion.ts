import type { UserProfileFields } from './domainTypes'

export const REQUIRED_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'birth_time',
  'birth_location',
  'time_zone',
] as const

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number]
export type ProfileCompletionData = Pick<UserProfileFields, RequiredProfileField>

export function isProfileComplete(
  profile: Partial<ProfileCompletionData> | null | undefined
) {
  if (!profile) return false

  return REQUIRED_PROFILE_FIELDS.every((field) => !!profile[field])
}

export function needsProfileCompletion(
  profile: Partial<ProfileCompletionData> | null | undefined
) {
  return !isProfileComplete(profile)
}

export function profileFromAuthMetadata(md: any): UserProfileFields {
  return {
    first_name: md?.first_name ?? null,
    last_name: md?.last_name ?? null,
    birth_date: md?.birth_date ?? null,
    birth_time: md?.birth_time ?? null,
    birth_location: md?.birth_location ?? null,
    time_zone: md?.time_zone ?? null,
    birth_lat: typeof md?.birth_lat === 'number' ? md.birth_lat : null,
    birth_lon: typeof md?.birth_lon === 'number' ? md.birth_lon : null,
  }
}
