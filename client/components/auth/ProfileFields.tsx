import { View, TextInput, Text } from 'react-native'
import DateField from './DateField'
import TimeField from './TimeField'
import TimeZonePicker from './TimeZonePicker'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

type Props = {
  firstName: string
  setFirstName: (v: string) => void
  lastName: string
  setLastName: (v: string) => void
  birthDate: Date | null
  setBirthDate: (d: Date | null) => void
  birthTime: Date | null
  setBirthTime: (d: Date | null) => void
  birthLocation: string
  setBirthLocation: (v: string) => void
  timeZone: string
  setTimeZone: (v: string) => void
  birthLat?: number | null
  birthLon?: number | null
}

const inputStyle = {
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.card,
  paddingVertical: 14,
  paddingHorizontal: 12,
  color: theme.colors.text,
  fontSize: 16,
} as const

export default function ProfileFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  birthDate,
  setBirthDate,
  birthTime,
  setBirthTime,
  birthLocation,
  setBirthLocation,
  timeZone,
  setTimeZone,
  birthLat,
  birthLon,
}: Props) {
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={[uiStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
          First Name
        </Text>
        <TextInput
          style={inputStyle}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      <View>
        <Text style={[uiStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
          Last Name
        </Text>
        <TextInput
          style={inputStyle}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      <DateField
        label="Birth Date"
        value={birthDate}
        onChange={(d) => setBirthDate(d)}
      />

      <TimeField
        label="Birth Time"
        value={birthTime}
        onChange={(d) => setBirthTime(d)}
      />

      <View>
        <Text style={[uiStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
          Birth Location
        </Text>
        <TextInput
          style={inputStyle}
          value={birthLocation}
          onChangeText={setBirthLocation}
          placeholder="City, State/Country"
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      {birthLat != null && birthLon != null && (
        <Text style={uiStyles.muted}>
          Resolved: {birthLocation} ({birthLat.toFixed(4)}, {birthLon.toFixed(4)})
        </Text>
      )}

      <TimeZonePicker value={timeZone} onChange={setTimeZone} />
    </View>
  )
}