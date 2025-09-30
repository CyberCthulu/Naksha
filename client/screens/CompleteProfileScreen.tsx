// // screens/CompleteProfileScreen.tsx
// import React, { useEffect, useState } from 'react'
// import { View, Text, TextInput, Button, StyleSheet, Platform, Alert } from 'react-native'
// import DateTimePicker from '@react-native-community/datetimepicker'
// import supabase from '../lib/supabase'
// import { isValidTimeZone, normalizeZone } from '../lib/timezones'

// export default function CompleteProfileScreen({ navigation }: any) {
//   const [firstName, setFirstName] = useState('')
//   const [lastName, setLastName] = useState('')
//   const [birthDate, setBirthDate] = useState<Date | null>(null)
//   const [birthTime, setBirthTime] = useState<Date | null>(null)
//   const [birthLocation, setBirthLocation] = useState('')
//   const [timeZone, setTimeZone] = useState('')
//   const [submitting, setSubmitting] = useState(false)
//   const [showDate, setShowDate] = useState(false)
//   const [showTime, setShowTime] = useState(false)

//   useEffect(() => {
//     const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
//     setTimeZone(tz)
//   }, [])

//   // Prefill from users table if present
//   useEffect(() => {
//     (async () => {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) return
//       const { data } = await supabase
//         .from('users')
//         .select('first_name,last_name,birth_date,birth_time,birth_location,time_zone')
//         .eq('id', user.id)
//         .maybeSingle()

//       if (data) {
//         setFirstName(data.first_name ?? '')
//         setLastName(data.last_name ?? '')
//         setBirthLocation(data.birth_location ?? '')
//         setTimeZone(data.time_zone ?? timeZone)
//         if (data.birth_date) setBirthDate(new Date(`${data.birth_date}T12:00:00`))
//         if (data.birth_time) {
//           const [h, m, s] = String(data.birth_time).split(':').map((x: string) => parseInt(x || '0', 10))
//           const d = new Date(); d.setHours(h||0, m||0, s||0, 0); setBirthTime(d)
//         }
//       }
//     })()
//   }, [timeZone])

//   const onSave = async () => {
//     if (!firstName.trim() || !lastName.trim() || !birthDate || !birthTime || !birthLocation.trim()) {
//       Alert.alert('Missing info', 'Please complete all fields.')
//       return
//     }
//     setSubmitting(true)
//     try {
//       const formattedDate = birthDate.toISOString().split('T')[0]
//       const formattedTime = birthTime.toTimeString().split(' ')[0]
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) throw new Error('Not signed in.')

//       // Update users table (RLS allows own-row)
//       const { error: upErr } = await supabase.from('users').update({
//         first_name: firstName.trim(),
//         last_name: lastName.trim(),
//         birth_date: formattedDate,
//         birth_time: formattedTime,
//         birth_location: birthLocation.trim(),
//         time_zone: timeZone,
//       }).eq('id', user.id)
//       if (upErr) throw upErr

//       // Optional: keep auth.user_metadata in sync
//       await supabase.auth.updateUser({
//         data: {
//           first_name: firstName.trim(),
//           last_name: lastName.trim(),
//           birth_date: formattedDate,
//           birth_time: formattedTime,
//           birth_location: birthLocation.trim(),
//           time_zone: timeZone,
//         },
//       })

//       navigation.goBack()
//     } catch (e: any) {
//       Alert.alert('Save failed', e?.message ?? 'Unknown error')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Complete Your Profile</Text>

//       <Text>First Name</Text>
//       <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

//       <Text>Last Name</Text>
//       <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

//       <Text>Birth Date</Text>
//       <Button title={birthDate ? birthDate.toDateString() : 'Select Date'} onPress={() => setShowDate(true)} />
//       {showDate && (
//         <DateTimePicker
//           value={birthDate || new Date()}
//           mode="date"
//           display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
//           onChange={(_, d) => { setShowDate(false); if (d) setBirthDate(d) }}
//         />
//       )}

//       <Text>Birth Time</Text>
//       <Button title={birthTime ? birthTime.toLocaleTimeString() : 'Select Time'} onPress={() => setShowTime(true)} />
//       {showTime && (
//         <DateTimePicker
//           value={birthTime || new Date()}
//           mode="time"
//           display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
//           onChange={(_, d) => { setShowTime(false); if (d) setBirthTime(d) }}
//         />
//       )}

//       <Text>Birth Location</Text>
//       <TextInput style={styles.input} value={birthLocation} onChangeText={setBirthLocation} />

//       <Text>Time Zone</Text>
//       <TextInput style={styles.input} value={timeZone} onChangeText={setTimeZone} />

//       <View style={{ height: 8 }} />
//       <Button title={submitting ? 'Saving…' : 'Save'} disabled={submitting} onPress={onSave} />
//       <View style={{ height: 8 }} />
//       <Button title="Skip for now" onPress={() => navigation.goBack()} disabled={submitting} />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, paddingTop: 40, gap: 6 },
//   title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
//   input: { borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 6, marginVertical: 4 },
// })

import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Platform, Alert } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import supabase from '../lib/supabase'
import { TIMEZONES, normalizeZone } from '../lib/timezones'

export default function CompleteProfileScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC') // IANA in picker
  const [submitting, setSubmitting] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const [showTime, setShowTime] = useState(false)

  // Default picker to device zone (normalized)
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setTimeZone(normalizeZone(detected) || 'Etc/UTC')
  }, [])

  // Prefill from users table if present
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('first_name,last_name,birth_date,birth_time,birth_location,time_zone')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setBirthLocation(data.birth_location ?? '')

        // normalize any legacy values like "PST" → "America/Los_Angeles"
        const normalized = normalizeZone(data.time_zone) || timeZone
        setTimeZone(normalized)

        if (data.birth_date) setBirthDate(new Date(`${data.birth_date}T12:00:00`))
        if (data.birth_time) {
          const [h, m, s] = String(data.birth_time).split(':').map((x: string) => parseInt(x || '0', 10))
          const d = new Date()
          d.setHours(h || 0, m || 0, s || 0, 0)
          setBirthTime(d)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate || !birthTime || !birthLocation.trim()) {
      Alert.alert('Missing info', 'Please complete all fields.')
      return
    }

    // Ensure we persist a valid IANA
    const normalized = normalizeZone(timeZone)
    if (!normalized) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    setSubmitting(true)
    try {
      const formattedDate = birthDate.toISOString().split('T')[0]
      const formattedTime = birthTime.toTimeString().split(' ')[0]
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in.')

      // Update users table (RLS allows own-row)
      const { error: upErr } = await supabase.from('users').update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: formattedDate,
        birth_time: formattedTime,
        birth_location: birthLocation.trim(),
        time_zone: normalized, // ✅ save normalized IANA
      }).eq('id', user.id)
      if (upErr) throw upErr

      // Optional: keep auth.user_metadata in sync
      await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: formattedDate,
          birth_time: formattedTime,
          birth_location: birthLocation.trim(),
          time_zone: normalized, // ✅
        },
      })

      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <Text>First Name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text>Last Name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <Text>Birth Date</Text>
      <Button title={birthDate ? birthDate.toDateString() : 'Select Date'} onPress={() => setShowDate(true)} />
      {showDate && (
        <DateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onChange={(_, d) => { setShowDate(false); if (d) setBirthDate(d) }}
        />
      )}

      <Text>Birth Time</Text>
      <Button title={birthTime ? birthTime.toLocaleTimeString() : 'Select Time'} onPress={() => setShowTime(true)} />
      {showTime && (
        <DateTimePicker
          value={birthTime || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={(_, d) => { setShowTime(false); if (d) setBirthTime(d) }}
        />
      )}

      <Text>Birth Location</Text>
      <TextInput style={styles.input} value={birthLocation} onChangeText={setBirthLocation} />

      <Text>Time Zone</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={timeZone} onValueChange={(v) => setTimeZone(v)}>
          {TIMEZONES.map((tz) => (
            <Picker.Item key={tz} label={tz} value={tz} />
          ))}
        </Picker>
      </View>

      <View style={{ height: 8 }} />
      <Button title={submitting ? 'Saving…' : 'Save'} disabled={submitting} onPress={onSave} />
      <View style={{ height: 8 }} />
      <Button title="Skip for now" onPress={() => navigation.goBack()} disabled={submitting} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40, gap: 6 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 6, marginVertical: 4 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginVertical: 4,
    overflow: 'hidden',
  },
})
