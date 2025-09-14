// screens/DashboardScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'

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

  const nav = useNavigation<any>()
  const didEnsureOnce = useRef(false)
  const didNavigateRef = useRef(false) // ← ADD THIS

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
        setError('No active session found.')
        return
      }

      // Ensure a row exists (older accounts might not have one in rare cases)
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

      // ← ADD THIS BLOCK RIGHT AFTER setProfile(u):
      if (needsProfileCompletion(u) && !didNavigateRef.current) {
        (nav as any).navigate('CompleteProfile')
        didNavigateRef.current = true
      }

    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [nav])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const displayName =
    (profile?.first_name?.trim() || '') +
    (profile?.last_name ? ` ${profile.last_name}` : '')

  const prettyTime = (() => {
    const t = profile?.birth_time
    if (!t) return '—'
    const [h, m] = t.split(':') // "HH:MM:SS" -> ["HH","MM","SS"]
    const d = new Date()
    d.setHours(parseInt(h || '0', 10), parseInt(m || '0', 10), 0, 0) // local time
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
      {/* View Birth Chart */}
<Button
  title="View Birth Chart"
  onPress={() => (nav as any).navigate('Chart', { profile })}
  disabled={!profile || needsProfileCompletion(profile)}
/>
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
    padding: 12, backgroundColor: '#fff'
  },
  cardTitle: { fontWeight: '600', marginBottom: 6 },
})
