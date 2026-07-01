// screens/DashboardScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  ActivityIndicator,
  InteractionManager,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'
import { normalizeZone } from '../lib/timezones'
import {
  saveChart,
  buildChartData,
  getChartCalculationPreferences,
} from '../lib/charts'
import { parseChartData } from '../lib/chartDataValidation'
import {
  buildDailyGuidance,
  buildWeeklyForecast,
  type DailyGuidance,
  type WeeklyForecast,
} from '../lib/guidance'
import type { UserRow } from '../lib/domainTypes'
import {
  needsProfileCompletion,
  profileFromAuthMetadata,
} from '../lib/profileCompletion'

import { uiStyles } from '../components/ui/uiStyles'
import { AppText, MutedText, TitleText } from '../components/ui/AppText'
import { formatShortTimeFromHHMM } from '../lib/time'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { theme } from '../components/ui/theme'
import { TodayEnergyCard } from '../components/guidance/TodayEnergyCard'
import { WeeklyForecastCard } from '../components/guidance/WeeklyForecastCard'
import type {
  ReflectionPrompt,
  SuggestedPractice,
} from '../lib/lexicon/guidance'

const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const ZODIAC_GLY = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎']

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30)

function journalPrefill(prompt: ReflectionPrompt, source: string) {
  return {
    id: undefined,
    initialTitle: `Reflection — ${source}`,
    initialContent: [
      'Prompt:',
      prompt.prompt,
      '',
      'Context:',
      source,
      '',
      'Reflection:',
      '',
    ].join('\n'),
    promptTemplateId: prompt.id,
    promptSource: source,
  }
}

function shadowJournalPrefill(
  prompt: ReflectionPrompt,
  practice: SuggestedPractice,
  source: string
) {
  return {
    id: undefined,
    initialTitle: `Shadow Reflection — ${source}`,
    initialContent: [
      'Prompt:',
      prompt.prompt,
      '',
      'Practice:',
      practice.summary,
      ...practice.steps.map((step, index) => `${index + 1}. ${step}`),
      '',
      'Reflection:',
      '',
    ].join('\n'),
    promptTemplateId: prompt.id,
    promptSource: `Shadow Work — ${source}`,
  }
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sunSign, setSunSign] = useState<string | null>(null)
  const [moonSign, setMoonSign] = useState<string | null>(null)
  const [todayEnergy, setTodayEnergy] = useState<DailyGuidance | null>(null)
  const [weeklyForecast, setWeeklyForecast] =
    useState<WeeklyForecast | null>(null)

  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()

  const openJournalPrompt = useCallback(
    (prompt: ReflectionPrompt, source: string) => {
      nav.navigate('JournalEditor', journalPrefill(prompt, source))
    },
    [nav]
  )

  const openShadowReflection = useCallback(
    (
      prompt: ReflectionPrompt,
      practice: SuggestedPractice,
      source: string
    ) => {
      nav.navigate(
        'JournalEditor',
        shadowJournalPrefill(prompt, practice, source)
      )
    },
    [nav]
  )

  const didEnsureOnce = useRef(false)
  const didNavigateRef = useRef(false)
  const unmounted = useRef(false)
  const loadingRef = useRef(false)
  const lastLoadAtRef = useRef(0)

  const load = useCallback(async () => {
    const now = Date.now()

    if (loadingRef.current) return
    if (now - lastLoadAtRef.current < 500) return

    loadingRef.current = true
    lastLoadAtRef.current = now

    try {
      if (!unmounted.current) {
        setLoading(true)
        setError(null)
      }

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr) throw userErr

      if (!user) {
        setProfile(null)
        setSunSign(null)
        setMoonSign(null)
        setTodayEnergy(null)
        setWeeklyForecast(null)
        setError('No active session found.')
        return
      }

      if (!didEnsureOnce.current) {
        await supabase
          .from('users')
          .upsert(
            { id: user.id, email: user.email ?? '' },
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

      let u = (data as UserRow) ?? null

      if (needsProfileCompletion(u)) {
        const mdProfile = profileFromAuthMetadata(user.user_metadata)

        if (!needsProfileCompletion(mdProfile)) {
          const { data: merged, error: mergeErr } = await supabase
            .from('users')
            .upsert(
              {
                id: user.id,
                email: user.email ?? '',
                ...mdProfile,
              },
              { onConflict: 'id' }
            )
            .select('*')
            .maybeSingle()

          if (mergeErr) throw mergeErr

          if (merged) {
            u = merged as UserRow
          }
        }
      }

      setProfile(u)

      if (needsProfileCompletion(u)) {
        setSunSign(null)
        setMoonSign(null)
        setTodayEnergy(null)
        setWeeklyForecast(null)

        if (!didNavigateRef.current) {
          didNavigateRef.current = true
          nav.navigate('CompleteProfile')
        }

        return
      }

      const tz = normalizeZone(u.time_zone!)
      if (!(tz && u.birth_date && u.birth_time)) {
        setSunSign(null)
        setMoonSign(null)
        setTodayEnergy(null)
        setWeeklyForecast(null)
        return
      }

      const birthLat = u.birth_lat
      const birthLon = u.birth_lon
      const hasChartCoordinates = birthLat != null && birthLon != null

      const { data: existing, error: chartLookupError } = hasChartCoordinates
        ? await supabase
            .from('charts')
            .select('chart_data')
            .eq('user_id', user.id)
            .eq('birth_date', u.birth_date)
            .eq('birth_time', u.birth_time)
            .eq('time_zone', tz)
            .eq('birth_lat', birthLat)
            .eq('birth_lon', birthLon)
            .maybeSingle()
        : { data: null, error: null }

      if (chartLookupError) {
        throw new Error(
          'Could not load your saved chart. Please try again.'
        )
      }

      const existingChart = existing?.chart_data
        ? parseChartData(existing.chart_data)
        : null

      if (existingChart) {
        const planets = existingChart.planets

        const sun = planets.find((p) => p.name === 'Sun')
        const moon = planets.find((p) => p.name === 'Moon')

        setSunSign(
          sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null
        )
        setMoonSign(
          moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null
        )
        const evaluatedAt = new Date()
        setTodayEnergy(
          buildDailyGuidance({
            natalPlanets: planets,
            evaluatedAt,
          })
        )
        setWeeklyForecast(
          buildWeeklyForecast({
            natalPlanets: planets,
            evaluatedAt,
            timeZone: tz,
          })
        )

        return
      }

      const calculationPreferences = await getChartCalculationPreferences(
        user.id
      )

      const payload = buildChartData(
        {
          name: `${u.first_name ?? 'My'} Natal Chart`,
          birth_date: u.birth_date,
          birth_time: u.birth_time,
          time_zone: tz,
          birth_lat: u.birth_lat ?? null,
          birth_lon: u.birth_lon ?? null,
        },
        calculationPreferences
      )

      if (hasChartCoordinates) {
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
          console.warn('Auto-save failed:', e)
        }
      }

      const sun = payload.planets.find((p) => p.name === 'Sun')
      const moon = payload.planets.find((p) => p.name === 'Moon')

      setSunSign(
        sun ? `${ZODIAC_GLY[signOf(sun.lon)]} ${ZODIAC[signOf(sun.lon)]}` : null
      )
      setMoonSign(
        moon ? `${ZODIAC_GLY[signOf(moon.lon)]} ${ZODIAC[signOf(moon.lon)]}` : null
      )
      const evaluatedAt = new Date()
      setTodayEnergy(
        buildDailyGuidance({
          natalPlanets: payload.planets,
          evaluatedAt,
        })
      )
      setWeeklyForecast(
        buildWeeklyForecast({
          natalPlanets: payload.planets,
          evaluatedAt,
          timeZone: tz,
        })
      )
    } catch (e: any) {
      if (!unmounted.current) {
        setError(e?.message ?? 'Failed to load dashboard.')
        setSunSign(null)
        setMoonSign(null)
        setTodayEnergy(null)
        setWeeklyForecast(null)
      }
    } finally {
      loadingRef.current = false

      if (!unmounted.current) {
        setLoading(false)
      }
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
      didNavigateRef.current = false

      const task = InteractionManager.runAfterInteractions(() => {
        load()
      })

      return () => task.cancel()
  }, [load])
  )

  const displayName =
    (profile?.first_name?.trim() || '') +
    (profile?.last_name ? ` ${profile.last_name}` : '')

  const prettyTime = profile?.birth_time
    ? formatShortTimeFromHHMM(profile.birth_time)
    : '—'
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        { paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
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
          <MutedText>(You’ll get one after confirming email from Sign Up.)</MutedText>
        </Card>
      )}

      {todayEnergy && (
        <TodayEnergyCard
          guidance={todayEnergy}
          onJournalPrompt={(prompt) =>
            openJournalPrompt(prompt, 'Today’s Energy')
          }
          onShadowReflection={(prompt, practice) =>
            openShadowReflection(
              prompt,
              practice,
              'Today’s Energy'
            )
          }
        />
      )}

      {weeklyForecast && (
        <WeeklyForecastCard
          forecast={weeklyForecast}
          onJournalPrompt={(prompt) =>
            openJournalPrompt(prompt, 'Weekly Forecast')
          }
          onShadowReflection={(prompt, practice) =>
            openShadowReflection(
              prompt,
              practice,
              'Weekly Forecast'
            )
          }
        />
      )}

      <View style={styles.actionsPanel}>
        <Button
          title="View Birth Chart"
          onPress={() => nav.navigate('Chart', { profile, chartMode: 'self' })}
          disabled={!profile || needsProfileCompletion(profile)}
        />
        <View style={styles.actionGrid}>
          <View style={styles.actionCell}>
            <Button
              title="Guest Chart"
              variant="ghost"
              onPress={() => nav.navigate('CreateGuestChart')}
            />
          </View>
          <View style={styles.actionCell}>
            <Button
              title="My Charts"
              variant="ghost"
              onPress={() => nav.navigate('MyCharts')}
            />
          </View>
          <View style={styles.actionCell}>
            <Button
              title="Journal"
              variant="ghost"
              onPress={() => nav.navigate('JournalList')}
            />
          </View>
          <View style={styles.actionCell}>
            <Button
              title="Edit Details"
              variant="ghost"
              onPress={() => nav.navigate('CompleteProfile')}
            />
          </View>
          <View style={styles.actionCell}>
            <Button
              title="My Profile"
              variant="ghost"
              onPress={() => nav.navigate('Profile')}
            />
          </View>
          <View style={styles.actionCell}>
            <Button title="Sign Out" variant="ghost" onPress={signOut} />
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: theme.spacing.screen,
    paddingTop: theme.spacing.top,
  },
  actionsPanel: {
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    marginTop: 8,
  },
  actionCell: {
    flexBasis: '48%',
    flexGrow: 1,
  },
})
