// screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'

type DBUser = {
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

type SubscriptionRow = {
  id: number
  user_id: string
  plan: string
  status: string
  start_date: string
  end_date: string | null
}

type PurchaseRow = {
  id: number
  user_id: string
  product_type: string
  product_id: string
  amount: number
  currency: string
  purchase_date: string
}

// Chart preference types – stored in auth.user_metadata
type HouseSystem = 'whole_sign' | 'placidus' | 'equal'
type ZodiacType = 'tropical' | 'sidereal'
type OrbMode = 'tight' | 'medium' | 'loose'

type ChartPreferences = {
  house_system: HouseSystem
  zodiac_type: ZodiacType
  orb_mode: OrbMode
  show_house_degrees: boolean
}

const defaultPrefs: ChartPreferences = {
  house_system: 'whole_sign',
  zodiac_type: 'tropical',
  orb_mode: 'medium',
  show_house_degrees: true,
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>()

  const [loading, setLoading] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userProfile, setUserProfile] = useState<DBUser | null>(null)
  const [prefs, setPrefs] = useState<ChartPreferences>(defaultPrefs)
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])

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
        setError('No active session.')
        setUserProfile(null)
        return
      }

      // 1) Profile row
      const { data: profile, error: profErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle<DBUser>()
      if (profErr) throw profErr
      setUserProfile(profile ?? null)

      // 2) Preferences from auth.user_metadata
      const md = (user.user_metadata ?? {}) as any
      const loadedPrefs: ChartPreferences = {
        house_system: md.pref_house_system ?? defaultPrefs.house_system,
        zodiac_type: md.pref_zodiac_type ?? defaultPrefs.zodiac_type,
        orb_mode: md.pref_orb_mode ?? defaultPrefs.orb_mode,
        show_house_degrees:
          typeof md.pref_show_house_degrees === 'boolean'
            ? md.pref_show_house_degrees
            : defaultPrefs.show_house_degrees,
      }
      setPrefs(loadedPrefs)

      // 3) Subscription (latest)
      const { data: sub, error: subErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<SubscriptionRow>()
      if (subErr && subErr.code !== 'PGRST116') {
        // ignore "no rows" style error from maybeSingle, but show others
        throw subErr
      }
      setSubscription(sub ?? null)

      // 4) Recent purchases
      const { data: purch, error: purchErr } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })
        .limit(10)
      if (purchErr) throw purchErr
      setPurchases(purch ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useFocusEffect(
    useCallback(() => {
      // Reload when screen refocuses (e.g., after editing profile)
      load()
    }, [load])
  )

  const prettyName = (() => {
    const fn = userProfile?.first_name?.trim() || ''
    const ln = userProfile?.last_name?.trim() || ''
    return (fn + (ln ? ` ${ln}` : '')).trim() || 'Your Name'
  })()

  const prettyBirthTime = (() => {
    const t = userProfile?.birth_time
    if (!t) return '—'
    const [h, m] = String(t).split(':')
    const d = new Date()
    d.setHours(parseInt(h || '0', 10), parseInt(m || '0', 10), 0, 0)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  })()

  const onEditProfile = () => {
    navigation.navigate('CompleteProfile')
  }

  const onUpdatePrefs = async (next: Partial<ChartPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...next }))
    try {
      setSavingPrefs(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const newPrefs = { ...prefs, ...next }
      await supabase.auth.updateUser({
        data: {
          pref_house_system: newPrefs.house_system,
          pref_zodiac_type: newPrefs.zodiac_type,
          pref_orb_mode: newPrefs.orb_mode,
          pref_show_house_degrees: newPrefs.show_house_degrees,
        },
      })
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Could not update preferences.')
    } finally {
      setSavingPrefs(false)
    }
  }

  const onExportData = () => {
    Alert.alert(
      'Export Data',
      'In a future version, this will generate an export of your charts, journals, and usage. For now, please reach out to support to request an export.',
      [{ text: 'OK' }]
    )
  }

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      "This action can't be done from the app yet. In a future version it will request deletion of your data. For now, please contact support and we'll handle it.",
      [{ text: 'OK' }]
    )
  }

  const onSignOut = async () => {
    try {
      await signOut()
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error')
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading your profile…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'crimson', marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity onPress={load}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header / Avatar */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {prettyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{prettyName}</Text>
          <Text style={styles.email}>{userProfile?.email ?? '—'}</Text>
        </View>
        <TouchableOpacity onPress={onEditProfile}>
          <Text style={styles.link}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Birth details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Birth Details</Text>
        <Row label="Date" value={userProfile?.birth_date ?? '—'} />
        <Row label="Time" value={prettyBirthTime} />
        <Row label="Location" value={userProfile?.birth_location ?? '—'} />
        <Row label="Time Zone" value={userProfile?.time_zone ?? '—'} />
        {userProfile?.birth_lat != null && userProfile?.birth_lon != null && (
          <Row
            label="Coordinates"
            value={`${userProfile.birth_lat.toFixed(3)}, ${userProfile.birth_lon.toFixed(3)}`}
          />
        )}
        <Text style={styles.cardHint}>
          Edit these details in “Complete Profile” to update your natal chart.
        </Text>
      </View>

      {/* Chart Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chart Preferences</Text>

        <Text style={styles.subheading}>House System</Text>
        <ChoiceRow
          label="Whole Sign (default)"
          selected={prefs.house_system === 'whole_sign'}
          onPress={() => onUpdatePrefs({ house_system: 'whole_sign' })}
        />
        <ChoiceRow
          label="Placidus (coming soon)"
          selected={prefs.house_system === 'placidus'}
          onPress={() => onUpdatePrefs({ house_system: 'placidus' })}
        />
        <ChoiceRow
          label="Equal House (coming soon)"
          selected={prefs.house_system === 'equal'}
          onPress={() => onUpdatePrefs({ house_system: 'equal' })}
        />

        <Text style={styles.subheading}>Zodiac</Text>
        <ChoiceRow
          label="Tropical"
          selected={prefs.zodiac_type === 'tropical'}
          onPress={() => onUpdatePrefs({ zodiac_type: 'tropical' })}
        />
        <ChoiceRow
          label="Sidereal (coming soon)"
          selected={prefs.zodiac_type === 'sidereal'}
          onPress={() => onUpdatePrefs({ zodiac_type: 'sidereal' })}
        />

        <Text style={styles.subheading}>Aspect Orbs</Text>
        <ChoiceRow
          label="Tight"
          selected={prefs.orb_mode === 'tight'}
          onPress={() => onUpdatePrefs({ orb_mode: 'tight' })}
        />
        <ChoiceRow
          label="Medium (default)"
          selected={prefs.orb_mode === 'medium'}
          onPress={() => onUpdatePrefs({ orb_mode: 'medium' })}
        />
        <ChoiceRow
          label="Loose"
          selected={prefs.orb_mode === 'loose'}
          onPress={() => onUpdatePrefs({ orb_mode: 'loose' })}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text>Show house degrees</Text>
            <Text style={styles.switchHint}>
              Turn off if you prefer a simpler wheel (just house numbers).
            </Text>
          </View>
          <Switch
            value={prefs.show_house_degrees}
            onValueChange={(v) =>
              onUpdatePrefs({ show_house_degrees: v })
            }
          />
        </View>

        {savingPrefs && (
          <Text style={styles.savingText}>Saving preferences…</Text>
        )}
      </View>

      {/* Subscription */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscription</Text>
        {subscription ? (
          <>
            <Row label="Plan" value={subscription.plan} />
            <Row label="Status" value={subscription.status} />
            <Row label="Started" value={subscription.start_date} />
            <Row
              label="Ends"
              value={subscription.end_date ?? '—'}
            />
            <Text style={styles.cardHint}>
              Manage or upgrade your plan from the billing portal (coming soon).
            </Text>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 4 }}>
              You’re currently on the free plan.
            </Text>
            <Text style={styles.cardHint}>
              In future versions, you’ll see your premium status and manage
              your subscription here.
            </Text>
          </>
        )}
      </View>

      {/* Purchases */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Purchases</Text>
        {purchases.length === 0 ? (
          <Text style={{ opacity: 0.7 }}>No purchases yet.</Text>
        ) : (
          purchases.map((p) => (
            <View key={p.id} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: '500' }}>
                {p.product_type}: {p.product_id}
              </Text>
              <Text style={{ opacity: 0.8 }}>
                {p.amount} {p.currency.toUpperCase()} ·{' '}
                {new Date(p.purchase_date).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Data & Privacy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data & Privacy</Text>
        <TouchableOpacity style={styles.actionRow} onPress={onExportData}>
          <Text style={styles.link}>Export my data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={onDeleteAccount}>
          <Text style={[styles.link, { color: 'crimson' }]}>
            Request account deletion
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <TouchableOpacity style={styles.actionRow} onPress={onSignOut}>
          <Text style={[styles.link, { color: 'crimson' }]}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

// Simple label/value row
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function ChoiceRow({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.choiceRow} onPress={onPress}>
      <View
        style={[
          styles.choiceDot,
          selected && styles.choiceDotSelected,
        ]}
      />
      <Text style={styles.choiceLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { padding: 16, paddingTop: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '600' },
  email: { opacity: 0.8, marginTop: 2 },
  link: { fontWeight: '600', color: '#007AFF' },
  card: {
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '600', marginBottom: 8, fontSize: 16 },
  cardHint: { marginTop: 6, fontSize: 12, opacity: 0.7 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowLabel: { opacity: 0.7 },
  rowValue: { fontWeight: '500' },
  subheading: { marginTop: 8, marginBottom: 4, fontWeight: '600' },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  choiceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 8,
  },
  choiceDotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  choiceLabel: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  switchHint: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  savingText: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  actionRow: {
    paddingVertical: 6,
  },
})
