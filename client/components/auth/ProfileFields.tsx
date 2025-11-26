// components/auth/ProfileFields.tsx
import { View, TextInput, Text, StyleSheet } from 'react-native'
import DateField from './DateField'
import TimeField from './TimeField'
import TimeZonePicker from './TimeZonePicker'

type Props = {
  firstName: string; setFirstName: (v: string) => void
  lastName: string;  setLastName:  (v: string) => void
  birthDate: Date | null; setBirthDate: (d: Date | null) => void
  birthTime: Date | null; setBirthTime: (d: Date | null) => void
  birthLocation: string;  setBirthLocation: (v: string) => void
  timeZone: string;       setTimeZone: (v: string) => void
  birthLat?: number | null
  birthLon?: number | null
}

export default function ProfileFields({
  firstName, setFirstName,
  lastName, setLastName,
  birthDate, setBirthDate,
  birthTime, setBirthTime,
  birthLocation, setBirthLocation,
  timeZone, setTimeZone,
  birthLat, birthLon,
}: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text>First Name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text>Last Name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <DateField label="Birth Date" value={birthDate} onChange={setBirthDate} />
      <TimeField label="Birth Time" value={birthTime} onChange={setBirthTime} />

      <Text>Birth Location</Text>
      <TextInput style={styles.input} value={birthLocation} onChangeText={setBirthLocation} />

      {(birthLat != null && birthLon != null) && (
        <Text style={{ opacity: 0.7 }}>
          Resolved: {birthLocation} ({birthLat.toFixed(4)}, {birthLon.toFixed(4)})
        </Text>
      )}

      <TimeZonePicker value={timeZone} onChange={setTimeZone} />
    </View>
  )
}

const styles = StyleSheet.create({
  input:{ borderWidth:1, borderColor:'#aaa', padding:10, borderRadius:6 }
})
