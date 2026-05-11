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
import { formatShortTimeFromHHMM } from '../lib/time'
import type { PurchaseRow, SubscriptionRow, UserRow } from '../lib/domainTypes'
import ProfileHeader from '../components/profile/ProfileHeader'
import BirthDetailsCard from '../components/profile/BirthDetailsCard'
import SubscriptionCard from '../components/profile/SubscriptionCard'
import PurchasesCard from '../components/profile/PurchasesCard'
import DataPrivacyCard from '../components/profile/DataPrivacyCard'

// Chart preference types – stored in public.chart_preferences
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
  show_house_degrees: false,
}

type ChartPreferencesRow = ChartPreferences & {
  user_id: string
}

const CHART_PREFERENCES_SELECT =
  'user_id,house_system,zodiac_type,orb_mode,show_house_degrees'

function supportedChartPreferences(input: Partial<ChartPreferences>): ChartPreferences {
  return {
    house_system:
      input.house_system === 'whole_sign'
        ? input.house_system
        : defaultPrefs.house_system,
    zodiac_type:
      input.zodiac_type === 'tropical'
        ? input.zodiac_type
        : defaultPrefs.zodiac_type,
    orb_mode:
      input.orb_mode === 'medium'
        ? input.orb_mode
        : defaultPrefs.orb_mode,
    show_house_degrees: defaultPrefs.show_house_degrees,
  }
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

  const [userProfile, setUserProfile] = useState<UserRow | null>(null)
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
        .maybeSingle<UserRow>()
      if (profErr) throw profErr
      setUserProfile(profile ?? null)

      // 2) Chart preferences row
      const { data: prefRow, error: prefErr } = await supabase
        .from('chart_preferences')
        .select(CHART_PREFERENCES_SELECT)
        .eq('user_id', user.id)
        .maybeSingle<ChartPreferencesRow>()
      if (prefErr) throw prefErr

      if (prefRow) {
        setPrefs(supportedChartPreferences(prefRow))
      } else {
        const defaults = supportedChartPreferences(defaultPrefs)
        const { data: insertedPrefs, error: insertPrefErr } = await supabase
          .from('chart_preferences')
          .upsert(
            {
              user_id: user.id,
              ...defaults,
            },
            { onConflict: 'user_id' }
          )
          .select(CHART_PREFERENCES_SELECT)
          .maybeSingle<ChartPreferencesRow>()
        if (insertPrefErr) throw insertPrefErr
        setPrefs(supportedChartPreferences(insertedPrefs ?? defaults))
      }

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

  const prettyBirthTime = formatShortTimeFromHHMM(userProfile?.birth_time)

  const onEditProfile = () => {
    navigation.navigate('CompleteProfile')
  }

  const onUpdatePrefs = async (next: Partial<ChartPreferences>) => {
    const newPrefs = supportedChartPreferences({ ...prefs, ...next })
    setPrefs(newPrefs)
    try {
      setSavingPrefs(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { data: savedPrefs, error: prefErr } = await supabase
        .from('chart_preferences')
        .upsert(
          {
            user_id: user.id,
            ...newPrefs,
          },
          { onConflict: 'user_id' }
        )
        .select(CHART_PREFERENCES_SELECT)
        .maybeSingle<ChartPreferencesRow>()
      if (prefErr) throw prefErr

      setPrefs(supportedChartPreferences(savedPrefs ?? newPrefs))
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
      <ProfileHeader
        prettyName={prettyName}
        email={userProfile?.email}
        onBack={() => navigation.goBack()}
        onEditProfile={onEditProfile}
      />

      {/* Birth details */}
      <BirthDetailsCard
        userProfile={userProfile}
        prettyBirthTime={prettyBirthTime}
      />

      {/* Chart Preferences */}
      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Chart Preferences</Text>
        <Text style={styles.cardHint}>
          Charts currently use Whole Sign houses, Tropical zodiac, and standard fixed aspect orbs.
        </Text>

        <Text style={styles.subheading}>House System</Text>
        <ChoiceRow
          label="Whole Sign"
          note="Current chart engine"
          selected={prefs.house_system === 'whole_sign'}
          onPress={() => onUpdatePrefs({ house_system: 'whole_sign' })}
        />
        <ChoiceRow label="Placidus" note="Coming soon" selected={false} disabled />
        <ChoiceRow label="Equal House" note="Coming soon" selected={false} disabled />

        <Text style={styles.subheading}>Zodiac</Text>
        <ChoiceRow
          label="Tropical"
          note="Current chart engine"
          selected={prefs.zodiac_type === 'tropical'}
          onPress={() => onUpdatePrefs({ zodiac_type: 'tropical' })}
        />
        <ChoiceRow label="Sidereal" note="Coming soon" selected={false} disabled />

        <Text style={styles.subheading}>Aspect Orbs</Text>
        <ChoiceRow
          label="Standard fixed orbs"
          note="Current chart engine"
          selected={prefs.orb_mode === 'medium'}
          onPress={() => onUpdatePrefs({ orb_mode: 'medium' })}
        />
        <ChoiceRow label="Tight orbs" note="Coming soon" selected={false} disabled />
        <ChoiceRow label="Loose orbs" note="Coming soon" selected={false} disabled />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[uiStyles.text, styles.disabledText]}>
              Show house degrees
            </Text>
            <Text style={styles.switchHint}>
              Coming soon.
            </Text>
          </View>
          <Switch
            value={prefs.show_house_degrees}
            disabled
            trackColor={{ false: 'rgba(255,255,255,0.25)', true: 'rgba(0,122,255,0.6)' }}
            thumbColor={prefs.show_house_degrees ? '#007AFF' : '#999'}
          />
        </View>

        {savingPrefs && <Text style={styles.savingText}>Saving preferences…</Text>}
      </View>

      {/* Subscription */}
      <SubscriptionCard subscription={subscription} />

      {/* Purchases */}
      <PurchasesCard purchases={purchases} />

      {/* Data & Privacy */}
      <DataPrivacyCard
        onExportData={onExportData}
        onDeleteAccount={onDeleteAccount}
      />

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

function ChoiceRow({
  label,
  note,
  selected,
  onPress,
  disabled = false,
}: {
  label: string
  note?: string
  selected: boolean
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.choiceRow, disabled && styles.choiceRowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.choiceDot, selected && styles.choiceDotSelected]} />
      <View style={{ flex: 1 }}>
        <Text style={[uiStyles.text, disabled && styles.disabledText]}>{label}</Text>
        {note ? <Text style={styles.choiceHint}>{note}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  link: { fontWeight: '700', color: '#007AFF' },

  cardHint: { marginTop: 6, fontSize: 12, color: theme.colors.muted },

  subheading: { marginTop: 10, marginBottom: 6, fontWeight: '700', color: theme.colors.sub },

  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  choiceRowDisabled: {
    opacity: 0.65,
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
  choiceHint: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 1,
  },
  disabledText: {
    color: theme.colors.muted,
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
