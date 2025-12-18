// client/screens/CompleteProfileScreen.tsx
import React, { useEffect, useLayoutEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { normalizeZone } from '../lib/timezones'
import { geocodePlace } from '../lib/geocode'

// Shared auth UI
import AuthContainer from '../components/auth/AuthContainer'
import ProfileFields from '../components/auth/ProfileFields'

// Shared UI theme
import { theme } from '../components/ui/theme'
import { uiStyles } from '../components/ui/uiStyles'

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
  const insets = useSafeAreaInsets()

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false })
  }, [navigation])

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
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user },
          error: uerr,
        } = await supabase.auth.getUser()
        if (uerr) throw uerr
        if (!user) {
          setError('No active session.')
          return
        }

        // Ensure user row exists (in case of older accounts)
        await supabase
          .from('users')
          .upsert({ id: user.id, email: user.email ?? null }, { onConflict: 'id' })

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

          const tz = normalizeZone(data.time_zone) || timeZone
          setTimeZone(tz)

          setBirthLat(data.birth_lat ?? null)
          setBirthLon(data.birth_lon ?? null)

          if (data.birth_date) {
            setBirthDate(new Date(`${data.birth_date}T12:00:00`))
          }
          if (data.birth_time) {
            const [h, m, s] = String(data.birth_time)
              .split(':')
              .map((v) => parseInt(v || '0', 10))
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

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !birthDate ||
      !birthTime ||
      !birthLocation.trim()
    ) {
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
      const formattedDate = birthDate.toISOString().split('T')[0] // YYYY-MM-DD
      const formattedTime = birthTime.toTimeString().split(' ')[0] // HH:MM:SS

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in.')

      // Resolve lat/lon if missing
      let lat = birthLat
      let lon = birthLon
      if (lat == null || lon == null) {
        const results = await geocodePlace(birthLocation.trim())
        if (!results.length) {
          throw new Error(
            'Could not resolve birth location. Please refine it (e.g., "Redwood City, CA").'
          )
        }
        lat = results[0].lat
        lon = results[0].lon
        setBirthLat(lat)
        setBirthLon(lon)
      }

      const { error: upErr } = await supabase
        .from('users')
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

  const onSkip = () => navigation.goBack()

  if (loading) {
    return (
      <AuthContainer>
        <View style={uiStyles.center}>
          <ActivityIndicator />
          <Text style={[uiStyles.text, { marginTop: 8 }]}>Loading…</Text>
        </View>
      </AuthContainer>
    )
  }

  return (
    <AuthContainer>
      {/* Top bar */}
      <View style={[styles.topRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={onSkip} style={styles.iconBtn}>
          <Text style={styles.iconText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Complete Profile</Text>

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={[styles.savePill, saving && { opacity: 0.7 }]}
        >
          {saving ? <ActivityIndicator /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      {error && <Text style={[uiStyles.errorText, { marginBottom: 10 }]}>{error}</Text>}

      <ProfileFields
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        birthTime={birthTime}
        setBirthTime={setBirthTime}
        birthLocation={birthLocation}
        setBirthLocation={setBirthLocation}
        timeZone={timeZone}
        setTimeZone={setTimeZone}
        birthLat={birthLat}
        birthLon={birthLon}
      />

      <View style={{ height: 12 }} />

      {/* Footer actions */}
      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
      >
        <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save & Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} disabled={saving} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>Skip for now</Text>
      </TouchableOpacity>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
    color: theme.colors.text,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  savePill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBg,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: theme.colors.text,
    fontWeight: '800',
  },

  primaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },

  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.sub,
    fontWeight: '700',
  },
})
