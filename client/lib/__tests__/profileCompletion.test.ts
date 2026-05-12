import {
  REQUIRED_PROFILE_FIELDS,
  isProfileComplete,
  needsProfileCompletion,
  profileFromAuthMetadata,
  type ProfileCompletionData,
} from '../profileCompletion'

const completeProfile: ProfileCompletionData = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1815-12-10',
  birth_time: '12:00:00',
  birth_location: 'London, England',
  time_zone: 'Europe/London',
}

describe('profileCompletion', () => {
  it('recognizes a complete profile', () => {
    expect(isProfileComplete(completeProfile)).toBe(true)
    expect(needsProfileCompletion(completeProfile)).toBe(false)
  })

  it('requires every required profile field', () => {
    for (const field of REQUIRED_PROFILE_FIELDS) {
      expect(
        isProfileComplete({
          ...completeProfile,
          [field]: null,
        })
      ).toBe(false)
    }
  })

  it('treats missing, null, and empty profiles as incomplete', () => {
    expect(isProfileComplete(undefined)).toBe(false)
    expect(isProfileComplete(null)).toBe(false)
    expect(isProfileComplete({ ...completeProfile, first_name: '' })).toBe(
      false
    )
  })

  it('maps auth metadata into profile fields with numeric coordinates', () => {
    expect(
      profileFromAuthMetadata({
        ...completeProfile,
        birth_lat: 51.5072,
        birth_lon: -0.1276,
      })
    ).toEqual({
      ...completeProfile,
      birth_lat: 51.5072,
      birth_lon: -0.1276,
    })
  })
})
