// screens/DashboardScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'

import { birthToUTC } from '../lib/time'
import { computeNatalPlanets } from '../lib/astro'
import { normalizeZone } from '../lib/timezones'
import { saveChart } from '../lib/charts'

// zodiac helpers
const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const ZODIAC_GLY = ['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎']
const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30)

type User = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  birth_time: string | null
  birth_location: string | null
  time_zone: string | null
}

function needsProfileCompletion(p: Partial<User> | null | undefined) {
  if (!p) return true
  return !p.first_name || !p.last_name || !p.birth_date || !p.birth_time || !p.birth_location || !p.time_zone
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sunSign, setSunSign] = useState<string | null>(null)
  const [moonSign, setMoonSign] = useState<string | null>(null)

  const nav = useNavigation<any>()
  const didEnsureOnce = useRef(false)
  const didNavigateRef = useRef(false)
  const unmounted = useRef(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1) Session
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) {
        setSunSign(null); setMoonSign(null)
        setError('No active session found.')
        return
      }

      // 2) Ensure profile row exists (once)
      if (!didEnsureOnce.current) {
        await supabase.from('users').upsert(
          { id: user.id, email: user.email ?? null },
          { onConflict: 'id' }
        )
        didEnsureOnce.current = true
      }

      // 3) Load profile
      const { data, error: profErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (profErr) throw profErr

      const u = (data as User) ?? null
      setProfile(u)

      // 4) If profile incomplete → navigate once and clear signs
      if (needsProfileCompletion(u)) {
        setSunSign(null); setMoonSign(null)
        if (!didNavigateRef.current) {
          (nav as any).navigate('CompleteProfile')
          didNavigateRef.current = true
        }
        return
      }

      // 5) Try to load saved chart for (user, birth_date, birth_time, time_zone)
      const tz = normalizeZone(u.time_zone!)
      if (!(tz && u.birth_date && u.birth_time)) {
        setSunSign(null); setMoonSign(null)
        return
      }

      const { data: existing } = await supabase
        .from('charts')
        .select('chart_data')
        .eq('user_id', user.id)
        .eq('birth_date', u.birth_date)
        .eq('birth_time', u.birth_time)
        .eq('time_zone', tz)
        .maybeSingle()

      if (existing?.chart_data?.planets) {
        const planets = existing.chart_data.planets as { name: string; lon: number }[]
        const sun = planets.find(p => p.name === 'Sun')
        const moon = planets.find(p => p.name === 'Moon')
        setSunSign(sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null)
        setMoonSign(moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null)
      } else {
        // 6) Compute once and save for future loads
        const { jsDate } = birthToUTC(u.birth_date, u.birth_time, tz)
        const planets = computeNatalPlanets(jsDate)
        try {
          await saveChart(user.id, {
            name: `${u.first_name ?? 'My'} Natal Chart`,
            birth_date: u.birth_date,
            birth_time: u.birth_time,
            time_zone: tz,
          })
        } catch (e) {
          // Non-fatal (e.g., unique constraint already satisfied elsewhere)
          console.warn('saveChart failed:', e)
        }
        const sun = planets.find(p => p.name === 'Sun')
        const moon = planets.find(p => p.name === 'Moon')
        setSunSign(sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null)
        setMoonSign(moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null)
      }
    } catch (e: any) {
      if (!unmounted.current) {
        setError(e?.message ?? 'Failed to load dashboard.')
        setSunSign(null); setMoonSign(null)
      }
    } finally {
      if (!unmounted.current) setLoading(false)
    }
  }, [nav])

  useEffect(() => {
    unmounted.current = false
    return () => { unmounted.current = true }
  }, [])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const displayName =
    (profile?.first_name?.trim() || '') +
    (profile?.last_name ? ` ${profile.last_name}` : '')

  const prettyTime = (() => {
    const t = profile?.birth_time
    if (!t) return '—'
    const [h, m] = t.split(':')
    const d = new Date()
    d.setHours(parseInt(h || '0', 10), parseInt(m || '0', 10), 0, 0)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  })()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading your dashboard…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'crimson', marginBottom: 12 }}>{error}</Text>
        <Button title="Retry" onPress={load} />
        <View style={{ height: 8 }} />
        <Button title="Sign Out" onPress={signOut} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Welcome to Naksha 🌌</Text>
      <Text style={styles.sub}>
        {displayName ? `Hello, ${displayName}!` : 'Hello!'}
      </Text>

      {sunSign && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Signs</Text>
          <Text>☀️ Sun: {sunSign}</Text>
          <Text>🌙 Moon: {moonSign ?? '—'}</Text>
        </View>
      )}

      {profile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Birth Details</Text>
          <Text>Email: {profile.email ?? '—'}</Text>
          <Text>Date: {profile.birth_date ?? '—'}</Text>
          <Text>Time: {prettyTime}</Text>
          <Text>Location: {profile.birth_location ?? '—'}</Text>
          <Text>Time Zone: {profile.time_zone ?? '—'}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text>No profile row found yet.</Text>
          <Text style={{ opacity: 0.7 }}>
            (You’ll get one after confirming email from Sign Up.)
          </Text>
        </View>
      )}

      <View style={{ height: 12 }} />
      <Button
        title="View Birth Chart"
        onPress={() => (nav as any).navigate('Chart', { profile })}
        disabled={!profile || needsProfileCompletion(profile)}
      />
      <Button title="My Charts" onPress={() => (nav as any).navigate('MyCharts')} />
      <Button title="Sign Out" onPress={signOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, padding: 20, paddingTop: 40 },
  h1: { fontSize: 22, fontWeight: '600' },
  sub: { marginTop: 6, marginBottom: 16, opacity: 0.9 },
  card: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, backgroundColor: '#fff', marginBottom: 12
  },
  cardTitle: { fontWeight: '600', marginBottom: 6 },
})
