// screens/ProfileScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
import ChartPreferencesCard from '../components/profile/ChartPreferencesCard'
import AccountActionsCard from '../components/profile/AccountActionsCard'

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
      <ChartPreferencesCard
        prefs={prefs}
        savingPrefs={savingPrefs}
        onUpdatePrefs={onUpdatePrefs}
      />

      {/* Subscription */}
      <SubscriptionCard subscription={subscription} />

      {/* Purchases */}
      <PurchasesCard purchases={purchases} />

      <AccountActionsCard
        onExportData={onExportData}
        onDeleteAccount={onDeleteAccount}
        onSignOut={onSignOut}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  link: { fontWeight: '700', color: '#007AFF' },
})
