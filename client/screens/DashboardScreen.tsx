//screens/DashboardScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'
import { normalizeZone } from '../lib/timezones'
import { saveChart, buildChartData } from '../lib/charts'

import { uiStyles } from '../components/ui/uiStyles'
import { AppText, MutedText, TitleText } from '../components/ui/AppText'
import { formatShortTimeFromHHMM } from '../lib/time'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]
const ZODIAC_GLY = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎']
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
  birth_lat: number | null
  birth_lon: number | null
}

function needsProfileCompletion(p: Partial<User> | null | undefined) {
  if (!p) return true
  return (
    !p.first_name ||
    !p.last_name ||
    !p.birth_date ||
    !p.birth_time ||
    !p.birth_location ||
    !p.time_zone
  )
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

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr) throw userErr

      if (!user) {
        setSunSign(null)
        setMoonSign(null)
        setError('No active session found.')
        return
      }

      if (!didEnsureOnce.current) {
        await supabase.from('users').upsert(
          { id: user.id, email: user.email ?? null },
          { onConflict: 'id' }
        )
        didEnsureOnce.current = true
      }

      const { data, error: profErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profErr) throw profErr

      const u = (data as User) ?? null
      setProfile(u)

      if (needsProfileCompletion(u)) {
        setSunSign(null)
        setMoonSign(null)

        if (!didNavigateRef.current) {
          nav.navigate('CompleteProfile')
          didNavigateRef.current = true
        }
        return
      }

      const tz = normalizeZone(u.time_zone!)
      if (!(tz && u.birth_date && u.birth_time)) {
        setSunSign(null)
        setMoonSign(null)
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

        const sun = planets.find((p) => p.name === 'Sun')
        const moon = planets.find((p) => p.name === 'Moon')

        setSunSign(sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null)
        setMoonSign(moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null)
      } else {
        const payload = buildChartData({
          name: `${u.first_name ?? 'My'} Natal Chart`,
          birth_date: u.birth_date,
          birth_time: u.birth_time,
          time_zone: tz,
          birth_lat: u.birth_lat ?? null,
          birth_lon: u.birth_lon ?? null,
        })

        try {
          await saveChart(user.id, {
            name: payload.meta.name,
            birth_date: payload.meta.birth_date,
            birth_time: payload.meta.birth_time,
            time_zone: payload.meta.time_zone,
            birth_lat: payload.meta.birth_lat,
            birth_lon: payload.meta.birth_lon,
            chart_data: payload,
          })
        } catch (e) {
          console.warn('saveChart failed:', e)
        }

        const sun = payload.planets.find((p) => p.name === 'Sun')
        const moon = payload.planets.find((p) => p.name === 'Moon')

        setSunSign(sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null)
        setMoonSign(moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null)
      }
    } catch (e: any) {
      if (!unmounted.current) {
        setError(e?.message ?? 'Failed to load dashboard.')
        setSunSign(null)
        setMoonSign(null)
      }
    } finally {
      if (!unmounted.current) setLoading(false)
    }
  }, [nav])

  useEffect(() => {
    unmounted.current = false
    return () => {
      unmounted.current = true
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const displayName =
    (profile?.first_name?.trim() || '') +
    (profile?.last_name ? ` ${profile.last_name}` : '')

  const prettyTime = formatShortTimeFromHHMM(profile?.birth_time)

  if (loading) {
    return (
      <View style={uiStyles.center}>
        <ActivityIndicator />
        <AppText style={[uiStyles.text, { marginTop: 8, textAlign: 'center' }]}>
          Loading…
        </AppText>
      </View>
    )
  }

  if (error) {
    return (
      <View style={uiStyles.center}>
        <AppText style={uiStyles.errorText}>{error}</AppText>
        <Button title="Retry" onPress={load} />
        <View style={{ height: 8 }} />
        <Button title="Sign Out" onPress={signOut} />
      </View>
    )
  }

  return (
    <View style={uiStyles.screen}>
      <TitleText style={uiStyles.h1}>Welcome to Naksha 🌌</TitleText>
      <AppText style={uiStyles.sub}>
        {displayName ? `Hello, ${displayName}!` : 'Hello!'}
      </AppText>

      {sunSign && (
        <Card>
          <AppText style={uiStyles.cardTitle}>Your Signs</AppText>
          <AppText>☀️ Sun: {sunSign}</AppText>
          <AppText>🌙 Moon: {moonSign ?? '—'}</AppText>
        </Card>
      )}

      {profile ? (
        <Card>
          <AppText style={uiStyles.cardTitle}>Your Birth Details</AppText>
          <AppText>Email: {profile.email ?? '—'}</AppText>
          <AppText>Date: {profile.birth_date ?? '—'}</AppText>
          <AppText>Time: {prettyTime}</AppText>
          <AppText>Location: {profile.birth_location ?? '—'}</AppText>
          <AppText>Time Zone: {profile.time_zone ?? '—'}</AppText>
        </Card>
      ) : (
        <Card>
          <AppText style={uiStyles.cardTitle}>Profile</AppText>
          <AppText>No profile row found yet.</AppText>
          <MutedText>
            (You’ll get one after confirming email from Sign Up.)
          </MutedText>
        </Card>
      )}

      <View style={{ height: 12 }} />

      <Button
        title="Edit Birth Details"
        variant="ghost"
        onPress={() => nav.navigate('CompleteProfile')}
      />

      <Button
        title="View Birth Chart"
        variant="ghost"
        onPress={() => nav.navigate('Chart', { profile })}
        disabled={!profile || needsProfileCompletion(profile)}
        style={{ marginTop: 8 }}
      />

      <Button
        title="My Charts"
        variant="ghost"
        onPress={() => nav.navigate('MyCharts')}
        style={{ marginTop: 8 }}
      />

      <Button
        title="Journal"
        variant="ghost"
        onPress={() => nav.navigate('JournalList')}
        style={{ marginTop: 8 }}
      />

      <Button
        title="My Profile"
        variant="ghost"
        onPress={() => nav.navigate('Profile')}
        style={{ marginTop: 8 }}
      />

      <Button
        title="Sign Out"
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: 8 }}
      />
    </View>
  )
}