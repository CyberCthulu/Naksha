// client/screens/CompleteProfileScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, Button, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { normalizeZone } from '../lib/timezones'
import { geocodePlace } from '../lib/geocode'

// Shared auth UI
import AuthContainer from '../components/auth/AuthContainer'
import ProfileFields from '../components/auth/ProfileFields'

type DBUser = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  birth_time: string | null
  birth_location: string | null
  time_zone: string | null
  birth_lat?: number | null
  birth_lon?: number | null
}

export default function CompleteProfileScreen() {
  const navigation = useNavigation<any>()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC')
  const [birthLat, setBirthLat] = useState<number | null>(null)
  const [birthLon, setBirthLon] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default picker to device zone (normalized)
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setTimeZone(normalizeZone(detected) || 'Etc/UTC')
  }, [])

  // Prefill from users table
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null)
        const { data: { user }, error: uerr } = await supabase.auth.getUser()
        if (uerr) throw uerr
        if (!user) {
          setError('No active session.')
          return
        }

        // Ensure user row exists (in case of older accounts)
        await supabase.from('users').upsert({ id: user.id, email: user.email ?? null }, { onConflict: 'id' })

        const { data, error: perr } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle<DBUser>()
        if (perr) throw perr

        if (data) {
          setFirstName(data.first_name ?? '')
          setLastName(data.last_name ?? '')
          setBirthLocation(data.birth_location ?? '')

          // Normalize to IANA if needed
          const tz = normalizeZone(data.time_zone) || timeZone
          setTimeZone(tz)
        
          // hydrate lat/lon if present
          setBirthLat(data.birth_lat ?? null)
          setBirthLon(data.birth_lon ?? null)

          // Safe date/time hydration
          if (data.birth_date) {
            // Use noon to avoid timezone shifts when constructing a Date
            setBirthDate(new Date(`${data.birth_date}T12:00:00`))
          }
          if (data.birth_time) {
            const [h, m, s] = String(data.birth_time).split(':').map(v => parseInt(v || '0', 10))
            const t = new Date()
            t.setHours(h || 0, m || 0, s || 0, 0)
            setBirthTime(t)
          }
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSave = async () => {
    if (saving) return

    if (!firstName.trim() || !lastName.trim() || !birthDate || !birthTime || !birthLocation.trim()) {
      Alert.alert('Missing info', 'Please complete all fields.')
      return
    }

    const normalized = normalizeZone(timeZone)
    if (!normalized) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    setSaving(true)
    try {
      const formattedDate = birthDate.toISOString().split('T')[0]      // YYYY-MM-DD
      const formattedTime = birthTime.toTimeString().split(' ')[0]     // HH:MM:SS

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in.')
  
      // If we don’t have lat/lon yet, resolve from birthLocation
      let lat = birthLat
      let lon = birthLon
      if (lat == null || lon == null) {
        const results = await geocodePlace(birthLocation.trim())
        if (!results.length) {
          throw new Error('Could not resolve birth location. Please refine it (e.g., "Redwood City, CA").')
        }
        // Use the top result — later we can add a picker if you want
        lat = results[0].lat
        lon = results[0].lon
        setBirthLat(lat)
        setBirthLon(lon)
      }

      // Update users table
      const { error: upErr } = await supabase.from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: formattedDate,
          birth_time: formattedTime,
          birth_location: birthLocation.trim(),
          time_zone: normalized,
          birth_lat: lat,
          birth_lon: lon,
        })
        .eq('id', user.id)
      if (upErr) throw upErr

      // Keep auth.user_metadata in sync
      await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birth_date: formattedDate,
          birth_time: formattedTime,
          birth_location: birthLocation.trim(),
          time_zone: normalized,
          birth_lat: lat,
          birth_lon: lon,
        },
      })

      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthContainer>
        <Text style={{ opacity: 0.8, marginBottom: 12 }}>Loading…</Text>
      </AuthContainer>
    )
  }

  return (
    <AuthContainer>
      <Text style={styles.title}>Complete Your Profile</Text>

      <ProfileFields
        firstName={firstName} setFirstName={setFirstName}
        lastName={lastName} setLastName={setLastName}
        birthDate={birthDate} setBirthDate={setBirthDate}
        birthTime={birthTime} setBirthTime={setBirthTime}
        birthLocation={birthLocation} setBirthLocation={setBirthLocation}
        timeZone={timeZone} setTimeZone={setTimeZone}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={{ height: 8 }} />
      <Button title={saving ? 'Saving…' : 'Save & Continue'} onPress={onSave} disabled={saving} />

      <View style={{ height: 8 }} />
      <Button title="Skip for now" onPress={() => (navigation as any).goBack()} disabled={saving} />
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  error: { color: 'crimson', marginTop: 8 }
})
