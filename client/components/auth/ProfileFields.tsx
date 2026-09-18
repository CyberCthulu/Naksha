//components/auth/ProfileFields.tsx
import { View } from 'react-native'
import DateField from './DateField'
import TimeField from './TimeField'
import TimeZonePicker from './TimeZonePicker'
import LocationAutocompleteField from './LocationAutocompleteField'
import FormField from '../ui/FormField'
import TextField from '../ui/TextField'
import { AppText } from '../ui/AppText'
import { uiStyles } from '../ui/uiStyles'
import { normalizeZone } from '../../lib/timezones'
import type { CivilDate, CivilTime } from '../../lib/time'
import BirthTimeResolutionField from './BirthTimeResolutionField'

type Props = {
  firstName: string
  setFirstName: (v: string) => void
  lastName: string
  setLastName: (v: string) => void
  birthDate: CivilDate | null
  setBirthDate: (d: CivilDate | null) => void
  birthTime: CivilTime | null
  setBirthTime: (d: CivilTime | null) => void
  birthUtcOffsetMinutes: number | null
  setBirthUtcOffsetMinutes: (value: number | null) => void
  birthLocation: string
  setBirthLocation: (v: string) => void
  timeZone: string
  setTimeZone: (v: string) => void
  birthLat?: number | null
  birthLon?: number | null
  setBirthLat?: (v: number | null) => void
  setBirthLon?: (v: number | null) => void
}

export default function ProfileFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  birthDate,
  setBirthDate,
  birthTime,
  setBirthTime,
  birthUtcOffsetMinutes,
  setBirthUtcOffsetMinutes,
  birthLocation,
  setBirthLocation,
  timeZone,
  setTimeZone,
  birthLat,
  birthLon,
  setBirthLat,
  setBirthLon,
}: Props) {
  return (
    <View>
      <FormField label="First Name">
        <TextField
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
        />
      </FormField>

      <FormField label="Last Name">
        <TextField
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
        />
      </FormField>

      <DateField
        label="Birth Date"
        value={birthDate}
        onChange={(d) => {
          setBirthDate(d)
          setBirthUtcOffsetMinutes(null)
        }}
      />

      <TimeField
        label="Birth Time"
        value={birthTime}
        onChange={(d) => {
          setBirthTime(d)
          setBirthUtcOffsetMinutes(null)
        }}
      />

      <BirthTimeResolutionField
        birthDate={birthDate}
        birthTime={birthTime}
        timeZone={timeZone}
        selectedOffsetMinutes={birthUtcOffsetMinutes}
        onSelectOffsetMinutes={setBirthUtcOffsetMinutes}
      />

      <LocationAutocompleteField
        value={birthLocation}
        onChange={(next) => {
          setBirthLocation(next)
          setBirthLat?.(null)
          setBirthLon?.(null)
          setBirthUtcOffsetMinutes(null)
        }}
        onSelectLocation={(result) => {
          setBirthLocation(result.name)
          setBirthLat?.(result.lat)
          setBirthLon?.(result.lon)

          const normalized = normalizeZone(result.timeZone)
          if (normalized) {
            setTimeZone(normalized)
            setBirthUtcOffsetMinutes(null)
          }
        }}
      />

      {birthLat != null && birthLon != null && (
        <AppText variant="bodySmall" style={[uiStyles.muted, { marginBottom: 16 }]}>
          Resolved: {birthLocation} ({birthLat.toFixed(4)}, {birthLon.toFixed(4)})
        </AppText>
      )}

      <TimeZonePicker
        value={timeZone}
        onChange={(value) => {
          setTimeZone(value)
          setBirthUtcOffsetMinutes(null)
        }}
      />
    </View>
  )
}
