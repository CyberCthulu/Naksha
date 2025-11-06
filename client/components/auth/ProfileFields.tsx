// components/auth/ProfileFields.tsx
import { View, TextInput, Text, StyleSheet } from 'react-native'
import DateField from './DateField'
import TimeField from './TimeField'
import TimeZonePicker from './TimeZonePicker'

export default function ProfileFields({
  firstName, setFirstName,
  lastName, setLastName,
  birthDate, setBirthDate,
  birthTime, setBirthTime,
  birthLocation, setBirthLocation,
  timeZone, setTimeZone,
}: any) {
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

      <TimeZonePicker value={timeZone} onChange={setTimeZone} />
    </View>
  )
}
const styles = StyleSheet.create({
  input:{ borderWidth:1, borderColor:'#aaa', padding:10, borderRadius:6 }
})
