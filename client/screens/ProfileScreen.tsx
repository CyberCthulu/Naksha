// screens/ProfileScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'

import { uiStyles } from '../components/ui/uiStyles'
import { theme } from '../components/ui/theme'

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
  const insets = useSafeAreaInsets()

  // ✅ prevent “double header” clash (stack header + in-screen header)
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

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
      if (subErr && subErr.code !== 'PGRST116') throw subErr
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
      <View style={uiStyles.center}>
        <ActivityIndicator />
        <Text style={[uiStyles.text, { marginTop: 8 }]}> Loading… </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.link}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: theme.spacing.screen,
        paddingTop: insets.top + 12, // ✅ avoids header/status overlap
        paddingBottom: insets.bottom + 32,
      }}
    >
      {/* Top bar (in-screen header) */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>My Profile</Text>

        <TouchableOpacity onPress={onEditProfile} style={styles.editBtn}>
          <Text style={styles.link}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Header / Avatar */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{prettyName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{prettyName}</Text>
          <Text style={styles.email}>{userProfile?.email ?? '—'}</Text>
        </View>
      </View>

      {/* Birth details */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Birth Details</Text>
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
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Chart Preferences</Text>

        <Text style={styles.subheading}>House System</Text>
        <ChoiceRow label="Whole Sign (default)" selected={prefs.house_system === 'whole_sign'} onPress={() => onUpdatePrefs({ house_system: 'whole_sign' })} />
        <ChoiceRow label="Placidus (coming soon)" selected={prefs.house_system === 'placidus'} onPress={() => onUpdatePrefs({ house_system: 'placidus' })} />
        <ChoiceRow label="Equal House (coming soon)" selected={prefs.house_system === 'equal'} onPress={() => onUpdatePrefs({ house_system: 'equal' })} />

        <Text style={styles.subheading}>Zodiac</Text>
        <ChoiceRow label="Tropical" selected={prefs.zodiac_type === 'tropical'} onPress={() => onUpdatePrefs({ zodiac_type: 'tropical' })} />
        <ChoiceRow label="Sidereal (coming soon)" selected={prefs.zodiac_type === 'sidereal'} onPress={() => onUpdatePrefs({ zodiac_type: 'sidereal' })} />

        <Text style={styles.subheading}>Aspect Orbs</Text>
        <ChoiceRow label="Tight" selected={prefs.orb_mode === 'tight'} onPress={() => onUpdatePrefs({ orb_mode: 'tight' })} />
        <ChoiceRow label="Medium (default)" selected={prefs.orb_mode === 'medium'} onPress={() => onUpdatePrefs({ orb_mode: 'medium' })} />
        <ChoiceRow label="Loose" selected={prefs.orb_mode === 'loose'} onPress={() => onUpdatePrefs({ orb_mode: 'loose' })} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={uiStyles.text}>Show house degrees</Text>
            <Text style={styles.switchHint}>
              Turn off if you prefer a simpler wheel (just house numbers).
            </Text>
          </View>
          <Switch
            value={prefs.show_house_degrees}
            onValueChange={(v) => onUpdatePrefs({ show_house_degrees: v })}
            trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(0,122,255,0.6)' }}
            thumbColor={prefs.show_house_degrees ? '#007AFF' : '#999'}
          />
        </View>

        {savingPrefs && <Text style={styles.savingText}>Saving preferences…</Text>}
      </View>

      {/* Subscription */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Subscription</Text>
        {subscription ? (
          <>
            <Row label="Plan" value={subscription.plan} />
            <Row label="Status" value={subscription.status} />
            <Row label="Started" value={subscription.start_date} />
            <Row label="Ends" value={subscription.end_date ?? '—'} />
            <Text style={styles.cardHint}>Manage or upgrade your plan from the billing portal (coming soon).</Text>
          </>
        ) : (
          <>
            <Text style={uiStyles.text}>You’re currently on the free plan.</Text>
            <Text style={styles.cardHint}>
              In future versions, you’ll see your premium status and manage your subscription here.
            </Text>
          </>
        )}
      </View>

      {/* Purchases */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Purchases</Text>
        {purchases.length === 0 ? (
          <Text style={uiStyles.muted}>No purchases yet.</Text>
        ) : (
          purchases.map((p) => (
            <View key={p.id} style={{ marginBottom: 6 }}>
              <Text style={[uiStyles.text, { fontWeight: '500' }]}>
                {p.product_type}: {p.product_id}
              </Text>
              <Text style={uiStyles.muted}>
                {p.amount} {p.currency.toUpperCase()} · {new Date(p.purchase_date).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Data & Privacy */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Data & Privacy</Text>
        <TouchableOpacity style={styles.actionRow} onPress={onExportData}>
          <Text style={styles.link}>Export my data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={onDeleteAccount}>
          <Text style={[styles.link, { color: theme.colors.danger }]}>Request account deletion</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Account</Text>
        <TouchableOpacity style={styles.actionRow} onPress={onSignOut}>
          <Text style={[styles.link, { color: theme.colors.danger }]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// Simple label/value row
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
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
      <View style={[styles.choiceDot, selected && styles.choiceDotSelected]} />
      <Text style={uiStyles.text}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  editBtn: { width: 60, alignItems: 'flex-end' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  email: { color: theme.colors.sub, marginTop: 2 },

  link: { fontWeight: '700', color: '#007AFF' },

  cardHint: { marginTop: 6, fontSize: 12, color: theme.colors.muted },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  rowLabel: { color: theme.colors.muted, flexShrink: 0, width: 110 },
  rowValue: { color: theme.colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },

  subheading: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: theme.colors.sub },

  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  choiceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  choiceDotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  switchHint: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  savingText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },

  actionRow: {
    paddingVertical: 8,
  },
})
