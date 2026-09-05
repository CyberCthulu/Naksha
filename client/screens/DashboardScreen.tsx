// screens/DashboardScreen.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Alert,
  View,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import supabase from '../lib/supabase'
import { signOut } from '../lib/auth'
import { normalizeZone } from '../lib/timezones'
import {
  saveChart,
  buildChartData,
  getChartCalculationPreferences,
  type ChartData,
} from '../lib/charts'
import { hydrateChartData } from '../lib/chartHydration'
import {
  UNSUPPORTED_CHART_DATA_MESSAGE,
  validateChartData,
} from '../lib/chartDataValidation'
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

import { AppText } from '../components/ui/AppText'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon, type IconName } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import { formatShortTimeFromHHMM } from '../lib/time'
import { theme } from '../components/ui/theme'
import { TodayEnergyCard } from '../components/guidance/TodayEnergyCard'
import { WeeklyForecastCard } from '../components/guidance/WeeklyForecastCard'
import type {
  ReflectionPrompt,
  SuggestedPractice,
} from '../lib/lexicon/guidance'
import type { RootStackParamList } from '../navigation/types'

const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Planet glyphs. Content, not chrome -- deliberately not Icon names. */
const SUN_GLYPH = '☉'
const MOON_GLYPH = '☽'

/**
 * "10 Dec 1815" from a stored YYYY-MM-DD.
 *
 * Read field by field rather than through `new Date(...)`, which would
 * interpret a stored calendar date in the device's zone and can land a day
 * either side of the one the reader entered. An unparseable value is shown
 * unchanged rather than guessed at.
 */
function formatBirthDate(value: string | null | undefined): string | null {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  const monthName = MONTHS[month - 1]

  if (!year || !monthName || !day) return value
  return `${day} ${monthName} ${year}`
}

/**
 * The leading segment of a stored birth location, for display only.
 *
 * "Redwood City, California, United States of America" is a full geocoder
 * string; the Dashboard wants the place a person would name. Nothing is
 * written back, and Profile still shows the canonical value in full -- this
 * narrows what is displayed, never what is stored. A value with no comma is
 * shown whole.
 */
function formatBirthPlace(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  return trimmed.split(',')[0].trim() || trimmed
}

/**
 * Quiet human context under the identity block.
 *
 * Segments that are missing are dropped rather than rendered as a dash, so
 * the separator never appears with nothing either side of it.
 */
function birthContextLine(profile: UserRow | null): string | null {
  if (!profile) return null

  const segments = [
    formatBirthDate(profile.birth_date),
    profile.birth_time ? formatShortTimeFromHHMM(profile.birth_time) : null,
    formatBirthPlace(profile.birth_location),
  ].filter((segment): segment is string => Boolean(segment))

  return segments.length > 0 ? segments.join(' · ') : null
}

/** The signs line: "☉ Virgo · ☽ Pisces", with either half omitted cleanly. */
function signsLine(sun: string | null, moon: string | null): string | null {
  const segments = [
    sun ? `${SUN_GLYPH} ${sun}` : null,
    moon ? `${MOON_GLYPH} ${moon}` : null,
  ].filter((segment): segment is string => Boolean(segment))

  return segments.length > 0 ? segments.join(' · ') : null
}

type GuidanceTab = 'today' | 'week'

type QuickDestinationProps = {
  icon: IconName
  label: string
  accessibilityLabel: string
  onPress: () => void
  testID: string
  /** The one gold destination. Exactly one is ever primary. */
  primary?: boolean
  disabled?: boolean
}

/**
 * One quick-navigation destination.
 *
 * Five of these share the width equally, each sized by `flex` rather than by a
 * percentage basis, so the strip reflows instead of overlapping when the
 * device font scale grows. Labels wrap; nothing is clamped. The visible label
 * is short enough to fit five across at 360dp, and the spoken label says what
 * pressing it actually does.
 *
 * Hierarchy is carried by ink, not by a full-width slab: the birth chart is
 * gold and the rest are secondary, so the flagship still reads as the thing to
 * do without a gold bar interrupting the screen.
 */
function QuickDestination({
  icon,
  label,
  accessibilityLabel,
  onPress,
  testID,
  primary = false,
  disabled = false,
}: QuickDestinationProps) {
  const tint = disabled
    ? theme.text.disabled
    : primary
      ? theme.accent.base
      : theme.text.secondary

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.destination,
        pressed && !disabled && styles.destinationPressed,
      ]}
    >
      <Icon name={icon} size="sm" color={tint} />
      <AppText
        variant="caption"
        style={[styles.destinationLabel, { color: tint }]}
      >
        {label}
      </AppText>
    </Pressable>
  )
}

type GuidanceTabButtonProps = {
  label: string
  selected: boolean
  onPress: () => void
  testID: string
}

/**
 * One guidance tab.
 *
 * A presentation selector, not navigation: it adds no route and changes no
 * param. Selection is carried by an indicator rule and a surface step as well
 * as by ink, so it survives being read without colour.
 */
function GuidanceTabButton({
  label,
  selected,
  onPress,
  testID,
}: GuidanceTabButtonProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.tab,
        selected && styles.tabSelected,
        pressed && styles.tabPressed,
      ]}
    >
      <AppText
        variant="subheading"
        style={[styles.tabLabel, selected && styles.tabLabelSelected]}
      >
        {label}
      </AppText>
      <View
        style={[styles.tabIndicator, selected && styles.tabIndicatorSelected]}
      />
    </Pressable>
  )
}

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30)

type GuidanceBuildContext = {
  natalPlanets: ChartData['planets']
  natalHouses: ChartData['houses']
  timeZone: string
  evaluatedAt: Date
}

function reflectionJournalPrefill(
  prompt: ReflectionPrompt,
  practice: SuggestedPractice,
  source: string
) {
  return {
    id: undefined,
    initialTitle: `Reflection — ${source}`,
    initialContent: '',
    promptTemplateId: prompt.id,
    promptSource: source,
    promptText: prompt.prompt,
    practiceSummary: practice.summary,
    practiceSteps: [...practice.steps],
  }
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sunSign, setSunSign] = useState<string | null>(null)
  const [moonSign, setMoonSign] = useState<string | null>(null)
  const [guidanceTab, setGuidanceTab] = useState<GuidanceTab>('today')
  // Held here rather than in the cards: only the active card is mounted, so a
  // card-local flag would be lost every time the reader changed tab.
  const [todayExpanded, setTodayExpanded] = useState(false)
  const [weeklyExpanded, setWeeklyExpanded] = useState(false)
  const [todayEnergy, setTodayEnergy] = useState<DailyGuidance | null>(null)
  const [weeklyForecast, setWeeklyForecast] =
    useState<WeeklyForecast | null>(null)

  const nav =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'Dashboard'>
    >()
  const insets = useSafeAreaInsets()

  const openJournalReflection = useCallback(
    (
      prompt: ReflectionPrompt,
      practice: SuggestedPractice,
      source: string
    ) => {
      nav.navigate(
        'JournalEditor',
        reflectionJournalPrefill(prompt, practice, source)
      )
    },
    [nav]
  )

  // signOut rejects on a network failure. Passed straight to onPress that
  // becomes an unhandled promise and the reader is told nothing, so this
  // mirrors what ProfileScreen already does with the same call.
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error')
    }
  }, [])

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
      if (!tz) {
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

      if (!(u.birth_date && u.birth_time)) {
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

      const existingValidation = existing?.chart_data
        ? validateChartData(existing.chart_data)
        : null

      if (existingValidation?.status === 'unsupported') {
        throw new Error(UNSUPPORTED_CHART_DATA_MESSAGE)
      }

      const existingChart =
        existingValidation?.status === 'valid'
          ? existingValidation.data
          : null

      let chartData = existingChart

      if (!chartData) {
        const calculationPreferences = await getChartCalculationPreferences(
          user.id
        )

        chartData = buildChartData(
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
              name: chartData.meta.name,
              birth_date: chartData.meta.birth_date,
              birth_time: chartData.meta.birth_time,
              time_zone: chartData.meta.time_zone,
              birth_lat: chartData.meta.birth_lat,
              birth_lon: chartData.meta.birth_lon,
              chart_data: chartData,
            })
          } catch (e) {
            console.warn('Auto-save failed:', e)
          }
        }
      }

      const hydratedChart = hydrateChartData({
        chartData,
        birthDate: u.birth_date,
        birthTime: u.birth_time,
        timeZone: tz,
        birthLat,
        birthLon,
      })
      const sun = hydratedChart.planets.find((p) => p.name === 'Sun')
      const moon = hydratedChart.planets.find((p) => p.name === 'Moon')

      setSunSign(sun ? ZODIAC[signOf(sun.lon)] : null)
      setMoonSign(moon ? ZODIAC[signOf(moon.lon)] : null)
      const guidanceContext: GuidanceBuildContext = {
        natalPlanets: hydratedChart.planets,
        natalHouses: hydratedChart.houses,
        evaluatedAt: new Date(),
        timeZone: tz,
      }

      setTodayEnergy(buildDailyGuidance(guidanceContext))
      setWeeklyForecast(buildWeeklyForecast(guidanceContext))
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

  const firstName = profile?.first_name?.trim() || ''
  const greeting = firstName ? `Hello, ${firstName}` : 'Hello'
  const signs = signsLine(sunSign, moonSign)
  const birthContext = birthContextLine(profile)
  const hasBirthMoment = Boolean(profile?.birth_date && profile?.birth_time)

  /*
   * One value drives both the action and its disabled reason, so the two can
   * never disagree. The old screen paired `disabled` with a separate early
   * return that silently did nothing -- unreachable in practice, and
   * unexplained if it had ever been reached.
   */
  const chartProfile =
    profile && !needsProfileCompletion(profile) ? profile : null
  const chartUnavailableReason = chartProfile
    ? null
    : 'Add your birth date, time and place to open your chart.'

  if (loading) {
    return <LoadingState label="Loading your dashboard" />
  }

  if (error) {
    return (
      <ErrorState
        testID="dashboard-error"
        title="Could not load your dashboard"
        description={error}
        action={{ label: 'Retry', onPress: load }}
        secondaryAction={{ label: 'Sign out', onPress: handleSignOut }}
      />
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        {
          paddingTop: insets.top + theme.space.xs,
          paddingBottom: insets.bottom + theme.space.xxxxxl,
        },
      ]}
    >
      {/*
        Identity first, and the reader's name is the largest thing on it. The
        app's own name was previously the headline, which told the reader
        where they were rather than who this is for.
      */}
      <View style={styles.identity}>
        <AppText variant="title" style={styles.greeting}>
          {greeting}
        </AppText>

        {signs ? (
          <AppText variant="bodySmall" style={styles.signs} testID="dashboard-signs">
            {signs}
          </AppText>
        ) : null}

        {birthContext ? (
          <AppText
            variant="caption"
            style={styles.birthContext}
            testID="dashboard-birth-context"
          >
            {birthContext}
          </AppText>
        ) : null}
      </View>

      {/*
        Quick navigation sits above the guidance rather than below it, so the
        places a reader might go are reachable without scrolling past the
        thing they came for. Kept deliberately quiet -- small, unbordered,
        secondary ink -- so it introduces the destinations without competing
        with the guidance or with the one gold action.
      */}
      <View style={styles.quickNav} accessibilityRole="menubar">
        <QuickDestination
          icon="charts"
          label="Chart"
          accessibilityLabel="View birth chart"
          testID="dashboard-utility-birth-chart"
          primary
          disabled={!chartProfile}
          onPress={() => {
            if (!chartProfile) return
            nav.navigate('Chart', { profile: chartProfile, chartMode: 'self' })
          }}
        />
        <QuickDestination
          icon="add"
          label="Guest"
          accessibilityLabel="Create guest chart"
          testID="dashboard-utility-guest-chart"
          onPress={() => nav.navigate('CreateGuestChart')}
        />
        <QuickDestination
          icon="library"
          label="Saved"
          accessibilityLabel="Open my charts"
          testID="dashboard-utility-my-charts"
          onPress={() => nav.navigate('MyCharts')}
        />
        <QuickDestination
          icon="journal"
          label="Journal"
          accessibilityLabel="Open journal"
          testID="dashboard-utility-journal"
          onPress={() => nav.navigate('JournalList')}
        />
        <QuickDestination
          icon="account"
          label="Profile"
          accessibilityLabel="Open my profile"
          testID="dashboard-utility-profile"
          onPress={() => nav.navigate('Profile')}
        />
      </View>

      {chartUnavailableReason ? (
        <AppText
          variant="caption"
          style={styles.actionReason}
          testID="dashboard-chart-unavailable"
        >
          {chartUnavailableReason}
        </AppText>
      ) : null}

      {!profile ? (
        <EmptyState
          testID="dashboard-no-profile"
          title="Your profile isn’t ready yet"
          description="It appears once you confirm your email from the sign-up message."
        />
      ) : null}

      {profile && !hasBirthMoment ? (
        <EmptyState
          testID="dashboard-no-birth-details"
          title="Add your birth details"
          description="Naksha needs your birth date and time before it can read today’s sky against your chart."
          action={{
            label: 'Add birth details',
            onPress: () => nav.navigate('CompleteProfile'),
          }}
        />
      ) : null}

      {/*
        Today and This Week are two views of one thing -- current guidance --
        so they are peers on a selector rather than a queue to scroll through.
        Stacked, they read as equal weight however the surfaces are stepped,
        and the screen ran to roughly two viewports.

        Only the selected card is rendered. Nothing is hidden: the inactive
        card occupies no layout and TalkBack cannot reach it, because it is
        not there.
      */}
      {todayEnergy || weeklyForecast ? (
        <>
          <View style={styles.tabs} accessibilityRole="tablist">
            <GuidanceTabButton
              label="Today"
              selected={guidanceTab === 'today'}
              onPress={() => setGuidanceTab('today')}
              testID="dashboard-tab-today"
            />
            <GuidanceTabButton
              label="This Week"
              selected={guidanceTab === 'week'}
              onPress={() => setGuidanceTab('week')}
              testID="dashboard-tab-week"
            />
          </View>

          {guidanceTab === 'today' && todayEnergy ? (
            <TodayEnergyCard
              guidance={todayEnergy}
              expanded={todayExpanded}
              onExpandedChange={setTodayExpanded}
              onJournalReflection={(prompt, practice) =>
                openJournalReflection(
                  prompt,
                  practice,
                  'Today’s Energy'
                )
              }
            />
          ) : null}

          {guidanceTab === 'week' && weeklyForecast ? (
            <WeeklyForecastCard
              forecast={weeklyForecast}
              expanded={weeklyExpanded}
              onExpandedChange={setWeeklyExpanded}
              onJournalReflection={(prompt, practice) =>
                openJournalReflection(
                  prompt,
                  practice,
                  'Weekly Forecast'
                )
              }
            />
          ) : null}
        </>
      ) : null}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: theme.space.xl,
  },
  identity: {
    marginBottom: theme.space.lg,
  },
  greeting: {
    color: theme.text.primary,
  },
  signs: {
    color: theme.accent.base,
    marginTop: theme.space.sm,
  },
  birthContext: {
    color: theme.text.tertiary,
    marginTop: theme.space.xs,
  },
  /*
   * Four equal columns. `flex` rather than a percentage basis, so the row
   * reflows under a larger font scale instead of overlapping, and no label is
   * clamped -- a wrapped "Journal" is legible, a clipped one is not.
   */
  quickNav: {
    flexDirection: 'row',
    marginBottom: theme.space.lg,
  },
  destination: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: theme.touchTarget.min,
    paddingHorizontal: theme.space.xs,
    paddingVertical: theme.space.sm,
    rowGap: theme.space.xs,
  },
  destinationPressed: {
    opacity: 0.7,
  },
  destinationLabel: {
    color: theme.text.secondary,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    columnGap: theme.space.sm,
    marginBottom: theme.space.md,
  },
  tab: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: theme.touchTarget.min,
    paddingTop: theme.space.sm,
    rowGap: theme.space.sm,
  },
  /* Selection is a surface step and an indicator rule, never colour alone. */
  tabSelected: {},
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    color: theme.text.tertiary,
    textAlign: 'center',
  },
  tabLabelSelected: {
    color: theme.text.primary,
  },
  tabIndicator: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.xs,
    height: 2,
    width: '100%',
  },
  tabIndicatorSelected: {
    backgroundColor: theme.accent.base,
  },
  actionReason: {
    color: theme.text.secondary,
    marginBottom: theme.space.md,
    textAlign: 'center',
  },
})
